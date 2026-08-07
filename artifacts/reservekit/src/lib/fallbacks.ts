import type { Analytics, Business, Dashboard } from '@workspace/api-client-react';

// Minimal placeholders shown only for the instant before the first API
// response arrives (or if it errors). Real content always comes from the
// API once a database is provisioned; see PROJECT.md "SAMPLE DATA" for the
// realistic seed data used in `lib/db/src/seed.ts`.
export const fallbackBusiness: Business = {
  name: 'ReserveKit',
  type: 'Salon',
  tagline: 'A considered approach to modern beauty.',
  bookingLabel: 'Book a stylist',
  currency: 'USD',
  timezone: 'America/Los_Angeles',
  accent: '#c36b4f',
  primaryColor: '#c36b4f',
  secondaryColor: '#7e9381',
  bookingIntervalMinutes: 30,
  cancellationPolicy: 'Cancel or reschedule up to 24 hours before your appointment at no charge.',
};

export const fallbackDashboard: Dashboard = {
  todayAppointments: 0,
  revenue: 0,
  pending: 0,
  customers: 0,
  upcoming: [],
  recentCustomers: [],
  recentActivity: [],
};

export const fallbackAnalytics: Analytics = {
  bookingsByDay: [],
  revenueByMonth: [],
  popularServices: [],
  staffUtilization: [],
  returningRate: 0,
};
