import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { CheckCircle2, Filter, Plus, Search, XCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetBookings, useUpdateBookingStatus, getGetBookingsQueryKey, getGetDashboardQueryKey,
} from '@workspace/api-client-react';

import { AdminShell } from '@/components/layout/AdminShell';
import { Avatar, EmptyState, ErrorState, PaymentPill, StatusPill } from '@/components/shared';

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [notice, setNotice] = useState('');
  const params = useMemo(() => ({ ...(search ? { search } : {}), ...(status !== 'all' ? { status } : {}) }), [search, status]);
  const query = useGetBookings(params);
  const mutation = useUpdateBookingStatus();
  const bookings = query.data ?? [];

  const updateStatus = (id: number, next: string) =>
    mutation.mutate(
      { id, data: { status: next } },
      {
        onSuccess: () => {
          setNotice(`Booking ${next}.`);
          queryClient.invalidateQueries({ queryKey: getGetBookingsQueryKey(params) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          setTimeout(() => setNotice(''), 2400);
        },
      },
    );

  return (
    <AdminShell title="Bookings">
      <div className="space-y-6 p-5 md:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">Keep the day moving.</p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-[-.05em]">Bookings</h2>
          </div>
          <Link href="/book" className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground" data-testid="link-new-booking">
            <Plus size={15} /> New booking
          </Link>
        </div>

        {notice && (
          <div className="animate-fade flex items-center gap-2 rounded-xl border border-secondary bg-secondary/50 px-4 py-3 text-sm font-semibold text-secondary-foreground" data-testid="status-success">
            <CheckCircle2 size={16} /> {notice}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 md:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guests, services or staff"
              className="h-10 w-full rounded-xl bg-background pl-9 pr-3 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
              data-testid="input-bookings-search"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="ml-2 text-muted-foreground" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-xl bg-background px-3 text-xs font-semibold outline-none"
              data-testid="select-booking-status"
            >
              <option value="all">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {query.isError ? (
          <ErrorState retry={() => query.refetch()} />
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No bookings match"
            copy="Try a different search or add an appointment to the calendar."
            action={<Link href="/book" className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground" data-testid="link-empty-booking">Create booking</Link>}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="hidden grid-cols-[1.2fr_1.1fr_.9fr_.7fr_.7fr_.8fr_1fr] gap-4 border-b border-border bg-muted/50 px-5 py-3 font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground md:grid">
              <span>Guest</span><span>Service</span><span>Date & time</span><span>Amount</span><span>Payment</span><span>Status</span><span>Action</span>
            </div>
            {bookings.map((booking) => (
              <div
                className="grid gap-3 border-b border-border px-5 py-4 last:border-0 md:grid-cols-[1.2fr_1.1fr_.9fr_.7fr_.7fr_.8fr_1fr] md:items-center md:gap-4"
                key={booking.id}
                data-testid={`row-booking-${booking.id}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar initials={booking.customer.split(' ').map((s) => s[0]).join('')} color="#d96759" size="sm" />
                  <div>
                    <p className="text-sm font-semibold">{booking.customer}</p>
                    <p className="text-[11px] text-muted-foreground">{booking.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm">{booking.service}</p>
                  <p className="text-[11px] text-muted-foreground">{booking.staff}</p>
                </div>
                <div>
                  <p className="text-sm">{booking.date}</p>
                  <p className="font-mono-ui text-[11px] text-muted-foreground">{booking.time}</p>
                </div>
                <p className="text-sm font-semibold">${booking.amount}</p>
                <div><PaymentPill status={booking.payment.status} /></div>
                <div><StatusPill status={booking.status} /></div>
                <div className="flex gap-1.5">
                  {booking.status === 'pending' && (
                    <button
                      disabled={mutation.isPending}
                      onClick={() => updateStatus(booking.id, 'confirmed')}
                      className="rounded-lg bg-secondary px-2.5 py-1.5 text-[10px] font-bold text-secondary-foreground hover:brightness-95"
                      data-testid={`button-confirm-${booking.id}`}
                    >
                      Confirm
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      disabled={mutation.isPending}
                      onClick={() => updateStatus(booking.id, 'completed')}
                      className="rounded-lg bg-muted px-2.5 py-1.5 text-[10px] font-bold hover:bg-secondary"
                      data-testid={`button-complete-${booking.id}`}
                    >
                      Complete
                    </button>
                  )}
                  {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                    <button
                      disabled={mutation.isPending}
                      onClick={() => updateStatus(booking.id, 'cancelled')}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Cancel booking"
                      data-testid={`button-cancel-${booking.id}`}
                    >
                      <XCircle size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
