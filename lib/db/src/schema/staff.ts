import { boolean, date, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const staffTable = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  initials: text("initials").notNull(),
  color: text("color").notNull(),
  photoUrl: text("photo_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const staffWorkingHoursTable = pgTable("staff_working_hours", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staffTable.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(), // 0 = Sunday .. 6 = Saturday
  startMinute: integer("start_minute").notNull(),
  endMinute: integer("end_minute").notNull(),
});

export const staffVacationsTable = pgTable("staff_vacations", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staffTable.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
});

export type Staff = typeof staffTable.$inferSelect;
export type InsertStaff = typeof staffTable.$inferInsert;
export type StaffWorkingHours = typeof staffWorkingHoursTable.$inferSelect;
export type InsertStaffWorkingHours = typeof staffWorkingHoursTable.$inferInsert;
export type StaffVacation = typeof staffVacationsTable.$inferSelect;
export type InsertStaffVacation = typeof staffVacationsTable.$inferInsert;
