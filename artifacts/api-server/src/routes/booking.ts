import { Router, type IRouter } from "express";
import {
  CreateBookingBody,
  CreateBookingResponse,
  GetAnalyticsResponse,
  GetBookingsQueryParams,
  GetBookingsResponse,
  GetBusinessResponse,
  GetCustomersResponse,
  GetDashboardResponse,
  GetServicesResponse,
  GetStaffResponse,
  UpdateBookingStatusBody,
  UpdateBookingStatusParams,
  UpdateBookingStatusResponse,
} from "@workspace/api-zod";

type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

type Booking = {
  id: number;
  customer: string;
  email: string;
  service: string;
  staff: string;
  date: string;
  time: string;
  status: BookingStatus;
  amount: number;
};

const business = {
  name: "Haven & Hue",
  type: "Salon",
  tagline: "A considered approach to modern beauty.",
  bookingLabel: "Book a stylist",
  currency: "USD",
  timezone: "America/Los_Angeles",
  accent: "#c36b4f",
};

const services = [
  { id: 1, name: "Signature Cut", category: "Hair", description: "A tailored cut, wash, and finish designed around your texture.", duration: 60, price: 86, color: "#d98568", popular: true },
  { id: 2, name: "Gloss & Tone", category: "Color", description: "A luminous refresh that brings out your most natural dimension.", duration: 75, price: 112, color: "#7e9381", popular: true },
  { id: 3, name: "Full Balayage", category: "Color", description: "Hand-painted brightness with a seamless, lived-in grow out.", duration: 180, price: 268, color: "#c69a58", popular: false },
  { id: 4, name: "Blowout", category: "Styling", description: "A polished, long-lasting finish for whatever is next.", duration: 45, price: 58, color: "#9a7b91", popular: true },
  { id: 5, name: "Event Styling", category: "Styling", description: "Refined styling for celebrations, portraits, and evenings out.", duration: 90, price: 140, color: "#667c9d", popular: false },
  { id: 6, name: "Scalp Ritual", category: "Wellness", description: "A restorative cleanse and massage for a lighter, healthier scalp.", duration: 50, price: 72, color: "#6e988d", popular: false },
  { id: 7, name: "Brow Shape", category: "Finishing", description: "A precise shape and soft tint to frame your features.", duration: 30, price: 34, color: "#b37b5d", popular: false },
  { id: 8, name: "Nourish Treatment", category: "Wellness", description: "Deep hydration and repair for hair that feels like silk.", duration: 40, price: 48, color: "#8b9eaa", popular: false },
  { id: 9, name: "Bridal Preview", category: "Events", description: "A collaborative styling session to find your perfect look.", duration: 120, price: 185, color: "#bd8b84", popular: false },
  { id: 10, name: "Gentlemen's Cut", category: "Hair", description: "Detailed shaping, warm towel finish, and easy styling guidance.", duration: 45, price: 64, color: "#72858a", popular: false },
];

const staff = [
  { id: 1, name: "Mara Chen", role: "Creative Director", initials: "MC", color: "#d98568", utilization: 86, bookings: 34 },
  { id: 2, name: "Jon Bell", role: "Senior Stylist", initials: "JB", color: "#7e9381", utilization: 78, bookings: 28 },
  { id: 3, name: "Priya Shah", role: "Colorist", initials: "PS", color: "#9a7b91", utilization: 92, bookings: 41 },
  { id: 4, name: "Elena Rossi", role: "Stylist", initials: "ER", color: "#c69a58", utilization: 71, bookings: 25 },
  { id: 5, name: "Noah Williams", role: "Stylist", initials: "NW", color: "#667c9d", utilization: 68, bookings: 22 },
  { id: 6, name: "Sofia Grant", role: "Beauty Specialist", initials: "SG", color: "#6e988d", utilization: 83, bookings: 29 },
  { id: 7, name: "Luca Moretti", role: "Stylist", initials: "LM", color: "#b37b5d", utilization: 64, bookings: 19 },
  { id: 8, name: "Aisha Reed", role: "Apprentice Stylist", initials: "AR", color: "#8b9eaa", utilization: 57, bookings: 16 },
];

const customerNames = [
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
] as const;

const avatarColors = ["#d98568", "#7e9381", "#c69a58", "#9a7b91", "#667c9d"];
const initials = (name: string) => name.split(" ").map((part) => part[0]).join("");

const customers = customerNames.map(([name, email], index) => ({
  id: index + 1,
  name,
  email,
  initials: initials(name),
  color: avatarColors[index % avatarColors.length],
  visits: 2 + ((index * 3) % 14),
  spending: 180 + ((index * 127) % 1240),
  lastVisit: `2026-08-${String(1 + (index % 7)).padStart(2, "0")}`,
}));

const dates = ["2026-08-07", "2026-08-07", "2026-08-07", "2026-08-08", "2026-08-08", "2026-08-09", "2026-08-10", "2026-08-11", "2026-08-12", "2026-08-13"];
const times = ["09:00", "10:30", "11:00", "12:30", "13:00", "14:30", "15:00", "16:30"];
const bookings: Booking[] = Array.from({ length: 30 }, (_, index) => ({
  id: index + 1001,
  customer: customerNames[index % customerNames.length][0],
  email: customerNames[index % customerNames.length][1],
  service: services[index % services.length].name,
  staff: staff[index % staff.length].name,
  date: dates[index % dates.length],
  time: times[index % times.length],
  status: (["Confirmed", "Confirmed", "Pending", "Completed", "Confirmed", "Cancelled"] as BookingStatus[])[index % 6],
  amount: services[index % services.length].price,
}));

const metric = (label: string, value: number) => ({ label, value });

const router: IRouter = Router();

router.get("/business", (_req, res) => {
  res.json(GetBusinessResponse.parse(business));
});

router.get("/services", (_req, res) => {
  res.json(GetServicesResponse.parse(services));
});

router.get("/staff", (_req, res) => {
  res.json(GetStaffResponse.parse(staff));
});

router.get("/bookings", (req, res) => {
  const parsed = GetBookingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status, search } = parsed.data;
  const normalizedSearch = search?.toLowerCase();
  const filtered = bookings.filter((booking) => {
    const matchesStatus = !status || booking.status.toLowerCase() === status.toLowerCase();
    const matchesSearch = !normalizedSearch ||
      [booking.customer, booking.service, booking.staff, booking.email].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      );
    return matchesStatus && matchesSearch;
  });
  res.json(GetBookingsResponse.parse(filtered));
});

router.post("/bookings", (req, res) => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const newBooking: Booking = {
    id: Math.max(...bookings.map((booking) => booking.id)) + 1,
    ...parsed.data,
    status: "Pending",
  };
  bookings.unshift(newBooking);
  res.status(201).json(CreateBookingResponse.parse(newBooking));
});

router.patch("/bookings/:id/status", (req, res) => {
  const params = UpdateBookingStatusParams.safeParse(req.params);
  const body = UpdateBookingStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid booking status update" });
    return;
  }
  const booking = bookings.find((item) => item.id === params.data.id);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  booking.status = body.data.status as BookingStatus;
  res.json(UpdateBookingStatusResponse.parse(booking));
});

router.get("/customers", (_req, res) => {
  res.json(GetCustomersResponse.parse(customers));
});

router.get("/dashboard", (_req, res) => {
  const dashboard = {
    todayAppointments: bookings.filter((booking) => booking.date === "2026-08-07" && booking.status !== "Cancelled").length,
    revenue: bookings.filter((booking) => booking.status !== "Cancelled").reduce((total, booking) => total + booking.amount, 0),
    pending: bookings.filter((booking) => booking.status === "Pending").length,
    customers: customers.length,
    upcoming: bookings.filter((booking) => booking.status === "Confirmed").slice(0, 5),
  };
  res.json(GetDashboardResponse.parse(dashboard));
});

router.get("/analytics", (_req, res) => {
  const analytics = {
    bookingsByDay: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, index) => metric(label, [22, 31, 27, 38, 42, 29, 18][index])),
    revenueByMonth: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((label, index) => metric(label, [4820, 5340, 6120, 5780, 6940, 4280][index])),
    popularServices: services.slice(0, 5).map((service, index) => metric(service.name, [46, 34, 28, 21, 16][index])),
    returningRate: 68,
  };
  res.json(GetAnalyticsResponse.parse(analytics));
});

export default router;