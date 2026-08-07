import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetMyBookings, useRescheduleBooking, useGetAvailability, getGetMyBookingsQueryKey, getGetAvailabilityQueryKey,
} from '@workspace/api-client-react';

import { AccountShell } from '@/components/layout/AccountShell';
import { LoadingBlock, EmptyState, ErrorState, StatusPill, PaymentPill } from '@/components/shared';

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AccountBookingsPage() {
  const query = useGetMyBookings();
  const queryClient = useQueryClient();
  const reschedule = useRescheduleBooking();
  const [reschedulingId, setReschedulingId] = useState<number | null>(null);
  const [newDate, setNewDate] = useState(todayDateString());
  const [notice, setNotice] = useState('');

  const bookings = query.data ?? [];
  const today = todayDateString();
  const upcoming = bookings.filter((b) => b.date >= today && b.status !== 'cancelled');
  const history = bookings.filter((b) => b.date < today || b.status === 'cancelled' || b.status === 'completed');

  const target = bookings.find((b) => b.id === reschedulingId);
  const availabilityParams = { serviceId: target?.serviceId ?? 0, staffId: target?.staffId ?? 0, date: newDate };
  const availabilityQuery = useGetAvailability(availabilityParams, {
    query: { queryKey: getGetAvailabilityQueryKey(availabilityParams), enabled: Boolean(target) },
  });

  const submitReschedule = (time: string) => {
    if (!reschedulingId) return;
    reschedule.mutate(
      { id: reschedulingId, data: { date: newDate, time } },
      {
        onSuccess: () => {
          setNotice('Booking rescheduled.');
          setReschedulingId(null);
          queryClient.invalidateQueries({ queryKey: getGetMyBookingsQueryKey() });
          setTimeout(() => setNotice(''), 2400);
        },
      },
    );
  };

  if (query.isLoading) return <AccountShell title="Bookings"><LoadingBlock /></AccountShell>;
  if (query.isError) return <AccountShell title="Bookings"><ErrorState retry={() => query.refetch()} /></AccountShell>;

  return (
    <AccountShell title="Bookings">
      {notice && (
        <div className="mb-6 rounded-xl border border-secondary bg-secondary/50 px-4 py-3 text-sm font-semibold text-secondary-foreground" data-testid="status-reschedule-success">
          {notice}
        </div>
      )}

      <section className="mb-10">
        <h2 className="font-display text-xl font-bold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No upcoming appointments"
              copy="When you book your next appointment, it will show up here."
              action={<Link href="/book" className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Book now</Link>}
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {upcoming.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-border bg-card p-5" data-testid={`card-my-booking-${booking.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-lg font-bold">{booking.service}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{booking.staff} · {booking.date} at {booking.time}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusPill status={booking.status} />
                    <PaymentPill status={booking.payment.status} />
                  </div>
                </div>
                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                  <button
                    onClick={() => {
                      setReschedulingId(booking.id);
                      setNewDate(booking.date);
                    }}
                    className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary"
                    data-testid={`button-reschedule-${booking.id}`}
                  >
                    <CalendarClock size={14} /> Reschedule
                  </button>
                )}
                {reschedulingId === booking.id && (
                  <div className="mt-4 rounded-xl border border-border bg-background p-4">
                    <label className="grid gap-2 text-xs font-bold">
                      New date
                      <input
                        type="date"
                        value={newDate}
                        min={today}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="h-10 w-48 rounded-lg border border-border bg-card px-3 text-sm outline-none"
                        data-testid="input-reschedule-date"
                      />
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(availabilityQuery.data?.slots ?? []).map((slot) => (
                        <button
                          key={slot}
                          onClick={() => submitReschedule(slot)}
                          disabled={reschedule.isPending}
                          className="rounded-lg border border-border px-3 py-2 font-mono-ui text-[11px] hover:border-primary"
                          data-testid={`button-reschedule-slot-${slot}`}
                        >
                          {slot}
                        </button>
                      ))}
                      {availabilityQuery.data?.slots.length === 0 && (
                        <p className="text-xs text-muted-foreground">No open times on this date.</p>
                      )}
                    </div>
                    <button onClick={() => setReschedulingId(null)} className="mt-3 text-xs font-semibold text-muted-foreground" data-testid="button-cancel-reschedule">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">History</h2>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Your past appointments will appear here.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
            {history.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-0" data-testid={`row-history-${booking.id}`}>
                <div>
                  <p className="text-sm font-semibold">{booking.service}</p>
                  <p className="text-xs text-muted-foreground">{booking.staff} · {booking.date} at {booking.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={booking.status} />
                  <span className="text-sm font-semibold">${booking.amount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link href="/book" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary" data-testid="link-account-new-booking">
        Book another appointment <ArrowRight size={15} />
      </Link>
    </AccountShell>
  );
}
