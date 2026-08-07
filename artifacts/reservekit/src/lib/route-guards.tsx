import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'wouter';

import { useAuth } from '@/lib/auth';
import { LoadingBlock } from '@/components/shared';

/** Redirects to `/login` unless a user is authenticated. Renders nothing while the initial session check is in flight. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && user === null) {
      navigate('/login');
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <LoadingBlock />
      </div>
    );
  }

  return <>{children}</>;
}

/** Redirects to `/login` unless the authenticated user is an admin. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && (user === null || (user && user.role !== 'admin'))) {
      navigate('/login');
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <LoadingBlock />
      </div>
    );
  }

  return <>{children}</>;
}
