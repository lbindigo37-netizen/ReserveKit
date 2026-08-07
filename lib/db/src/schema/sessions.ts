import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { usersTable } from "./users";

// Opaque server-side session tokens (stored hashed). Cookie-based auth for a
// browser app: sessions can be revoked immediately (unlike stateless JWTs),
// which matters for admin/customer role changes and logout-everywhere flows.
export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(), // sha256 hash of the raw session token
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type Session = typeof sessionsTable.$inferSelect;
export type InsertSession = typeof sessionsTable.$inferInsert;
