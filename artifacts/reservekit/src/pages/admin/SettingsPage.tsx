import { useEffect, useState } from 'react';
import { Check, Moon, Sun } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetBusiness, useUpdateBusiness, getGetBusinessQueryKey } from '@workspace/api-client-react';

import { AdminShell } from '@/components/layout/AdminShell';
import { useTheme } from '@/lib/theme';
import { businessTypes } from '@/lib/business';
import { fallbackBusiness } from '@/lib/fallbacks';
import { ErrorState, LoadingBlock } from '@/components/shared';

export default function SettingsPage() {
  const query = useGetBusiness();
  const queryClient = useQueryClient();
  const updateBusiness = useUpdateBusiness();
  const [dark, setDark] = useTheme();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(fallbackBusiness);

  useEffect(() => {
    if (query.data) setForm(query.data);
  }, [query.data]);

  if (query.isLoading) return <AdminShell title="Settings"><div className="p-6 md:p-8"><LoadingBlock /></div></AdminShell>;
  if (query.isError) return <AdminShell title="Settings"><div className="p-6 md:p-8"><ErrorState retry={() => query.refetch()} /></div></AdminShell>;

  const save = () => {
    updateBusiness.mutate(
      { data: form },
      {
        onSuccess: () => {
          setSaved(true);
          queryClient.invalidateQueries({ queryKey: getGetBusinessQueryKey() });
          setTimeout(() => setSaved(false), 2400);
        },
      },
    );
  };

  return (
    <AdminShell title="Settings">
      <div className="max-w-3xl space-y-7 p-5 md:p-8">
        <div>
          <p className="text-sm text-muted-foreground">Make ReserveKit feel like yours.</p>
          <h2 className="mt-1 font-display text-3xl font-bold tracking-[-.05em]">Business settings</h2>
        </div>
        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-secondary bg-secondary/50 px-4 py-3 text-sm font-semibold text-secondary-foreground" data-testid="settings-success">
            <Check size={16} /> Settings saved.
          </div>
        )}

        <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
          <div className="border-b border-border pb-5">
            <p className="font-display text-xl font-bold">Identity</p>
            <p className="mt-1 text-sm text-muted-foreground">The details your guests see first.</p>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold">
              Business name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30" data-testid="input-business-name" />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Business type
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none" data-testid="select-business-type">
                {businessTypes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-xs font-bold sm:col-span-2">
              Tagline
              <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30" data-testid="input-business-tagline" />
            </label>
            <label className="grid gap-2 text-xs font-bold sm:col-span-2">
              Booking button label
              <input value={form.bookingLabel} onChange={(e) => setForm({ ...form, bookingLabel: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none" data-testid="input-business-booking-label" />
            </label>
            <label className="grid gap-2 text-xs font-bold sm:col-span-2">
              Logo URL
              <input value={form.logoUrl ?? ''} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://…" className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none" data-testid="input-business-logo" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
          <div className="border-b border-border pb-5">
            <p className="font-display text-xl font-bold">Branding</p>
            <p className="mt-1 text-sm text-muted-foreground">Colors used throughout the booking experience.</p>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold">
              Primary color
              <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="h-11 w-20 rounded-xl border border-border bg-background" data-testid="input-primary-color" />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Secondary color
              <input type="color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="h-11 w-20 rounded-xl border border-border bg-background" data-testid="input-secondary-color" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
          <div className="border-b border-border pb-5">
            <p className="font-display text-xl font-bold">Operations</p>
            <p className="mt-1 text-sm text-muted-foreground">Currency, timezone, and booking rules.</p>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold">
              Currency
              <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none" data-testid="input-currency" />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Timezone
              <input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none" data-testid="input-timezone" />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Booking interval (minutes)
              <input type="number" value={form.bookingIntervalMinutes} onChange={(e) => setForm({ ...form, bookingIntervalMinutes: Number(e.target.value) })} className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none" data-testid="input-booking-interval" />
            </label>
            <label className="grid gap-2 text-xs font-bold sm:col-span-2">
              Cancellation policy
              <textarea value={form.cancellationPolicy} onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })} rows={2} className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal outline-none" data-testid="textarea-cancellation-policy" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
          <div className="border-b border-border pb-5">
            <p className="font-display text-xl font-bold">About & contact</p>
            <p className="mt-1 text-sm text-muted-foreground">Shown on the public "About" and "Contact" sections.</p>
          </div>
          <div className="mt-6 grid gap-5">
            <label className="grid gap-2 text-xs font-bold">
              About title
              <input value={form.aboutTitle ?? ''} onChange={(e) => setForm({ ...form, aboutTitle: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none" data-testid="input-about-title" />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              About body
              <textarea value={form.aboutBody ?? ''} onChange={(e) => setForm({ ...form, aboutBody: e.target.value })} rows={3} className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal outline-none" data-testid="textarea-about-body" />
            </label>
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="grid gap-2 text-xs font-bold">
                Address
                <input value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none" data-testid="input-address" />
              </label>
              <label className="grid gap-2 text-xs font-bold">
                Contact email
                <input value={form.contactEmail ?? ''} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none" data-testid="input-contact-email" />
              </label>
              <label className="grid gap-2 text-xs font-bold">
                Contact phone
                <input value={form.contactPhone ?? ''} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none" data-testid="input-contact-phone" />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
          <div className="border-b border-border pb-5">
            <p className="font-display text-xl font-bold">Appearance</p>
            <p className="mt-1 text-sm text-muted-foreground">A quieter interface for late nights, if you need it.</p>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">{dark ? <Moon size={17} /> : <Sun size={17} />}</span>
              <div>
                <p className="text-sm font-semibold">{dark ? 'Dark mode' : 'Light mode'}</p>
                <p className="text-xs text-muted-foreground">Saved automatically for this browser.</p>
              </div>
            </div>
            <button onClick={() => setDark(!dark)} className={`relative h-7 w-12 rounded-full transition-colors ${dark ? 'bg-primary' : 'bg-muted'}`} aria-label="Toggle dark mode" data-testid="button-settings-theme">
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow-sm transition-transform ${dark ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </section>

        <button onClick={save} disabled={updateBusiness.isPending} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50" data-testid="button-save-settings">
          {updateBusiness.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </AdminShell>
  );
}
