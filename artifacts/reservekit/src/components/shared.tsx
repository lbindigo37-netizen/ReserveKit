import type { ReactNode } from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';

export function LoadingBlock() {
  return (
    <div className="animate-pulse space-y-4" data-testid="loading-block">
      <div className="h-8 w-48 rounded-lg bg-muted" />
      <div className="h-28 rounded-2xl bg-muted" />
      <div className="h-44 rounded-2xl bg-muted" />
    </div>
  );
}

export function EmptyState({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center" data-testid="empty-state">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Sparkles size={18} />
      </span>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{copy}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ retry }: { retry?: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center" data-testid="error-state">
      <AlertCircle className="mx-auto mb-2 text-destructive" size={22} />
      <p className="text-sm font-semibold">We couldn't load this view.</p>
      <p className="mt-1 text-xs text-muted-foreground">Try again in a moment.</p>
      {retry && (
        <button
          onClick={retry}
          className="mt-4 rounded-lg bg-destructive px-3 py-2 text-xs font-bold text-destructive-foreground"
          data-testid="button-retry"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function Avatar({ initials, color, size = 'md' }: { initials: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'h-12 w-12 text-sm' : size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-9 w-9 text-xs';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-mono-ui font-bold ${cls}`}
      style={{ backgroundColor: `${color}22`, color }}
      data-testid={`avatar-${initials}`}
    >
      {initials}
    </span>
  );
}

const statusPillConfig: Record<string, string> = {
  confirmed: 'bg-secondary text-secondary-foreground',
  pending: 'bg-accent/10 text-accent',
  cancelled: 'bg-destructive/10 text-destructive',
  completed: 'bg-muted text-muted-foreground',
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusPillConfig[status] || statusPillConfig.pending}`}
      data-testid={`status-${status}`}
    >
      {status}
    </span>
  );
}

const paymentPillConfig: Record<string, string> = {
  paid: 'bg-secondary text-secondary-foreground',
  pending: 'bg-accent/10 text-accent',
  refunded: 'bg-muted text-muted-foreground',
};

export function PaymentPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${paymentPillConfig[status] || paymentPillConfig.pending}`}
      data-testid={`payment-${status}`}
    >
      {status}
    </span>
  );
}
