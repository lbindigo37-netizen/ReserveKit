import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Bell, CalendarDays, Heart, Moon, Sun, User } from 'lucide-react';
import { useGetBusiness, useGetNotifications } from '@workspace/api-client-react';

import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { getBusinessTypeConfig } from '@/lib/business';

const tabs = [
  { href: '/account', label: 'Bookings', icon: CalendarDays },
  { href: '/account/favorites', label: 'Favorites', icon: Heart },
  { href: '/account/notifications', label: 'Notifications', icon: Bell },
  { href: '/account/profile', label: 'Profile', icon: User },
];

export function AccountShell({ children, title }: { children: ReactNode; title: string }) {
  const businessQuery = useGetBusiness();
  const [location] = useLocation();
  const [dark, setDark] = useTheme();
  const { user, logout } = useAuth();
  const notificationsQuery = useGetNotifications();
  const unreadCount = notificationsQuery.data?.filter((n) => !n.read).length ?? 0;
  const Icon = getBusinessTypeConfig(businessQuery.data?.type ?? 'Salon').icon;

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-5 py-6 md:px-8">
        <Link href="/" className="flex items-center gap-3" data-testid="link-account-home">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-primary text-primary-foreground shadow-sm">
            <Icon size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display text-[17px] font-bold leading-none tracking-[-.03em]">
            {businessQuery.data?.name ?? 'ReserveKit'}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={() => setDark(!dark)} className="rounded-xl p-2.5 text-muted-foreground hover:bg-muted" aria-label="Toggle theme" data-testid="button-account-theme-toggle">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button onClick={() => logout()} className="text-sm font-semibold text-muted-foreground hover:text-foreground" data-testid="button-account-logout">
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 pb-20 md:px-8">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">Welcome back, {user?.name.split(' ')[0]}</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-[-.05em]">{title}</h1>
        </div>
        <div className="mb-8 flex flex-wrap gap-2 border-b border-border pb-4">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const active = location === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
                data-testid={`link-account-tab-${tab.label.toLowerCase()}`}
              >
                <TabIcon size={14} />
                {tab.label}
                {tab.label === 'Notifications' && unreadCount > 0 && (
                  <span className="rounded-full bg-primary-foreground/20 px-1.5 text-[10px]">{unreadCount}</span>
                )}
              </Link>
            );
          })}
        </div>
        {children}
      </main>
    </div>
  );
}
