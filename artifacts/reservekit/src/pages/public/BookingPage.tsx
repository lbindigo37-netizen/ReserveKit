import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Check, CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import {
  useGetBusiness, useGetServices, useGetStaff, useGetAvailability, useCreateBooking, getGetAvailabilityQueryKey,
  type Service, type Staff, type Booking,
} from '@workspace/api-client-react';

import { getBusinessTypeConfig } from '@/lib/business';
import { fallbackBusiness } from '@/lib/fallbacks';
import { Avatar } from '@/components/shared';
import { useAuth } from '@/lib/auth';

const steps = ['Service', 'Specialist', 'Date', 'Time', 'Your details', 'Confirmation'];

function todayPlus(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function BookingPage() {
  const { user } = useAuth();
  const businessQuery = useGetBusiness();
  const business = businessQuery.data || fallbackBusiness;
  const servicesQuery = useGetServices();
  const services = servicesQuery.data || [];
  const staffQuery = useGetStaff();
  const allStaff = staffQuery.data || [];
  const create = useCreateBooking();

  const [step, setStep] = useState(1);
  const [service, setService] = useState<Service | null>(null);
  const [person, setPerson] = useState<Staff | null>(null);
  const [date, setDate] = useState(todayPlus(1));
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '' });
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [error, setError] = useState('');

  const eligibleStaff = service ? allStaff.filter((member) => member.serviceIds.includes(service.id)) : allStaff;

  const availabilityParams = { serviceId: service?.id ?? 0, staffId: person?.id ?? 0, date };
  const availabilityQuery = useGetAvailability(availabilityParams, {
    query: { queryKey: getGetAvailabilityQueryKey(availabilityParams), enabled: Boolean(service && person && date) },
  });
  const slots = availabilityQuery.data?.slots ?? [];

  const canNext =
    step === 1 ? !!service : step === 2 ? !!person : step === 3 ? !!date : step === 4 ? !!time : !!form.name && !!form.email;

  const submit = () => {
    if (!service || !person || !time) return;
    setError('');
    create.mutate(
      { data: { customer: form.name, email: form.email, serviceId: service.id, staffId: person.id, date, time } },
      {
        onSuccess: (booking) => setConfirmed(booking),
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : '';
          setError(message.includes('409') || message.toLowerCase().includes('available')
            ? 'That time was just taken. Please choose another slot.'
            : 'We could not complete that booking. Please try again.');
        },
      },
    );
  };

  const config = getBusinessTypeConfig(business.type);

  if (confirmed) {
    return (
      <div className="min-h-[100dvh] bg-background px-5 py-8 md:px-8">
        <div className="mx-auto max-w-2xl">
          <BookingLogo businessName={business.name} type={business.type} />
          <div className="mt-20 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Check size={28} />
            </span>
            <p className="mt-8 font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">You are all set</p>
            <h1 className="mt-3 font-display text-5xl font-bold tracking-[-.07em]">
              See you soon,<br />{form.name.split(' ')[0]}.
            </h1>
            <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Your {confirmed.service.toLowerCase()} with {confirmed.staff} is booked for {confirmed.date} at {confirmed.time}.
              A confirmation email is on its way to {form.email}.
            </p>
            <div className="mx-auto mt-9 max-w-sm rounded-2xl border border-border bg-card p-5 text-left">
              <div className="flex justify-between">
                <span className="text-sm font-semibold">{confirmed.service}</span>
                <span className="font-semibold">${confirmed.amount}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{confirmed.staff}</p>
              <div className="mt-4 border-t border-border pt-4 font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">
                {confirmed.date} · {confirmed.time}
              </div>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary" data-testid="link-confirmation-home">
                Return to {business.name} <ArrowRight size={15} />
              </Link>
              {user && (
                <Link href="/account" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground" data-testid="link-confirmation-account">
                  View my bookings
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 md:px-8">
        <BookingLogo businessName={business.name} type={business.type} />
        <Link href="/" className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground" data-testid="link-booking-back">
          <ChevronLeft size={15} /> Back to website
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-10 md:px-8 md:pt-16">
        <div className="mb-12">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Reserve your time</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] md:text-5xl">{business.bookingLabel}</h1>
          <div className="mt-8 flex items-center gap-2">
            {steps.map((label, i) => (
              <div className="flex flex-1 items-center gap-2" key={label}>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono-ui text-[10px] font-bold ${step > i + 1 ? 'bg-secondary text-secondary-foreground' : step === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  {step > i + 1 ? <Check size={13} /> : i + 1}
                </span>
                <span className={`hidden text-[10px] font-bold uppercase tracking-wide sm:block ${step === i + 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                {i < steps.length - 1 && <span className="h-px flex-1 bg-border" />}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

        <div className="animate-fade">
          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl font-bold">What are you in for?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose the {config.appointment} that feels right.</p>
              <div className="mt-6 grid gap-3">
                {services.map((item) => (
                  <button
                    onClick={() => {
                      setService(item);
                      setPerson(null);
                      setTime(null);
                    }}
                    className={`flex items-center justify-between rounded-2xl border p-5 text-left transition-all ${service?.id === item.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border bg-card hover:-translate-y-0.5'}`}
                    key={item.id}
                    data-testid={`button-select-service-${item.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="font-display text-lg font-bold">{item.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                        <p className="mt-3 font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">
                          {item.duration} min · ${item.price}
                        </p>
                      </div>
                    </div>
                    {service?.id === item.id && <CheckCircle2 className="text-primary" size={20} />}
                  </button>
                ))}
                {services.length === 0 && !servicesQuery.isLoading && (
                  <p className="text-sm text-muted-foreground">No services are available to book right now.</p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-2xl font-bold">Who would you like to see?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Everyone here is ready for you.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {eligibleStaff.map((item) => (
                  <button
                    onClick={() => {
                      setPerson(item);
                      setTime(null);
                    }}
                    className={`rounded-2xl border p-5 text-left transition-all ${person?.id === item.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border bg-card hover:-translate-y-0.5'}`}
                    key={item.id}
                    data-testid={`button-select-staff-${item.id}`}
                  >
                    <Avatar initials={item.initials} color={item.color} size="lg" />
                    <p className="mt-5 font-display text-lg font-bold">{item.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.role}</p>
                  </button>
                ))}
                {eligibleStaff.length === 0 && (
                  <p className="text-sm text-muted-foreground">No one currently offers this service. Try another one.</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-display text-2xl font-bold">Pick a day.</h2>
              <p className="mt-1 text-sm text-muted-foreground">We'll show you what's open once you choose a date.</p>
              <div className="mt-6 rounded-2xl border border-border bg-card p-5">
                <label className="grid gap-2 text-xs font-bold">
                  Date
                  <input
                    type="date"
                    value={date}
                    min={todayPlus(0)}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setTime(null);
                    }}
                    className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid="input-booking-date"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="font-display text-2xl font-bold">Find a good moment.</h2>
              <p className="mt-1 text-sm text-muted-foreground">Times shown reflect real availability for {person?.name}.</p>
              <div className="mt-6 rounded-2xl border border-border bg-card p-5">
                {availabilityQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Checking availability…</p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open times on this date. Go back and try another day.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {slots.map((slot) => (
                      <button
                        onClick={() => setTime(slot)}
                        className={`rounded-xl border py-3 font-mono-ui text-[11px] ${time === slot ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'}`}
                        key={slot}
                        data-testid={`button-select-time-${slot}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="font-display text-2xl font-bold">A few details.</h2>
              <p className="mt-1 text-sm text-muted-foreground">We will send your confirmation here.</p>
              <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-5">
                <label className="grid gap-2 text-xs font-bold">
                  Full name
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid="input-booking-name"
                  />
                </label>
                <label className="grid gap-2 text-xs font-bold">
                  Email address
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid="input-booking-email"
                  />
                </label>
                <div className="mt-2 rounded-xl bg-muted p-4">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{service?.name}</span>
                    <span>${service?.price}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{person?.name} · {date} at {time}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex justify-between border-t border-border pt-5">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-muted-foreground disabled:invisible hover:bg-muted"
            data-testid="button-booking-previous"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          {step < 5 ? (
            <button
              onClick={() => canNext && setStep(step + 1)}
              disabled={!canNext}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
              data-testid="button-booking-next"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!canNext || create.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
              data-testid="button-booking-submit"
            >
              {create.isPending ? 'Reserving…' : 'Confirm booking'} <Check size={16} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function BookingLogo({ businessName, type }: { businessName: string; type: string }) {
  const Icon = getBusinessTypeConfig(type).icon || Sparkles;
  return (
    <Link href="/" className="flex items-center gap-3 focus-ring" data-testid="link-logo">
      <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-primary text-primary-foreground shadow-sm">
        <Icon size={18} strokeWidth={2.5} />
      </span>
      <span className="font-display text-[17px] font-bold leading-none tracking-[-.03em]">{businessName}</span>
    </Link>
  );
}
