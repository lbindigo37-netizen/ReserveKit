import { Router, type IRouter } from "express";
import { and, eq, inArray, ne } from "drizzle-orm";
import {
  db,
  staffTable,
  staffWorkingHoursTable,
  staffVacationsTable,
  serviceStaffTable,
  bookingsTable,
  type Staff,
} from "@workspace/db";
import {
  CreateStaffBody,
  CreateStaffResponse,
  DeleteStaffParams,
  GetStaffResponse,
  UpdateStaffBody,
  UpdateStaffParams,
  UpdateStaffResponse,
} from "@workspace/api-zod";

import { requireAdmin } from "../middlewares/session";

const router: IRouter = Router();

async function toStaffResponse(staff: Staff[]) {
  if (staff.length === 0) return [];
  const ids = staff.map((member) => member.id);

  const [hours, vacations, serviceLinks, bookingCounts] = await Promise.all([
    db.select().from(staffWorkingHoursTable).where(inArray(staffWorkingHoursTable.staffId, ids)),
    db.select().from(staffVacationsTable).where(inArray(staffVacationsTable.staffId, ids)),
    db.select().from(serviceStaffTable).where(inArray(serviceStaffTable.staffId, ids)),
    db
      .select({ staffId: bookingsTable.staffId, id: bookingsTable.id })
      .from(bookingsTable)
      .where(and(inArray(bookingsTable.staffId, ids), ne(bookingsTable.status, "cancelled"))),
  ]);

  return staff.map((member) => {
    const memberHours = hours.filter((row) => row.staffId === member.id);
    const totalCapacityMinutes = memberHours.reduce((sum, row) => sum + (row.endMinute - row.startMinute), 0);
    const memberBookings = bookingCounts.filter((row) => row.staffId === member.id);
    // Rough utilization proxy for the demo dashboard: booked count relative
    // to a fixed reference load. Once real appointment durations are summed
    // over a rolling window this can be replaced with actual booked-minutes
    // over available-minutes.
    const utilization =
      totalCapacityMinutes > 0 ? Math.min(100, Math.round((memberBookings.length / 40) * 100)) : 0;

    return {
      ...member,
      utilization,
      bookings: memberBookings.length,
      workingHours: memberHours.map(({ weekday, startMinute, endMinute }) => ({ weekday, startMinute, endMinute })),
      vacations: vacations
        .filter((row) => row.staffId === member.id)
        .map(({ id, startDate, endDate, reason }) => ({ id, startDate, endDate, reason: reason ?? undefined })),
      serviceIds: serviceLinks.filter((row) => row.staffId === member.id).map((row) => row.serviceId),
    };
  });
}

router.get("/staff", async (_req, res) => {
  const rows = await db.select().from(staffTable);
  res.json(GetStaffResponse.parse(await toStaffResponse(rows)));
});

router.post("/staff", requireAdmin, async (req, res) => {
  const parsed = CreateStaffBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { workingHours, vacations, serviceIds, ...staffInput } = parsed.data;
  const initials = staffInput.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase())
    .slice(0, 2)
    .join("");

  const [staff] = await db
    .insert(staffTable)
    .values({ ...staffInput, initials: initials || "S", color: staffInput.color ?? "#c36b4f" })
    .returning();

  await applyStaffAssociations(staff.id, workingHours, vacations, serviceIds);

  const [withDetails] = await toStaffResponse([staff]);
  res.status(201).json(CreateStaffResponse.parse(withDetails));
});

router.patch("/staff/:id", requireAdmin, async (req, res) => {
  const params = UpdateStaffParams.safeParse(req.params);
  const body = UpdateStaffBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid staff update" });
    return;
  }
  const { workingHours, vacations, serviceIds, ...staffInput } = body.data;

  const [updated] = await db
    .update(staffTable)
    .set(staffInput)
    .where(eq(staffTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  await applyStaffAssociations(updated.id, workingHours, vacations, serviceIds);

  const [withDetails] = await toStaffResponse([updated]);
  res.json(UpdateStaffResponse.parse(withDetails));
});

router.delete("/staff/:id", requireAdmin, async (req, res) => {
  const params = DeleteStaffParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid staff id" });
    return;
  }
  await db.delete(staffTable).where(eq(staffTable.id, params.data.id));
  res.status(204).end();
});

async function applyStaffAssociations(
  staffId: number,
  workingHours: { weekday: number; startMinute: number; endMinute: number }[] | undefined,
  vacations: { startDate: string; endDate: string; reason?: string | null }[] | undefined,
  serviceIds: number[] | undefined,
): Promise<void> {
  if (workingHours !== undefined) {
    await db.delete(staffWorkingHoursTable).where(eq(staffWorkingHoursTable.staffId, staffId));
    if (workingHours.length) {
      await db.insert(staffWorkingHoursTable).values(workingHours.map((entry) => ({ staffId, ...entry })));
    }
  }

  if (vacations !== undefined) {
    await db.delete(staffVacationsTable).where(eq(staffVacationsTable.staffId, staffId));
    if (vacations.length) {
      await db.insert(staffVacationsTable).values(vacations.map((entry) => ({ staffId, ...entry })));
    }
  }

  if (serviceIds !== undefined) {
    await db.delete(serviceStaffTable).where(eq(serviceStaffTable.staffId, staffId));
    if (serviceIds.length) {
      await db.insert(serviceStaffTable).values(serviceIds.map((serviceId) => ({ serviceId, staffId })));
    }
  }
}

export default router;
