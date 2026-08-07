import { integer, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";

import { servicesTable } from "./services";
import { usersTable } from "./users";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  initials: text("initials").notNull(),
  color: text("color").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customerFavoritesTable = pgTable(
  "customer_favorites",
  {
    customerId: integer("customer_id")
      .notNull()
      .references(() => customersTable.id, { onDelete: "cascade" }),
    serviceId: integer("service_id")
      .notNull()
      .references(() => servicesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.customerId, table.serviceId] })],
);

export type Customer = typeof customersTable.$inferSelect;
export type InsertCustomer = typeof customersTable.$inferInsert;
export type CustomerFavorite = typeof customerFavoritesTable.$inferSelect;
