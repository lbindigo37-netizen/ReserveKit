import { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCustomer, useUpdateCustomer, getGetCustomerQueryKey } from '@workspace/api-client-react';

import { AdminShell } from '@/components/layout/AdminShell';
import { Avatar, ErrorState, LoadingBlock, PaymentPill, StatusPill } from '@/components/shared';

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const query = useGetCustomer(id);
  const queryClient = useQueryClient();
  const updateCustomer = useUpdateCustomer();
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (query.data) {
      setNotes(query.data.customer.notes ?? '');
      setPhone(query.data.customer.phone ?? '');
    }
  }, [query.data]);

  if (query.isLoading) return <AdminShell title="Customer"><div className="p-6 md:p-8"><LoadingBlock /></div></AdminShell>;
  if (query.isError || !query.data) return <AdminShell title="Customer"><div className="p-6 md:p-8"><ErrorState retry={() => query.refetch()} /></div></AdminShell>;

  const { customer, bookings } = query.data;

  const save = () => {
    updateCustomer.mutate(
      { id, data: { notes, phone } },
      {
        onSuccess: () => {
          setSaved(true);
          queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
          setTimeout(() => setSaved(false), 2400);
        },
      },
    );
  };

  return (
    <AdminShell title={customer.name}>
      <div className="space-y-6 p-5 md:p-8">
        <Link href="/admin/customers" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground" data-testid="link-back-customers">
          <ChevronLeft size={14} /> Back to customers
        </Link>

        <div className="flex items-center gap-4">
          <Avatar initials={customer.initials} color={customer.color} size="lg" />
          <div>
            <h2 className="font-display text-2xl font-bold">{customer.name}</h2>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total visits</p>
            <p className="mt-1 font-display text-2xl font-bold">{customer.visits}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Lifetime spending</p>
            <p className="mt-1 font-display text-2xl font-bold">${customer.spending.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Last visit</p>
            <p className="mt-1 font-display text-2xl font-bold">{customer.lastVisit}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-display text-lg font-bold">Contact & notes</p>
          {saved && <p className="mt-2 text-xs font-semibold text-secondary-foreground">Saved.</p>}
          <div className="mt-4 grid gap-3">
            <label className="grid gap-2 text-xs font-bold">
              Phone
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none"
                data-testid="input-customer-phone"
              />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Notes
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                data-testid="textarea-customer-notes"
              />
            </label>
            <button
              onClick={save}
              disabled={updateCustomer.isPending}
              className="w-fit rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
              data-testid="button-save-customer-notes"
            >
              Save
            </button>
          </div>
        </div>

        <div>
          <p className="font-display text-lg font-bold">Booking history</p>
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
            {bookings.length === 0 && <p className="p-5 text-sm text-muted-foreground">No bookings yet.</p>}
            {bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-0" data-testid={`row-customer-booking-${booking.id}`}>
                <div>
                  <p className="text-sm font-semibold">{booking.service}</p>
                  <p className="text-xs text-muted-foreground">{booking.staff} · {booking.date} at {booking.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PaymentPill status={booking.payment.status} />
                  <StatusPill status={booking.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
