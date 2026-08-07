import { date, integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { customersTable } from "./customers";
import { servicesTable } from "./services";
import { staffTable } from "./staff";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customersTable.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  serviceId: integer("service_id")
    .notNull()
    .references(() => servicesTable.id),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staffTable.id),
  date: date("date").notNull(), // 'YYYY-MM-DD', business-local
  startMinute: integer("start_minute").notNull(), // minutes since midnight, business-local
  endMinute: integer("end_minute").notNull(),
  status: bookingStatusEnum("status").notNull().default("pending"),
  amount: integer("amount").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Booking = typeof bookingsTable.$inferSelect;
export type InsertBooking = typeof bookingsTable.$inferInsert;
export type BookingStatus = Booking["status"];
