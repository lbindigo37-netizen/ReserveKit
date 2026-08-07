import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { servicesTable } from "./services";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  serviceId: integer("service_id").references(() => servicesTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Review = typeof reviewsTable.$inferSelect;
export type InsertReview = typeof reviewsTable.$inferInsert;
