import { useQueryClient } from '@tanstack/react-query';
import { useGetNotifications, useMarkNotificationRead, getGetNotificationsQueryKey } from '@workspace/api-client-react';

import { AdminShell } from '@/components/layout/AdminShell';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/shared';

export default function NotificationsPage() {
  const query = useGetNotifications();
  const queryClient = useQueryClient();
  const markRead = useMarkNotificationRead();

  if (query.isLoading) return <AdminShell title="Notifications"><div className="p-6 md:p-8"><LoadingBlock /></div></AdminShell>;
  if (query.isError) return <AdminShell title="Notifications"><div className="p-6 md:p-8"><ErrorState retry={() => query.refetch()} /></div></AdminShell>;

  const notifications = query.data ?? [];

  return (
    <AdminShell title="Notifications">
      <div className="space-y-6 p-5 md:p-8">
        {notifications.length === 0 ? (
          <EmptyState title="Nothing new" copy="Booking activity will show up here." />
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
                data-testid={`row-admin-notification-${notification.id}`}
              >
                <div>
                  <p className="text-sm font-semibold">{notification.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                </div>
                {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
