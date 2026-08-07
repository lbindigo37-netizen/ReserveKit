import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Single-row table: this template is deployed per-business, so there is
// always exactly one business configuration record (id = 1).
export const businessTable = pgTable("business", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  tagline: text("tagline").notNull(),
  bookingLabel: text("booking_label").notNull(),
  currency: text("currency").notNull().default("USD"),
  timezone: text("timezone").notNull().default("America/Los_Angeles"),
  accent: text("accent").notNull().default("#c36b4f"),
  primaryColor: text("primary_color").notNull().default("#c36b4f"),
  secondaryColor: text("secondary_color").notNull().default("#7e9381"),
  logoUrl: text("logo_url"),
  address: text("address"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  aboutTitle: text("about_title"),
  aboutBody: text("about_body"),
  bookingIntervalMinutes: integer("booking_interval_minutes").notNull().default(30),
  cancellationPolicy: text("cancellation_policy")
    .notNull()
    .default(
      "Cancel or reschedule up to 24 hours before your appointment at no charge.",
    ),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Default weekly operating hours for the business (used for the public
// "open today" display and as the default when a staff member has not
// configured their own hours).
export const businessHoursTable = pgTable("business_hours", {
  id: serial("id").primaryKey(),
  weekday: integer("weekday").notNull(), // 0 = Sunday .. 6 = Saturday
  startMinute: integer("start_minute").notNull(),
  endMinute: integer("end_minute").notNull(),
});

export type Business = typeof businessTable.$inferSelect;
export type InsertBusiness = typeof businessTable.$inferInsert;
export type BusinessHours = typeof businessHoursTable.$inferSelect;
export type InsertBusinessHours = typeof businessHoursTable.$inferInsert;
