import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, ChevronDown, Mail, MapPin, Phone, Star } from 'lucide-react';
import { useGetBusiness, useGetServices, useGetStaff, useGetReviews } from '@workspace/api-client-react';

import { getBusinessTypeConfig } from '@/lib/business';
import { fallbackBusiness } from '@/lib/fallbacks';
import { Avatar } from '@/components/shared';
import { useAuth } from '@/lib/auth';

const faqs = [
  { q: 'How far ahead should I book?', a: 'Most appointments are available within a few days, but popular time slots (weekends, evenings) fill up about a week out.' },
  { q: 'What is your cancellation policy?', a: 'You can reschedule or cancel free of charge up to 24 hours before your appointment from your booking confirmation or your account.' },
  { q: 'Do you take walk-ins?', a: "We prioritize booked appointments to keep wait times short, but it's always worth calling ahead." },
  { q: 'Can I request a specific specialist?', a: 'Yes — you choose who you would like to see as part of the booking flow.' },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
        data-testid={`button-faq-${question.slice(0, 10)}`}
      >
        <span className="font-display text-base font-bold">{question}</span>
        <ChevronDown size={18} className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{answer}</p>}
    </div>
  );
}

export default function PublicHome() {
  const businessQuery = useGetBusiness();
  const business = businessQuery.data || fallbackBusiness;
  const servicesQuery = useGetServices();
  const services = servicesQuery.data || [];
  const staffQuery = useGetStaff();
  const staff = staffQuery.data || [];
  const reviewsQuery = useGetReviews();
  const reviews = reviewsQuery.data || [];
  const { user } = useAuth();
  const config = getBusinessTypeConfig(business.type);
  const Icon = config.icon;

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 md:px-8">
        <Link href="/" className="flex items-center gap-3 focus-ring" data-testid="link-logo">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-primary text-primary-foreground shadow-sm">
            <Icon size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display text-[17px] font-bold leading-none tracking-[-.03em]">{business.name}</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex">
          <a href="#services" data-testid="link-nav-services">Services</a>
          <a href="#about" data-testid="link-nav-about">About</a>
          <a href="#contact" data-testid="link-nav-contact">Contact</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href={user ? (user.role === 'admin' ? '/admin' : '/account') : '/login'}
            className="hidden text-sm font-semibold text-muted-foreground hover:text-foreground sm:block"
            data-testid="link-account"
          >
            {user ? (user.role === 'admin' ? 'Admin workspace' : 'My account') : 'Sign in'}
          </Link>
          <Link
            href="/book"
            className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
            data-testid="link-book-top"
          >
            {business.bookingLabel}
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-5 pb-20 pt-12 md:px-8 md:pb-28 md:pt-20">
          <div className="hairline-grid absolute inset-x-0 top-0 -z-0 h-[440px] opacity-70" />
          <div className="relative z-10 mx-auto grid max-w-6xl items-end gap-14 lg:grid-cols-[1.05fr_.95fr]">
            <div className="animate-rise">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">
                <Icon size={12} className="text-primary" /> {business.type}
              </div>
              <h1 className="max-w-3xl font-display text-[clamp(3.4rem,8vw,7.4rem)] font-bold leading-[.88] tracking-[-.075em]">
                Good days<br /><span className="text-primary">start here.</span>
              </h1>
              <p className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
                {business.tagline} Thoughtful appointments, unhurried and made for the neighborhood.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="/book"
                  className="group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_10px_25px_hsl(var(--primary)/.18)] transition-transform hover:-translate-y-1"
                  data-testid="link-book-hero"
                >
                  {business.bookingLabel}
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20 transition-transform group-hover:translate-x-1">
                    <ArrowRight size={14} />
                  </span>
                </Link>
              </div>
            </div>
            <div className="relative animate-rise delay-2">
              <div className="absolute -right-3 -top-7 z-10 flex h-24 w-24 rotate-6 flex-col items-center justify-center rounded-full bg-accent text-center text-accent-foreground shadow-lg">
                <span className="font-display text-xl font-bold">Nice</span>
                <span className="font-mono-ui text-[8px] uppercase tracking-widest">to see you</span>
              </div>
              <div className="relative min-h-[340px] overflow-hidden rounded-[2rem] bg-[#d9b9a3] p-6 md:min-h-[440px]">
                <div
                  className="absolute inset-0 opacity-40"
                  style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #f5dfc5 0 12%, transparent 13%), radial-gradient(circle at 80% 70%, #b97b6a 0 18%, transparent 19%)' }}
                />
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="border-y border-border bg-card px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">The menu</p>
                <h2 className="mt-2 font-display text-4xl font-bold tracking-[-.05em]">Make some time<br />for yourself.</h2>
              </div>
              <Link href="/book" className="hidden items-center gap-2 text-sm font-bold text-accent hover:text-primary sm:flex" data-testid="link-browse-services">
                See all services <ArrowRight size={15} />
              </Link>
            </div>
            <div className="mt-10 grid gap-3 md:grid-cols-2">
              {services.slice(0, 4).map((service) => (
                <Link
                  href="/book"
                  key={service.id}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-background p-5 transition-transform hover:-translate-y-1"
                  data-testid={`card-service-${service.id}`}
                >
                  <div className="flex items-start gap-4">
                    <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: service.color }} />
                    <div>
                      <p className="font-display text-lg font-bold">{service.name}</p>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{service.description}</p>
                      <span className="mt-3 inline-block font-mono-ui text-[10px] uppercase tracking-[.13em] text-muted-foreground">
                        {service.duration} min · ${service.price}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={17} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr] md:items-center">
            <div>
              <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">About</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-[-.05em]">{business.aboutTitle || 'Good hands. No rush.'}</h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {business.aboutBody || 'A small team with a sharp eye and a soft touch. Come as you are.'}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {staff.map((person) => (
                <div className="rounded-2xl border border-border bg-card p-5" key={person.id} data-testid={`card-staff-${person.id}`}>
                  <Avatar initials={person.initials} color={person.color} size="lg" />
                  <p className="mt-7 font-display text-lg font-bold">{person.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{person.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {reviews.length > 0 && (
          <section className="border-y border-border bg-card px-5 py-16 md:px-8 md:py-20">
            <div className="mx-auto max-w-6xl">
              <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">What guests say</p>
              <h2 className="mt-2 font-display text-4xl font-bold tracking-[-.05em]">Testimonials</h2>
              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {reviews.slice(0, 6).map((review) => (
                  <div key={review.id} className="rounded-2xl border border-border bg-background p-5" data-testid={`card-review-${review.id}`}>
                    <div className="flex gap-0.5 text-primary">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} size={13} fill={index < review.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-foreground">"{review.comment}"</p>
                    <p className="mt-4 text-xs font-bold text-muted-foreground">
                      {review.customerName}
                      {review.serviceName && <span className="font-normal"> · {review.serviceName}</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">FAQ</p>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-[-.05em]">Questions, answered.</h2>
          <div className="mt-8 grid gap-3">
            {faqs.map((item) => (
              <FaqItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </section>

        <section id="contact" className="border-t border-border bg-card px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1fr] md:items-start">
            <div>
              <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Contact</p>
              <h2 className="mt-2 font-display text-4xl font-bold tracking-[-.05em]">Come say hello.</h2>
              <div className="mt-7 space-y-3 text-sm text-muted-foreground">
                {business.address && (
                  <p className="flex items-center gap-3">
                    <MapPin size={16} className="text-primary" /> {business.address}
                  </p>
                )}
                {business.contactEmail && (
                  <p className="flex items-center gap-3">
                    <Mail size={16} className="text-primary" /> {business.contactEmail}
                  </p>
                )}
                {business.contactPhone && (
                  <p className="flex items-center gap-3">
                    <Phone size={16} className="text-primary" /> {business.contactPhone}
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <p className="font-display text-lg font-bold">Ready when you are.</p>
              <p className="mt-2 text-sm text-muted-foreground">Booking takes about two minutes.</p>
              <Link
                href="/book"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                data-testid="link-book-contact"
              >
                {business.bookingLabel} <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-accent px-5 py-8 text-accent-foreground md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 text-sm sm:flex-row sm:items-center">
          <p className="font-display text-lg font-bold">{business.name}</p>
          <p className="text-xs text-accent-foreground/65">
            {business.address}
            {business.contactEmail ? ` · ${business.contactEmail}` : ''}
          </p>
        </div>
      </footer>
    </div>
  );
}
