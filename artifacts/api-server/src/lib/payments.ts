import { eq } from "drizzle-orm";
import { db, paymentsTable, type BookingStatus, type PaymentStatus } from "@workspace/db";

/**
 * Payment status mirrors booking lifecycle in this mock/demo integration:
 * a payment is authorized ("pending") when the booking is created, captured
 * ("paid") once the appointment is completed, and "refunded" if a paid
 * booking is later cancelled. This keeps the UI's payment story consistent
 * without requiring live Stripe keys (see PROJECT.md "PAYMENTS" section).
 */
export function paymentStatusForBookingStatus(
  bookingStatus: BookingStatus,
  currentPaymentStatus: PaymentStatus,
): PaymentStatus {
  if (bookingStatus === "completed") return "paid";
  if (bookingStatus === "cancelled") return currentPaymentStatus === "paid" ? "refunded" : "pending";
  return currentPaymentStatus;
}

export async function syncPaymentForBooking(bookingId: number, bookingStatus: BookingStatus): Promise<void> {
  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.bookingId, bookingId)).limit(1);
  if (!payment) return;

  const nextStatus = paymentStatusForBookingStatus(bookingStatus, payment.status);
  if (nextStatus !== payment.status) {
    await db
      .update(paymentsTable)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(paymentsTable.bookingId, bookingId));
  }
}
