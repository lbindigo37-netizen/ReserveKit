import { Link } from 'wouter';
import { Heart } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetFavorites, useRemoveFavorite, getGetFavoritesQueryKey } from '@workspace/api-client-react';

import { AccountShell } from '@/components/layout/AccountShell';
import { LoadingBlock, EmptyState, ErrorState } from '@/components/shared';

export default function AccountFavoritesPage() {
  const query = useGetFavorites();
  const queryClient = useQueryClient();
  const removeFavorite = useRemoveFavorite();

  if (query.isLoading) return <AccountShell title="Favorites"><LoadingBlock /></AccountShell>;
  if (query.isError) return <AccountShell title="Favorites"><ErrorState retry={() => query.refetch()} /></AccountShell>;

  const favorites = query.data ?? [];

  return (
    <AccountShell title="Favorites">
      {favorites.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          copy="Mark services as favorites from the booking page to find them quickly next time."
          action={<Link href="/book" className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Browse services</Link>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {favorites.map((service) => (
            <div key={service.id} className="rounded-2xl border border-border bg-card p-5" data-testid={`card-favorite-${service.id}`}>
              <div className="flex items-start justify-between">
                <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: service.color }} />
                <button
                  onClick={() =>
                    removeFavorite.mutate(
                      { serviceId: service.id },
                      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() }) },
                    )
                  }
                  className="text-destructive"
                  aria-label="Remove from favorites"
                  data-testid={`button-unfavorite-${service.id}`}
                >
                  <Heart size={18} fill="currentColor" />
                </button>
              </div>
              <p className="mt-6 font-display text-lg font-bold">{service.name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
              <p className="mt-4 font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">
                {service.duration} min · ${service.price}
              </p>
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
