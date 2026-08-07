import { inArray } from "drizzle-orm";
import { db, servicesTable, staffTable, paymentsTable, type Booking } from "@workspace/db";

import { minutesToTime } from "./time";

export type BookingResponse = {
  id: number;
  customer: string;
  email?: string;
  service: string;
  serviceId: number;
  staff: string;
  staffId: number;
  date: string;
  time: string;
  status: string;
  amount: number;
  payment: { status: string; amount: number; currency: string; provider: string; providerRef?: string };
};

/** Shapes DB booking rows into the API's flat Booking contract, resolving service/staff names and payment status. */
export async function toBookingResponse(bookings: Booking[]): Promise<BookingResponse[]> {
  if (bookings.length === 0) return [];

  const serviceIds = [...new Set(bookings.map((booking) => booking.serviceId))];
  const staffIds = [...new Set(bookings.map((booking) => booking.staffId))];
  const bookingIds = bookings.map((booking) => booking.id);

  const [services, staffMembers, payments] = await Promise.all([
    db.select().from(servicesTable).where(inArray(servicesTable.id, serviceIds)),
    db.select().from(staffTable).where(inArray(staffTable.id, staffIds)),
    db.select().from(paymentsTable).where(inArray(paymentsTable.bookingId, bookingIds)),
  ]);

  return bookings.map((booking) => {
    const service = services.find((item) => item.id === booking.serviceId);
    const staff = staffMembers.find((item) => item.id === booking.staffId);
    const payment = payments.find((item) => item.bookingId === booking.id);
    return {
      id: booking.id,
      customer: booking.customerName,
      email: booking.customerEmail,
      service: service?.name ?? "Unknown service",
      serviceId: booking.serviceId,
      staff: staff?.name ?? "Unknown staff",
      staffId: booking.staffId,
      date: booking.date,
      time: minutesToTime(booking.startMinute),
      status: booking.status,
      amount: booking.amount,
      payment: payment
        ? {
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            provider: payment.provider,
            providerRef: payment.providerRef ?? undefined,
          }
        : { status: "pending", amount: booking.amount, currency: "USD", provider: "mock" },
    };
  });
}
