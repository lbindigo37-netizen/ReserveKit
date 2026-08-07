import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { useGetProfile, useUpdateProfile, getGetProfileQueryKey } from '@workspace/api-client-react';

import { AccountShell } from '@/components/layout/AccountShell';
import { LoadingBlock, ErrorState } from '@/components/shared';

export default function AccountProfilePage() {
  const query = useGetProfile();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (query.data) {
      setForm({ name: query.data.name, phone: query.data.phone ?? '' });
    }
  }, [query.data]);

  if (query.isLoading) return <AccountShell title="Profile"><LoadingBlock /></AccountShell>;
  if (query.isError) return <AccountShell title="Profile"><ErrorState retry={() => query.refetch()} /></AccountShell>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      { data: { name: form.name, phone: form.phone } },
      {
        onSuccess: () => {
          setSaved(true);
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          setTimeout(() => setSaved(false), 2400);
        },
      },
    );
  };

  return (
    <AccountShell title="Profile">
      <div className="max-w-lg">
        {saved && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-secondary bg-secondary/50 px-4 py-3 text-sm font-semibold text-secondary-foreground" data-testid="status-profile-saved">
            <Check size={16} /> Profile updated.
          </div>
        )}
        <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-border bg-card p-6">
          <label className="grid gap-2 text-xs font-bold">
            Full name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="input-profile-name"
            />
          </label>
          <label className="grid gap-2 text-xs font-bold">
            Email
            <input value={query.data?.email ?? ''} disabled className="h-11 rounded-xl border border-border bg-muted px-3 text-sm font-normal text-muted-foreground outline-none" />
          </label>
          <label className="grid gap-2 text-xs font-bold">
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Optional"
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="input-profile-phone"
            />
          </label>
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="mt-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            data-testid="button-save-profile"
          >
            {updateProfile.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </AccountShell>
  );
}
