import { Router, type IRouter } from "express";
import { desc, eq, ne } from "drizzle-orm";
import { db, customersTable, bookingsTable } from "@workspace/db";
import {
  GetCustomerParams,
  GetCustomerResponse,
  GetCustomersResponse,
  UpdateCustomerBody,
  UpdateCustomerParams,
  UpdateCustomerResponse,
} from "@workspace/api-zod";

import { requireAdmin } from "../middlewares/session";
import { toBookingResponse } from "../lib/booking-presenter";

const router: IRouter = Router();

async function customerSummaries() {
  const customers = await db.select().from(customersTable);
  const bookings = await db.select().from(bookingsTable).where(ne(bookingsTable.status, "cancelled"));

  return customers.map((customer) => {
    const customerBookings = bookings.filter((booking) => booking.customerId === customer.id);
    const spending = customerBookings
      .filter((booking) => booking.status === "completed")
      .reduce((sum, booking) => sum + booking.amount, 0);
    const lastVisit = customerBookings
      .map((booking) => booking.date)
      .sort()
      .at(-1);

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? undefined,
      initials: customer.initials,
      color: customer.color,
      visits: customerBookings.length,
      spending,
      lastVisit: lastVisit ?? customer.createdAt.toISOString().slice(0, 10),
      notes: customer.notes ?? undefined,
    };
  });
}

router.get("/customers", requireAdmin, async (_req, res) => {
  const summaries = await customerSummaries();
  res.json(GetCustomersResponse.parse(summaries));
});

router.get("/customers/:id", requireAdmin, async (req, res) => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid customer id" });
    return;
  }
  const summaries = await customerSummaries();
  const customer = summaries.find((item) => item.id === params.data.id);
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const rows = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.customerId, params.data.id))
    .orderBy(desc(bookingsTable.date), desc(bookingsTable.startMinute));

  res.json(GetCustomerResponse.parse({ customer, bookings: await toBookingResponse(rows) }));
});

router.patch("/customers/:id", requireAdmin, async (req, res) => {
  const params = UpdateCustomerParams.safeParse(req.params);
  const body = UpdateCustomerBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid customer update" });
    return;
  }

  const [updated] = await db
    .update(customersTable)
    .set(body.data)
    .where(eq(customersTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const summaries = await customerSummaries();
  const summary = summaries.find((item) => item.id === updated.id)!;
  res.json(UpdateCustomerResponse.parse(summary));
});

export default router;
