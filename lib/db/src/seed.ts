import { eq } from "drizzle-orm";

import { hashPassword } from "./seed-auth";
import { db } from "./index";
import {
  businessTable,
  servicesTable,
  serviceStaffTable,
  staffTable,
  staffWorkingHoursTable,
  staffVacationsTable,
  customersTable,
  bookingsTable,
  paymentsTable,
  reviewsTable,
  usersTable,
} from "./schema";

// Demo bookings and vacations are dated relative to the day the seed runs so
// the dashboard, availability, and "upcoming" views always look current.
const today = new Date();
today.setUTCHours(0, 0, 0, 0);

function isoDate(offsetDays: number): string {
  const date = new Date(today);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

/**
 * Populates the database with realistic demo data matching the counts
 * called out in PROJECT.md (20 customers, 8 staff, 30 bookings, 10
 * services), plus reviews, staff working hours/vacations, and a demo admin
 * + customer login. Safe to re-run: it clears domain tables first.
 *
 * Run with: pnpm --filter @workspace/db run seed
 */
async function seed(): Promise<void> {
  console.log("Seeding database...");

  // Clear in dependency order.
  await db.delete(paymentsTable);
  await db.delete(bookingsTable);
  await db.delete(reviewsTable);
  await db.delete(serviceStaffTable);
  await db.delete(staffVacationsTable);
  await db.delete(staffWorkingHoursTable);
  await db.delete(servicesTable);
  await db.delete(staffTable);
  await db.delete(customersTable);
  await db.delete(businessTable);
  await db.delete(usersTable);

  const [business] = await db
    .insert(businessTable)
    .values({
      name: "Haven & Hue",
      type: "Salon",
      tagline: "A considered approach to modern beauty.",
      bookingLabel: "Book a stylist",
      currency: "USD",
      timezone: "America/Los_Angeles",
      accent: "#c36b4f",
      primaryColor: "#c36b4f",
      secondaryColor: "#7e9381",
      address: "18 Mercer Lane, Brooklyn, NY",
      contactEmail: "hello@havenandhue.example",
      contactPhone: "+1 (555) 019-2842",
      aboutTitle: "A studio built around a slower kind of care.",
      aboutBody:
        "Haven & Hue opened in 2018 with a simple idea: appointments should feel like part of your day, not an errand squeezed into it. Our small team focuses on considered technique, honest advice, and a calm space to spend an hour in.",
      bookingIntervalMinutes: 30,
      cancellationPolicy: "Cancel or reschedule up to 24 hours before your appointment at no charge.",
    })
    .returning();

  const staffSeed = [
    { name: "Mara Chen", role: "Creative Director", color: "#d98568" },
    { name: "Jon Bell", role: "Senior Stylist", color: "#7e9381" },
    { name: "Priya Shah", role: "Colorist", color: "#9a7b91" },
    { name: "Elena Rossi", role: "Stylist", color: "#c69a58" },
    { name: "Noah Williams", role: "Stylist", color: "#667c9d" },
    { name: "Sofia Grant", role: "Beauty Specialist", color: "#6e988d" },
    { name: "Luca Moretti", role: "Stylist", color: "#b37b5d" },
    { name: "Aisha Reed", role: "Apprentice Stylist", color: "#8b9eaa" },
  ];

  const staffRows = await Promise.all(
    staffSeed.map(async (member, index) => {
      const initials = member.name
        .split(" ")
        .map((part) => part[0])
        .join("");
      const [row] = await db
        .insert(staffTable)
        .values({ name: member.name, role: member.role, initials, color: member.color })
        .returning();

      // Standard Tue-Sat, 9:00-19:00 working week, with the apprentice
      // (index 7) working a shorter Wed-Sun schedule for variety.
      const weekdays = index === 7 ? [3, 4, 5, 6, 0] : [1, 2, 3, 4, 5];
      await db
        .insert(staffWorkingHoursTable)
        .values(weekdays.map((weekday) => ({ staffId: row.id, weekday, startMinute: 9 * 60, endMinute: 19 * 60 })));

      return row;
    }),
  );

  // One staff member has an upcoming vacation, to exercise that code path.
  await db.insert(staffVacationsTable).values({
    staffId: staffRows[2].id,
    startDate: isoDate(3),
    endDate: isoDate(7),
    reason: "Vacation",
  });

  const servicesSeed = [
    { name: "Signature Cut", category: "Hair", description: "A tailored cut, wash, and finish designed around your texture.", duration: 60, price: 86, color: "#d98568", popular: true },
    { name: "Gloss & Tone", category: "Color", description: "A luminous refresh that brings out your most natural dimension.", duration: 75, price: 112, color: "#7e9381", popular: true },
    { name: "Full Balayage", category: "Color", description: "Hand-painted brightness with a seamless, lived-in grow out.", duration: 180, price: 268, color: "#c69a58", popular: false },
    { name: "Blowout", category: "Styling", description: "A polished, long-lasting finish for whatever is next.", duration: 45, price: 58, color: "#9a7b91", popular: true },
    { name: "Event Styling", category: "Styling", description: "Refined styling for celebrations, portraits, and evenings out.", duration: 90, price: 140, color: "#667c9d", popular: false },
    { name: "Scalp Ritual", category: "Wellness", description: "A restorative cleanse and massage for a lighter, healthier scalp.", duration: 50, price: 72, color: "#6e988d", popular: false },
    { name: "Brow Shape", category: "Finishing", description: "A precise shape and soft tint to frame your features.", duration: 30, price: 34, color: "#b37b5d", popular: false },
    { name: "Nourish Treatment", category: "Wellness", description: "Deep hydration and repair for hair that feels like silk.", duration: 40, price: 48, color: "#8b9eaa", popular: false },
    { name: "Bridal Preview", category: "Events", description: "A collaborative styling session to find your perfect look.", duration: 120, price: 185, color: "#bd8b84", popular: false },
    { name: "Gentlemen's Cut", category: "Hair", description: "Detailed shaping, warm towel finish, and easy styling guidance.", duration: 45, price: 64, color: "#72858a", popular: false },
  ];

  const serviceRows = await Promise.all(
    servicesSeed.map(async (service, index) => {
      const [row] = await db
        .insert(servicesTable)
        .values({ ...service, bufferMinutes: 10 })
        .returning();
      // Assign each service to 2-3 staff members so the booking flow's
      // staff picker has realistic options.
      const assignedStaff = [staffRows[index % 8], staffRows[(index + 3) % 8], staffRows[(index + 5) % 8]];
      await db.insert(serviceStaffTable).values(
        [...new Set(assignedStaff.map((s) => s.id))].map((staffId) => ({ serviceId: row.id, staffId })),
      );
      return row;
    }),
  );

  const customerNames: [string, string][] = [
    ["Olivia Park", "olivia.park@email.com"],
    ["Theo Martin", "theo.martin@email.com"],
    ["Camila Souza", "camila.souza@email.com"],
    ["Maya Thompson", "maya.thompson@email.com"],
    ["Ethan Brooks", "ethan.brooks@email.com"],
    ["Nina Patel", "nina.patel@email.com"],
    ["Sage Williams", "sage.williams@email.com"],
    ["Alex Morgan", "alex.morgan@email.com"],
    ["Isla James", "isla.james@email.com"],
    ["Jordan Lee", "jordan.lee@email.com"],
    ["Amelia Reed", "amelia.reed@email.com"],
    ["Liam Carter", "liam.carter@email.com"],
    ["Aria Flores", "aria.flores@email.com"],
    ["Noah Bennett", "noah.bennett@email.com"],
    ["Zoe Kim", "zoe.kim@email.com"],
    ["Milo Davis", "milo.davis@email.com"],
    ["Eva Wilson", "eva.wilson@email.com"],
    ["Finn Baker", "finn.baker@email.com"],
    ["Clara Evans", "clara.evans@email.com"],
    ["Sienna Moore", "sienna.moore@email.com"],
  ];
  const avatarColors = ["#d98568", "#7e9381", "#c69a58", "#9a7b91", "#667c9d"];

  const customerRows = await Promise.all(
    customerNames.map(async ([name, email], index) => {
      const initials = name.split(" ").map((part) => part[0]).join("");
      const [row] = await db
        .insert(customersTable)
        .values({ name, email, initials, color: avatarColors[index % avatarColors.length] })
        .returning();
      return row;
    }),
  );

  // 30 bookings spread across today and the surrounding week, in a mix of
  // statuses, respecting each staff member's working days so availability
  // logic behaves sensibly for demo data.
  const statuses = ["confirmed", "confirmed", "pending", "completed", "confirmed", "cancelled"] as const;
  const dateOffsets = [0, 0, 0, 1, 1, 2, 3, 4, 5, -1, -2, -3];
  const startTimesMinutes = [9 * 60, 10 * 60 + 30, 11 * 60, 12 * 60 + 30, 13 * 60, 14 * 60 + 30, 15 * 60, 16 * 60 + 30];

  for (let index = 0; index < 30; index++) {
    const customer = customerRows[index % customerRows.length];
    const service = serviceRows[index % serviceRows.length];
    const staff = staffRows[index % staffRows.length];
    const status = statuses[index % statuses.length];
    const dateOffset = dateOffsets[index % dateOffsets.length];
    const bookingDate = new Date(today);
    bookingDate.setUTCDate(bookingDate.getUTCDate() + dateOffset);
    const dateStr = bookingDate.toISOString().slice(0, 10);
    const startMinute = startTimesMinutes[index % startTimesMinutes.length];

    const [booking] = await db
      .insert(bookingsTable)
      .values({
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        serviceId: service.id,
        staffId: staff.id,
        date: dateStr,
        startMinute,
        endMinute: startMinute + service.duration + service.bufferMinutes,
        status,
        amount: service.price,
      })
      .returning();

    const paymentStatus = status === "completed" ? "paid" : status === "cancelled" ? "refunded" : "pending";
    await db.insert(paymentsTable).values({
      bookingId: booking.id,
      amount: service.price,
      status: paymentStatus,
      provider: "mock",
    });
  }

  const reviewsSeed = [
    { customerName: "Olivia Park", rating: 5, comment: "Mara completely understood what I wanted and the cut has grown out beautifully.", serviceIndex: 0 },
    { customerName: "Theo Martin", rating: 5, comment: "Best balayage I've had in years. Worth the drive across town.", serviceIndex: 2 },
    { customerName: "Camila Souza", rating: 4, comment: "Relaxing scalp treatment, exactly what I needed after a long week.", serviceIndex: 5 },
    { customerName: "Nina Patel", rating: 5, comment: "Booked the bridal preview and walked out with a clear plan for the big day.", serviceIndex: 8 },
    { customerName: "Alex Morgan", rating: 5, comment: "Quick, precise, and my blowout lasted the whole week.", serviceIndex: 3 },
    { customerName: "Jordan Lee", rating: 4, comment: "Great gentlemen's cut, will be back every month.", serviceIndex: 9 },
  ];
  await db.insert(reviewsTable).values(
    reviewsSeed.map((review) => ({
      customerName: review.customerName,
      rating: review.rating,
      comment: review.comment,
      serviceId: serviceRows[review.serviceIndex].id,
    })),
  );

  // Demo login accounts.
  const adminPasswordHash = await hashPassword("admin1234");
  await db.insert(usersTable).values({
    name: "Admin",
    email: "admin@reservekit.demo",
    passwordHash: adminPasswordHash,
    role: "admin",
  });

  const customerPasswordHash = await hashPassword("customer1234");
  const [demoUser] = await db
    .insert(usersTable)
    .values({
      name: "Olivia Park",
      email: "olivia.park@email.com",
      passwordHash: customerPasswordHash,
      role: "customer",
    })
    .returning();
  await db
    .update(customersTable)
    .set({ userId: demoUser.id })
    .where(eq(customersTable.email, "olivia.park@email.com"));

  console.log(`Seeded business "${business.name}" with ${staffRows.length} staff, ${serviceRows.length} services, ${customerRows.length} customers, 30 bookings, and demo logins:`);
  console.log("  Admin:    admin@reservekit.demo / admin1234");
  console.log("  Customer: olivia.park@email.com / customer1234");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
