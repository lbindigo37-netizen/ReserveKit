import { useState } from 'react';
import { Link } from 'wouter';
import { Search } from 'lucide-react';
import { useGetCustomers } from '@workspace/api-client-react';

import { AdminShell } from '@/components/layout/AdminShell';
import { Avatar, EmptyState, ErrorState, LoadingBlock } from '@/components/shared';

export default function CustomersPage() {
  const query = useGetCustomers();
  const [search, setSearch] = useState('');
  const customers = (query.data ?? []).filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminShell title="Customers">
      <div className="space-y-6 p-5 md:p-8">
        <div>
          <p className="text-sm text-muted-foreground">Relationships, not records.</p>
          <h2 className="mt-1 font-display text-3xl font-bold tracking-[-.05em]">Customers</h2>
        </div>
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers"
            className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="input-customers-search"
          />
        </div>
        {query.isLoading ? (
          <LoadingBlock />
        ) : query.isError ? (
          <ErrorState retry={() => query.refetch()} />
        ) : customers.length === 0 ? (
          <EmptyState title="No customers found" copy="Try searching by name or email." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="hidden grid-cols-[1.5fr_1.2fr_.7fr_.8fr_1fr] gap-4 border-b border-border bg-muted/50 px-5 py-3 font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground md:grid">
              <span>Customer</span><span>Contact</span><span>Visits</span><span>Spend</span><span>Last visit</span>
            </div>
            {customers.map((customer) => (
              <Link
                href={`/admin/customers/${customer.id}`}
                key={customer.id}
                className="grid gap-3 border-b border-border px-5 py-4 last:border-0 hover:bg-muted/40 md:grid-cols-[1.5fr_1.2fr_.7fr_.8fr_1fr] md:items-center md:gap-4"
                data-testid={`row-customer-${customer.id}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar initials={customer.initials} color={customer.color} />
                  <p className="text-sm font-semibold">{customer.name}</p>
                </div>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
                <p className="text-sm">{customer.visits} visits</p>
                <p className="text-sm font-semibold">${customer.spending.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{customer.lastVisit}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
