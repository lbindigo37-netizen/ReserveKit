import { Link } from 'wouter';
import { ArrowRight, BarChart3, Bell, CalendarDays, CreditCard, Users } from 'lucide-react';
import { useGetDashboard, useGetAnalytics } from '@workspace/api-client-react';

import { AdminShell } from '@/components/layout/AdminShell';
import { LoadingBlock, ErrorState, Avatar, StatusPill } from '@/components/shared';
import { fallbackDashboard, fallbackAnalytics } from '@/lib/fallbacks';

type IconType = typeof CalendarDays;

export default function DashboardPage() {
  const dashboardQuery = useGetDashboard();
  const analyticsQuery = useGetAnalytics();
  const dashboard = dashboardQuery.data || fallbackDashboard;
  const analytics = analyticsQuery.data || fallbackAnalytics;
  const maxDay = Math.max(...analytics.bookingsByDay.map((p) => p.value), 1);
  const maxRevenue = Math.max(...analytics.revenueByMonth.map((p) => p.value), 1);

  if (dashboardQuery.isLoading && !dashboardQuery.data) {
    return (
      <AdminShell title="Overview">
        <div className="p-6 md:p-8">
          <LoadingBlock />
        </div>
      </AdminShell>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <AdminShell title="Overview">
        <div className="p-6 md:p-8">
          <ErrorState retry={() => dashboardQuery.refetch()} />
        </div>
      </AdminShell>
    );
  }

  const metrics: [string, string, IconType][] = [
    ["Today's appointments", String(dashboard.todayAppointments), CalendarDays],
    [`Revenue (completed)`, `$${dashboard.revenue.toLocaleString()}`, CreditCard],
    ['Needs your attention', String(dashboard.pending), Bell],
    ['Total customers', String(dashboard.customers), Users],
  ];

  return (
    <AdminShell title="Overview">
      <div className="animate-fade space-y-7 p-5 md:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-[-.05em] md:text-4xl">A clear day ahead.</h2>
          </div>
          <Link href="/admin/bookings" className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground" data-testid="link-dashboard-bookings">
            View all bookings <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([label, value, Icon], i) => (
            <div className={`rounded-2xl border border-border bg-card p-5 animate-rise delay-${i + 1}`} key={label} data-testid={`metric-${i}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                <Icon size={17} className="text-primary" />
              </div>
              <p className="mt-5 font-display text-3xl font-bold tracking-[-.06em]">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-lg font-bold">Bookings this week</p>
                <p className="mt-1 text-xs text-muted-foreground">A steady rhythm, with room to grow.</p>
              </div>
              <BarChart3 size={18} className="text-muted-foreground" />
            </div>
            <div className="mt-8 flex h-48 items-end justify-between gap-2">
              {analytics.bookingsByDay.map((point) => (
                <div className="flex h-full flex-1 flex-col items-center justify-end gap-2" key={point.label}>
                  <div className="relative w-full max-w-[42px] rounded-t-lg bg-primary/80 transition-all hover:bg-primary" style={{ height: `${Math.max((point.value / maxDay) * 100, 8)}%` }}>
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono-ui text-[9px] text-muted-foreground">{point.value}</span>
                  </div>
                  <span className="font-mono-ui text-[9px] uppercase text-muted-foreground">{point.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-accent p-5 text-accent-foreground md:p-6">
            <p className="font-mono-ui text-[10px] uppercase tracking-[.17em] text-accent-foreground/65">Retention</p>
            <p className="mt-7 font-display text-6xl font-bold tracking-[-.08em]">{analytics.returningRate}%</p>
            <p className="mt-2 text-sm text-accent-foreground/70">of your guests come back. That is the real measure of a good day.</p>
            <div className="mt-8 h-2 overflow-hidden rounded-full bg-accent-foreground/15">
              <div className="h-full rounded-full bg-primary" style={{ width: `${analytics.returningRate}%` }} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg font-bold">Upcoming</p>
                <p className="mt-1 text-xs text-muted-foreground">Your next few confirmed appointments.</p>
              </div>
              <Link href="/admin/bookings" className="text-xs font-bold text-primary" data-testid="link-upcoming-all">See all</Link>
            </div>
            <div className="mt-5 divide-y divide-border">
              {dashboard.upcoming.length === 0 && <p className="py-4 text-sm text-muted-foreground">Nothing confirmed yet.</p>}
              {dashboard.upcoming.slice(0, 4).map((booking) => (
                <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" key={booking.id} data-testid={`row-upcoming-${booking.id}`}>
                  <div className="w-14 text-center">
                    <p className="font-mono-ui text-[9px] uppercase text-muted-foreground">{booking.date}</p>
                    <p className="mt-1 font-bold">{booking.time}</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{booking.customer}</p>
                    <p className="truncate text-xs text-muted-foreground">{booking.service} · {booking.staff}</p>
                  </div>
                  <StatusPill status={booking.status} />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg font-bold">Revenue pulse</p>
                <p className="mt-1 text-xs text-muted-foreground">Completed bookings, last six months.</p>
              </div>
            </div>
            <div className="mt-7 flex h-36 items-end gap-2">
              {analytics.revenueByMonth.map((point) => (
                <div className="flex flex-1 flex-col items-center justify-end gap-2" key={point.label}>
                  <div className="w-full rounded-t-md bg-secondary transition-all hover:bg-primary" style={{ height: `${Math.max((point.value / maxRevenue) * 100, 9)}%` }} />
                  <span className="font-mono-ui text-[9px] uppercase text-muted-foreground">{point.label}</span>
                </div>
              ))}
              {analytics.revenueByMonth.length === 0 && <p className="text-sm text-muted-foreground">No completed bookings yet.</p>}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <p className="font-display text-lg font-bold">Recent customers</p>
            <div className="mt-4 space-y-3">
              {dashboard.recentCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center gap-3" data-testid={`row-recent-customer-${customer.id}`}>
                  <Avatar initials={customer.initials} color={customer.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{customer.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
              ))}
              {dashboard.recentCustomers.length === 0 && <p className="text-sm text-muted-foreground">No customers yet.</p>}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <p className="font-display text-lg font-bold">Recent activity</p>
            <div className="mt-4 space-y-3">
              {dashboard.recentActivity.map((entry) => (
                <div key={entry.id} className="flex items-start justify-between gap-3 text-sm" data-testid={`row-activity-${entry.id}`}>
                  <span className="text-foreground">{entry.message}</span>
                  <span className="shrink-0 font-mono-ui text-[9px] uppercase text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {dashboard.recentActivity.length === 0 && <p className="text-sm text-muted-foreground">No recent activity.</p>}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <p className="font-display text-lg font-bold">Staff utilization</p>
          <div className="mt-5 space-y-3">
            {analytics.staffUtilization.map((entry) => (
              <div key={entry.label} data-testid={`row-utilization-${entry.label}`}>
                <div className="flex justify-between text-xs font-semibold">
                  <span>{entry.label}</span>
                  <span>{entry.value}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${entry.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
