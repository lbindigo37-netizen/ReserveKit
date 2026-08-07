import { boolean, integer, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";

import { staffTable } from "./staff";

export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // minutes
  bufferMinutes: integer("buffer_minutes").notNull().default(0),
  price: integer("price").notNull(), // whole currency units, e.g. dollars
  color: text("color").notNull(),
  imageUrl: text("image_url"),
  popular: boolean("popular").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Which staff members can perform a given service.
export const serviceStaffTable = pgTable(
  "service_staff",
  {
    serviceId: integer("service_id")
      .notNull()
      .references(() => servicesTable.id, { onDelete: "cascade" }),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staffTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.serviceId, table.staffId] })],
);

export type Service = typeof servicesTable.$inferSelect;
export type InsertService = typeof servicesTable.$inferInsert;
export type ServiceStaff = typeof serviceStaffTable.$inferSelect;
