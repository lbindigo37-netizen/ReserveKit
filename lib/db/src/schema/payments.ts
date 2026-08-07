import { integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { bookingsTable } from "./bookings";

export const paymentStatusEnum = pgEnum("payment_status", ["paid", "pending", "refunded"]);

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookingsTable.id, { onDelete: "cascade" })
    .unique(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  // "stripe" once real keys are configured, "mock" for realistic demo data.
  provider: text("provider").notNull().default("mock"),
  providerRef: text("provider_ref"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Payment = typeof paymentsTable.$inferSelect;
export type InsertPayment = typeof paymentsTable.$inferInsert;
export type PaymentStatus = Payment["status"];
