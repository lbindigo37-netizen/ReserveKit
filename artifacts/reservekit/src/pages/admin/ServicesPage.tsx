import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetServices, useGetStaff, useCreateService, useUpdateService, useDeleteService, getGetServicesQueryKey,
  type Service,
} from '@workspace/api-client-react';

import { AdminShell } from '@/components/layout/AdminShell';
import { ErrorState, LoadingBlock } from '@/components/shared';

type FormState = {
  name: string;
  category: string;
  description: string;
  duration: number;
  bufferMinutes: number;
  price: number;
  color: string;
  popular: boolean;
  active: boolean;
  staffIds: number[];
};

const emptyForm: FormState = {
  name: '', category: '', description: '', duration: 30, bufferMinutes: 10, price: 0, color: '#c36b4f', popular: false, active: true, staffIds: [],
};

export default function ServicesPage() {
  const query = useGetServices({ includeInactive: true });
  const staffQuery = useGetStaff();
  const queryClient = useQueryClient();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [selected, setSelected] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (selected) {
      setForm({
        name: selected.name,
        category: selected.category,
        description: selected.description,
        duration: selected.duration,
        bufferMinutes: selected.bufferMinutes,
        price: selected.price,
        color: selected.color,
        popular: selected.popular,
        active: selected.active,
        staffIds: selected.staffIds,
      });
    } else if (creating) {
      setForm(emptyForm);
    }
  }, [selected, creating]);

  const staff = staffQuery.data ?? [];
  const services = query.data ?? [];

  const closeModal = () => {
    setSelected(null);
    setCreating(false);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetServicesQueryKey({ includeInactive: true }) });

  const save = () => {
    if (selected) {
      updateService.mutate({ id: selected.id, data: form }, { onSuccess: () => { invalidate(); closeModal(); } });
    } else {
      createService.mutate({ data: form }, { onSuccess: () => { invalidate(); closeModal(); } });
    }
  };

  const remove = (id: number) => {
    deleteService.mutate({ id }, { onSuccess: invalidate });
  };

  const toggleStaff = (staffId: number) => {
    setForm((prev) => ({
      ...prev,
      staffIds: prev.staffIds.includes(staffId) ? prev.staffIds.filter((id) => id !== staffId) : [...prev.staffIds, staffId],
    }));
  };

  return (
    <AdminShell title="Services">
      <div className="space-y-7 p-5 md:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">What guests come in for.</p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-[-.05em]">Service catalog</h2>
          </div>
          <button onClick={() => setCreating(true)} className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground" data-testid="button-add-service">
            <Plus size={15} /> Add service
          </button>
        </div>

        {query.isLoading ? (
          <LoadingBlock />
        ) : query.isError ? (
          <ErrorState retry={() => query.refetch()} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {services.map((service) => (
              <button
                onClick={() => setSelected(service)}
                className={`group relative text-left rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-1 ${!service.active ? 'opacity-60' : ''}`}
                key={service.id}
                data-testid={`card-service-admin-${service.id}`}
              >
                <div className="flex items-start justify-between">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: service.color }} />
                  <div className="flex items-center gap-2">
                    {!service.active && <span className="rounded-full bg-muted px-2 py-1 font-mono-ui text-[9px] uppercase tracking-wide text-muted-foreground">Inactive</span>}
                    {service.popular && <span className="rounded-full bg-primary/10 px-2 py-1 font-mono-ui text-[9px] uppercase tracking-wide text-primary">Popular</span>}
                  </div>
                </div>
                <p className="mt-8 font-display text-xl font-bold">{service.name}</p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">{service.category} · {service.duration} min</span>
                  <span className="font-display text-xl font-bold">${service.price}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {(selected || creating) && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/20 p-4 sm:items-center" onClick={closeModal}>
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-bold">{creating ? 'New service' : 'Edit service'}</h3>
                <button onClick={closeModal} className="rounded-lg p-2 hover:bg-muted" data-testid="button-close-service"><X size={17} /></button>
              </div>
              <div className="mt-6 grid max-h-[55vh] gap-3 overflow-y-auto pr-1">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Service name" className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" data-testid="input-service-name" />
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none" data-testid="input-service-category" />
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" data-testid="textarea-service-description" />
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} placeholder="Duration (min)" className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none" data-testid="input-service-duration" />
                  <input type="number" value={form.bufferMinutes} onChange={(e) => setForm({ ...form, bufferMinutes: Number(e.target.value) })} placeholder="Buffer (min)" className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none" data-testid="input-service-buffer" />
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="Price" className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none" data-testid="input-service-price" />
                </div>
                <label className="flex items-center gap-2 text-xs font-bold">
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-8 w-8 rounded" /> Accent color
                </label>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} data-testid="checkbox-service-popular" /> Popular</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} data-testid="checkbox-service-active" /> Active</label>
                </div>
                <div>
                  <p className="text-xs font-bold">Staff who offer this service</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {staff.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => toggleStaff(member.id)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${form.staffIds.includes(member.id) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                        data-testid={`button-service-staff-${member.id}`}
                      >
                        {member.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                {!creating && selected && (
                  <button onClick={() => remove(selected.id)} className="inline-flex items-center gap-2 text-xs font-bold text-destructive" data-testid="button-delete-service">
                    <Trash2 size={14} /> Delete
                  </button>
                )}
                <button
                  onClick={save}
                  disabled={createService.isPending || updateService.isPending || !form.name}
                  className="ml-auto rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
                  data-testid="button-save-service"
                >
                  Save service
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
