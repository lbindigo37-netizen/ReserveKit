import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ArrowRight, Bell, CalendarDays, LayoutDashboard, Menu, Moon, Scissors, Settings, Sparkles, Sun, UserRound, Users,
} from 'lucide-react';
import { useGetBusiness, useGetNotifications } from '@workspace/api-client-react';

import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { getBusinessTypeConfig } from '@/lib/business';
import { Avatar } from '@/components/shared';

type IconType = typeof LayoutDashboard;

const navItems: { href: string; label: string; icon: IconType }[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/services', label: 'Services', icon: Scissors },
  { href: '/admin/staff', label: 'Staff', icon: UserRound },
];

function Logo({ businessName, type }: { businessName: string; type: string }) {
  const Icon = getBusinessTypeConfig(type).icon;
  return (
    <Link href="/" className="flex items-center gap-3 focus-ring" data-testid="link-logo">
      <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-primary text-primary-foreground shadow-sm">
        <Icon size={18} strokeWidth={2.5} />
      </span>
      <span>
        <span className="block font-display text-[17px] font-bold leading-none tracking-[-.03em]">{businessName}</span>
        <span className="mt-1 block font-mono-ui text-[8px] uppercase tracking-[.18em] text-sidebar-foreground/55">ReserveKit</span>
      </span>
    </Link>
  );
}

function TopBar({
  title,
  dark,
  setDark,
  onMenu,
  unreadCount,
}: {
  title: string;
  dark: boolean;
  setDark: (v: boolean) => void;
  onMenu: () => void;
  unreadCount: number;
}) {
  const businessQuery = useGetBusiness();
  return (
    <header className="flex h-[76px] items-center justify-between border-b border-border px-5 md:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="rounded-lg p-2 hover:bg-muted md:hidden" data-testid="button-mobile-menu">
          <Menu size={20} />
        </button>
        <div>
          <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">
            Workspace / {businessQuery.data?.type ?? 'Salon'}
          </p>
          <h1 className="mt-1 font-display text-xl font-bold tracking-[-.03em]">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDark(!dark)}
          className="rounded-xl p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
          data-testid="button-theme-toggle"
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <Link
          href="/admin/notifications"
          className="relative rounded-xl p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          data-testid="button-notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />}
        </Link>
        <div className="ml-2 hidden h-9 w-px bg-border sm:block" />
        <Avatar initials="RK" color="#d96759" />
      </div>
    </header>
  );
}

export function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  const businessQuery = useGetBusiness();
  const [dark, setDark] = useTheme();
  const [mobile, setMobile] = useState(false);
  const [location] = useLocation();
  const { logout } = useAuth();
  const notificationsQuery = useGetNotifications();
  const unreadCount = notificationsQuery.data?.filter((n) => !n.read).length ?? 0;

  const business = businessQuery.data;
  const bookingPlural = business ? getBusinessTypeConfig(business.type).bookingPlural : 'Bookings';

  return (
    <div className="min-h-[100dvh] bg-background md:flex">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-[244px] -translate-x-full bg-sidebar text-sidebar-foreground transition-transform duration-300 md:static md:translate-x-0 ${mobile ? 'translate-x-0' : ''}`}
      >
        <div className="flex h-full flex-col p-5">
          <div className="mb-10">
            <Logo businessName={business?.name ?? 'ReserveKit'} type={business?.type ?? 'Salon'} />
          </div>
          <div className="mb-3 px-3 font-mono-ui text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/40">Workspace</div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location === item.href;
              const label = item.label === 'Bookings' ? bookingPlural : item.label;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobile(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  <Icon size={17} strokeWidth={active ? 2.4 : 1.8} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mb-3 mt-9 px-3 font-mono-ui text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/40">Configure</div>
          <Link
            href="/admin/settings"
            onClick={() => setMobile(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${location === '/admin/settings' ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}
            data-testid="link-nav-settings"
          >
            <Settings size={17} />
            <span>Settings</span>
          </Link>
          <div className="mt-auto space-y-3">
            <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-[#87b29d]" /> Open today
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-sidebar-foreground/55">
                Your public booking page is live and accepting {bookingPlural.toLowerCase()}.
              </p>
              <Link href="/book" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-sidebar-primary" data-testid="link-view-booking">
                View booking page <ArrowRight size={12} />
              </Link>
            </div>
            <button
              onClick={() => logout()}
              className="w-full rounded-xl px-3 py-2 text-left text-xs font-bold text-sidebar-foreground/55 hover:text-sidebar-foreground"
              data-testid="button-admin-logout"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>
      {mobile && (
        <button onClick={() => setMobile(false)} className="fixed inset-0 z-20 bg-foreground/20 md:hidden" aria-label="Close menu" data-testid="button-close-menu" />
      )}
      <main className="min-w-0 flex-1">
        <TopBar title={title} dark={dark} setDark={setDark} onMenu={() => setMobile(true)} unreadCount={unreadCount} />
        {children}
      </main>
    </div>
  );
}

export { Logo };
