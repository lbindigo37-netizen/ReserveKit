import { and, eq, ne } from "drizzle-orm";
import {
  db,
  servicesTable,
  staffTable,
  staffWorkingHoursTable,
  staffVacationsTable,
  bookingsTable,
  businessTable,
  type Service,
  type Staff,
} from "@workspace/db";

import { isDateWithinRange, minutesToTime, timeToMinutes, weekdayOf } from "./time";

export class BookingConflictError extends Error {}
export class NotFoundError extends Error {}

/**
 * Computes bookable start times (as "HH:MM") for a service + staff member on
 * a given date, honoring the staff member's weekly working hours, vacations,
 * existing bookings (with the service's buffer time), and the business's
 * booking interval.
 */
export async function computeAvailableSlots(
  serviceId: number,
  staffId: number,
  date: string,
  options?: { excludeBookingId?: number },
): Promise<string[]> {
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId)).limit(1);
  const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, staffId)).limit(1);
  if (!service || !staff) {
    throw new NotFoundError("Service or staff member not found");
  }

  const [business] = await db.select().from(businessTable).limit(1);
  const intervalMinutes = business?.bookingIntervalMinutes ?? 30;

  const vacations = await db
    .select()
    .from(staffVacationsTable)
    .where(eq(staffVacationsTable.staffId, staffId));
  const onVacation = vacations.some((vacation) =>
    isDateWithinRange(date, vacation.startDate, vacation.endDate),
  );
  if (onVacation) return [];

  const weekday = weekdayOf(date);
  const hours = await db
    .select()
    .from(staffWorkingHoursTable)
    .where(and(eq(staffWorkingHoursTable.staffId, staffId), eq(staffWorkingHoursTable.weekday, weekday)));
  if (hours.length === 0) return [];

  const existingBookingsQuery = db
    .select({
      startMinute: bookingsTable.startMinute,
      endMinute: bookingsTable.endMinute,
      id: bookingsTable.id,
    })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.staffId, staffId),
        eq(bookingsTable.date, date),
        ne(bookingsTable.status, "cancelled"),
      ),
    );
  const existingBookings = (await existingBookingsQuery).filter(
    (booking) => booking.id !== options?.excludeBookingId,
  );

  const totalDuration = service.duration + service.bufferMinutes;
  const slots: string[] = [];

  for (const window of hours) {
    for (
      let start = window.startMinute;
      start + totalDuration <= window.endMinute;
      start += intervalMinutes
    ) {
      const end = start + totalDuration;
      const overlaps = existingBookings.some(
        (booking) => start < booking.endMinute && end > booking.startMinute,
      );
      if (!overlaps) {
        slots.push(minutesToTime(start));
      }
    }
  }

  return slots;
}

/**
 * Validates that `date`/`time` is currently bookable for the given service
 * and staff member, throwing `BookingConflictError` if not. Returns the
 * resolved service/staff records and minute range so callers can persist the
 * booking without a second lookup.
 */
export async function assertSlotAvailable(
  serviceId: number,
  staffId: number,
  date: string,
  time: string,
  options?: { excludeBookingId?: number },
): Promise<{ service: Service; staff: Staff; startMinute: number; endMinute: number }> {
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId)).limit(1);
  const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, staffId)).limit(1);
  if (!service || !staff) {
    throw new NotFoundError("Service or staff member not found");
  }

  const slots = await computeAvailableSlots(serviceId, staffId, date, options);
  if (!slots.includes(time)) {
    throw new BookingConflictError("That time slot is no longer available");
  }

  const startMinute = timeToMinutes(time);
  const endMinute = startMinute + service.duration + service.bufferMinutes;
  return { service, staff, startMinute, endMinute };
}
