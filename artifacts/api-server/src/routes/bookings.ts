import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  db,
  bookingsTable,
  servicesTable,
  staffTable,
  customersTable,
  paymentsTable,
  businessTable,
  type Booking,
} from "@workspace/db";
import {
  CreateBookingBody,
  CreateBookingResponse,
  GetBookingsQueryParams,
  GetBookingsResponse,
  GetMyBookingsResponse,
  RescheduleBookingBody,
  RescheduleBookingParams,
  RescheduleBookingResponse,
  UpdateBookingStatusBody,
  UpdateBookingStatusParams,
  UpdateBookingStatusResponse,
} from "@workspace/api-zod";

import { requireAdmin, requireAuth } from "../middlewares/session";
import { assertSlotAvailable, BookingConflictError, NotFoundError } from "../lib/availability";
import { minutesToTime, isValidDateString, isValidTimeString } from "../lib/time";
import { createNotification, sendBookingEmail } from "../lib/notify";
import { syncPaymentForBooking } from "../lib/payments";
import { toBookingResponse } from "../lib/booking-presenter";

const router: IRouter = Router();

router.get("/bookings", requireAdmin, async (req, res) => {
  const parsed = GetBookingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status, search } = parsed.data;

  const conditions = [];
  if (status) conditions.push(eq(bookingsTable.status, status.toLowerCase() as Booking["status"]));

  let rows = await db
    .select()
    .from(bookingsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(bookingsTable.date), desc(bookingsTable.startMinute));

  if (search) {
    const responses = await toBookingResponse(rows);
    const normalized = search.toLowerCase();
    const matchingIds = new Set(
      responses
        .filter((booking) =>
          [booking.customer, booking.service, booking.staff, booking.email ?? ""].some((value) =>
            value.toLowerCase().includes(normalized),
          ),
        )
        .map((booking) => booking.id),
    );
    rows = rows.filter((row) => matchingIds.has(row.id));
  }

  res.json(GetBookingsResponse.parse(await toBookingResponse(rows)));
});

router.get("/bookings/mine", requireAuth, async (req, res) => {
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.userId, req.user!.id)).limit(1);
  if (!customer) {
    res.json(GetMyBookingsResponse.parse([]));
    return;
  }
  const rows = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.customerId, customer.id))
    .orderBy(desc(bookingsTable.date), desc(bookingsTable.startMinute));
  res.json(GetMyBookingsResponse.parse(await toBookingResponse(rows)));
});

router.post("/bookings", async (req, res) => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { customer, email, serviceId, staffId, date, time } = parsed.data;
  if (!isValidDateString(date) || !isValidTimeString(time)) {
    res.status(400).json({ error: "Invalid date or time" });
    return;
  }

  let slot;
  try {
    slot = await assertSlotAvailable(serviceId, staffId, date, time);
  } catch (err) {
    if (err instanceof BookingConflictError) {
      res.status(409).json({ error: err.message });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Link to the authenticated customer's record when logged in, otherwise
  // to (or creating) a guest customer profile keyed by email so booking
  // history and spend tracking still work for guest checkouts.
  let customerId: number | null = null;
  if (req.user) {
    const [linked] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.userId, req.user.id))
      .limit(1);
    customerId = linked?.id ?? null;
  }
  if (!customerId) {
    const [existingGuest] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.email, normalizedEmail))
      .limit(1);
    if (existingGuest) {
      customerId = existingGuest.id;
    } else {
      const initials = customer
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0]!.toUpperCase())
        .slice(0, 2)
        .join("");
      const [created] = await db
        .insert(customersTable)
        .values({ name: customer, email: normalizedEmail, initials: initials || "G", color: "#7e9381" })
        .returning();
      customerId = created.id;
    }
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      customerId,
      customerName: customer,
      customerEmail: normalizedEmail,
      serviceId,
      staffId,
      date,
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
      status: "pending",
      amount: slot.service.price,
    })
    .returning();

  await db.insert(paymentsTable).values({
    bookingId: booking.id,
    amount: slot.service.price,
    status: "pending",
    provider: process.env.STRIPE_SECRET_KEY ? "stripe" : "mock",
  });

  const [business] = await db.select().from(businessTable).limit(1);
  await sendBookingEmail("confirmation", normalizedEmail, {
    customerName: customer,
    service: slot.service.name,
    staff: slot.staff.name,
    date,
    time,
    businessName: business?.name ?? "ReserveKit",
  }).catch(() => undefined);

  if (req.user) {
    await createNotification(
      req.user.id,
      "booking_confirmation",
      "Booking received",
      `Your ${slot.service.name} with ${slot.staff.name} on ${date} at ${time} is pending confirmation.`,
    );
  }

  const [response] = await toBookingResponse([booking]);
  res.status(201).json(CreateBookingResponse.parse(response));
});

router.patch("/bookings/:id/status", requireAdmin, async (req, res) => {
  const params = UpdateBookingStatusParams.safeParse(req.params);
  const body = UpdateBookingStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid booking status update" });
    return;
  }
  const status = body.data.status.toLowerCase();
  if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
    res.status(400).json({ error: "Invalid status value" });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set({ status: status as Booking["status"], updatedAt: new Date() })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  await syncPaymentForBooking(booking.id, booking.status);

  if (booking.status === "cancelled" || booking.status === "completed") {
    const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, booking.serviceId)).limit(1);
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, booking.staffId)).limit(1);
    const [business] = await db.select().from(businessTable).limit(1);
    await sendBookingEmail(booking.status, booking.customerEmail, {
      customerName: booking.customerName,
      service: service?.name ?? "",
      staff: staff?.name ?? "",
      date: booking.date,
      time: minutesToTime(booking.startMinute),
      businessName: business?.name ?? "ReserveKit",
    }).catch(() => undefined);
  }

  const [response] = await toBookingResponse([booking]);
  res.json(UpdateBookingStatusResponse.parse(response));
});

router.patch("/bookings/:id/reschedule", async (req, res) => {
  const params = RescheduleBookingParams.safeParse(req.params);
  const body = RescheduleBookingBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid reschedule request" });
    return;
  }
  const { date, time } = body.data;
  if (!isValidDateString(date) || !isValidTimeString(time)) {
    res.status(400).json({ error: "Invalid date or time" });
    return;
  }

  const [existing] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  // A booking may be rescheduled by the admin, or by the authenticated
  // customer who owns it. Guest (unauthenticated) bookings cannot be
  // self-service rescheduled through this endpoint; a guest would need to
  // create an account or contact the business to move their appointment.
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (req.user.role !== "admin") {
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.userId, req.user.id))
      .limit(1);
    if (!customer || existing.customerId !== customer.id) {
      res.status(403).json({ error: "You can only reschedule your own bookings" });
      return;
    }
  }

  let slot;
  try {
    slot = await assertSlotAvailable(existing.serviceId, existing.staffId, date, time, {
      excludeBookingId: existing.id,
    });
  } catch (err) {
    if (err instanceof BookingConflictError) {
      res.status(409).json({ error: err.message });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    throw err;
  }

  const [updated] = await db
    .update(bookingsTable)
    .set({
      date,
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
      status: "pending",
      updatedAt: new Date(),
    })
    .where(eq(bookingsTable.id, existing.id))
    .returning();

  const [response] = await toBookingResponse([updated]);
  res.json(RescheduleBookingResponse.parse(response));
});

export default router;
