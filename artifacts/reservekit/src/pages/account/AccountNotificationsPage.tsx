import { useQueryClient } from '@tanstack/react-query';
import { useGetNotifications, useMarkNotificationRead, getGetNotificationsQueryKey } from '@workspace/api-client-react';

import { AccountShell } from '@/components/layout/AccountShell';
import { LoadingBlock, EmptyState, ErrorState } from '@/components/shared';

export default function AccountNotificationsPage() {
  const query = useGetNotifications();
  const queryClient = useQueryClient();
  const markRead = useMarkNotificationRead();

  if (query.isLoading) return <AccountShell title="Notifications"><LoadingBlock /></AccountShell>;
  if (query.isError) return <AccountShell title="Notifications"><ErrorState retry={() => query.refetch()} /></AccountShell>;

  const notifications = query.data ?? [];

  return (
    <AccountShell title="Notifications">
      {notifications.length === 0 ? (
        <EmptyState title="You're all caught up" copy="Booking updates and reminders will show up here." />
      ) : (
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() =>
                !notification.read &&
                markRead.mutate(
                  { id: notification.id },
                  { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() }) },
                )
              }
              className="flex w-full items-start justify-between gap-4 p-5 text-left"
              data-testid={`row-notification-${notification.id}`}
            >
              <div>
                <p className="text-sm font-semibold">{notification.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                <p className="mt-2 font-mono-ui text-[9px] uppercase tracking-[.12em] text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
