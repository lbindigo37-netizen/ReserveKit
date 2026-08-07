import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, bookingsTable, customersTable, servicesTable, staffTable } from "@workspace/db";
import { GetAnalyticsResponse, GetDashboardResponse } from "@workspace/api-zod";

import { requireAdmin } from "../middlewares/session";
import { toBookingResponse } from "../lib/booking-presenter";

const router: IRouter = Router();

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get("/dashboard", requireAdmin, async (_req, res) => {
  const today = todayDateString();
  const allBookings = await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt));
  const activeBookings = allBookings.filter((booking) => booking.status !== "cancelled");

  const todayAppointments = activeBookings.filter((booking) => booking.date === today).length;
  const revenue = allBookings
    .filter((booking) => booking.status === "completed")
    .reduce((sum, booking) => sum + booking.amount, 0);
  const pending = allBookings.filter((booking) => booking.status === "pending").length;
  const customerCount = (await db.select({ id: customersTable.id }).from(customersTable)).length;

  const upcoming = activeBookings
    .filter((booking) => booking.date >= today && booking.status === "confirmed")
    .sort((a, b) => (a.date === b.date ? a.startMinute - b.startMinute : a.date < b.date ? -1 : 1))
    .slice(0, 5);

  const recentCustomerRows = await db
    .select()
    .from(customersTable)
    .orderBy(desc(customersTable.createdAt))
    .limit(5);
  const recentCustomers = recentCustomerRows.map((customer) => {
    const customerBookings = activeBookings.filter((booking) => booking.customerId === customer.id);
    const spending = customerBookings
      .filter((booking) => booking.status === "completed")
      .reduce((sum, booking) => sum + booking.amount, 0);
    const lastVisit = customerBookings.map((booking) => booking.date).sort().at(-1);
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? undefined,
      initials: customer.initials,
      color: customer.color,
      visits: customerBookings.length,
      spending,
      lastVisit: lastVisit ?? customer.createdAt.toISOString().slice(0, 10),
      notes: customer.notes ?? undefined,
    };
  });

  const recentActivity = allBookings.slice(0, 8).map((booking) => ({
    id: booking.id,
    message: `${booking.customerName}'s booking is ${booking.status}`,
    timestamp: booking.updatedAt.toISOString(),
  }));

  res.json(
    GetDashboardResponse.parse({
      todayAppointments,
      revenue,
      pending,
      customers: customerCount,
      upcoming: await toBookingResponse(upcoming),
      recentCustomers,
      recentActivity,
    }),
  );
});

router.get("/analytics", requireAdmin, async (_req, res) => {
  const bookings = await db.select().from(bookingsTable);
  const activeBookings = bookings.filter((booking) => booking.status !== "cancelled");
  const services = await db.select().from(servicesTable);
  const staffMembers = await db.select().from(staffTable);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const bookingsByDayCounts = new Array(7).fill(0);
  const monthLabels: string[] = [];
  const revenueByMonthMap = new Map<string, number>();

  for (const booking of activeBookings) {
    const [year, month, day] = booking.date.split("-").map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    bookingsByDayCounts[weekday] += 1;

    if (booking.status === "completed") {
      const monthKey = `${year}-${String(month).padStart(2, "0")}`;
      revenueByMonthMap.set(monthKey, (revenueByMonthMap.get(monthKey) ?? 0) + booking.amount);
      if (!monthLabels.includes(monthKey)) monthLabels.push(monthKey);
    }
  }

  monthLabels.sort();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const revenueByMonth = monthLabels.slice(-6).map((key) => ({
    label: monthNames[Number(key.split("-")[1]) - 1],
    value: revenueByMonthMap.get(key) ?? 0,
  }));

  const bookingsByDay = dayLabels.map((label, index) => ({ label, value: bookingsByDayCounts[index] }));

  const popularityCounts = new Map<number, number>();
  for (const booking of activeBookings) {
    popularityCounts.set(booking.serviceId, (popularityCounts.get(booking.serviceId) ?? 0) + 1);
  }
  const popularServices = services
    .map((service) => ({ label: service.name, value: popularityCounts.get(service.id) ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const staffBookingCounts = new Map<number, number>();
  for (const booking of activeBookings) {
    staffBookingCounts.set(booking.staffId, (staffBookingCounts.get(booking.staffId) ?? 0) + 1);
  }
  const staffUtilization = staffMembers.map((member) => ({
    label: member.name,
    value: Math.min(100, Math.round(((staffBookingCounts.get(member.id) ?? 0) / 40) * 100)),
  }));

  const customersWithMultipleVisits = new Map<number | null, number>();
  for (const booking of activeBookings) {
    customersWithMultipleVisits.set(
      booking.customerId,
      (customersWithMultipleVisits.get(booking.customerId) ?? 0) + 1,
    );
  }
  const totalCustomersWithVisits = customersWithMultipleVisits.size;
  const returningCustomers = [...customersWithMultipleVisits.values()].filter((count) => count > 1).length;
  const returningRate =
    totalCustomersWithVisits > 0 ? Math.round((returningCustomers / totalCustomersWithVisits) * 100) : 0;

  res.json(
    GetAnalyticsResponse.parse({
      bookingsByDay,
      revenueByMonth,
      popularServices,
      staffUtilization,
      returningRate,
    }),
  );
});

export default router;
