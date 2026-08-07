import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetStaff, useGetServices, useCreateStaff, useUpdateStaff, useDeleteStaff, getGetStaffQueryKey,
  type Staff,
} from '@workspace/api-client-react';

import { AdminShell } from '@/components/layout/AdminShell';
import { Avatar, ErrorState, LoadingBlock } from '@/components/shared';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type FormState = {
  name: string;
  role: string;
  color: string;
  active: boolean;
  workingDays: number[];
  startHour: number;
  endHour: number;
  serviceIds: number[];
};

const emptyForm: FormState = { name: '', role: '', color: '#c69a58', active: true, workingDays: [1, 2, 3, 4, 5], startHour: 9, endHour: 19, serviceIds: [] };

export default function StaffPage() {
  const query = useGetStaff();
  const servicesQuery = useGetServices({ includeInactive: true });
  const queryClient = useQueryClient();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  const [selected, setSelected] = useState<Staff | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (selected) {
      const days = [...new Set(selected.workingHours.map((h) => h.weekday))];
      setForm({
        name: selected.name,
        role: selected.role,
        color: selected.color,
        active: selected.active,
        workingDays: days,
        startHour: selected.workingHours[0] ? selected.workingHours[0].startMinute / 60 : 9,
        endHour: selected.workingHours[0] ? selected.workingHours[0].endMinute / 60 : 19,
        serviceIds: selected.serviceIds,
      });
    } else if (creating) {
      setForm(emptyForm);
    }
  }, [selected, creating]);

  const staff = query.data ?? [];
  const services = servicesQuery.data ?? [];

  const closeModal = () => {
    setSelected(null);
    setCreating(false);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetStaffQueryKey() });

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day) ? prev.workingDays.filter((d) => d !== day) : [...prev.workingDays, day],
    }));
  };

  const toggleService = (serviceId: number) => {
    setForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId) ? prev.serviceIds.filter((id) => id !== serviceId) : [...prev.serviceIds, serviceId],
    }));
  };

  const save = () => {
    const payload = {
      name: form.name,
      role: form.role,
      color: form.color,
      active: form.active,
      workingHours: form.workingDays.map((weekday) => ({
        weekday,
        startMinute: form.startHour * 60,
        endMinute: form.endHour * 60,
      })),
      serviceIds: form.serviceIds,
    };
    if (selected) {
      updateStaff.mutate({ id: selected.id, data: payload }, { onSuccess: () => { invalidate(); closeModal(); } });
    } else {
      createStaff.mutate({ data: payload }, { onSuccess: () => { invalidate(); closeModal(); } });
    }
  };

  const remove = (id: number) => {
    deleteStaff.mutate({ id }, { onSuccess: invalidate });
  };

  return (
    <AdminShell title="Staff">
      <div className="space-y-7 p-5 md:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">The people behind the work.</p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-[-.05em]">Staff directory</h2>
          </div>
          <button onClick={() => setCreating(true)} className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground" data-testid="button-add-staff">
            <Plus size={15} /> Add team member
          </button>
        </div>

        {query.isLoading ? (
          <LoadingBlock />
        ) : query.isError ? (
          <ErrorState retry={() => query.refetch()} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {staff.map((person) => (
              <button
                onClick={() => setSelected(person)}
                key={person.id}
                className={`text-left rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-1 ${!person.active ? 'opacity-60' : ''}`}
                data-testid={`card-staff-admin-${person.id}`}
              >
                <div className="flex items-start justify-between">
                  <Avatar initials={person.initials} color={person.color} size="lg" />
                  <span className="font-mono-ui text-[10px] text-muted-foreground">{person.bookings} bookings</span>
                </div>
                <p className="mt-6 font-display text-xl font-bold">{person.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{person.role}</p>
                {person.vacations.length > 0 && (
                  <p className="mt-2 font-mono-ui text-[9px] uppercase tracking-wide text-accent">
                    On vacation {person.vacations[0].startDate} – {person.vacations[0].endDate}
                  </p>
                )}
                <div className="mt-8 flex items-end justify-between">
                  <div>
                    <p className="font-mono-ui text-[9px] uppercase tracking-[.15em] text-muted-foreground">Utilization</p>
                    <p className="mt-1 font-display text-2xl font-bold">{person.utilization}%</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${person.utilization}%` }} />
                </div>
              </button>
            ))}
          </div>
        )}

        {(selected || creating) && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/20 p-4 sm:items-center" onClick={closeModal}>
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-bold">{creating ? 'New team member' : 'Edit team member'}</h3>
                <button onClick={closeModal} className="rounded-lg p-2 hover:bg-muted" data-testid="button-close-staff"><X size={17} /></button>
              </div>
              <div className="mt-6 grid max-h-[55vh] gap-3 overflow-y-auto pr-1">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" data-testid="input-staff-name" />
                <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Role" className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none" data-testid="input-staff-role" />
                <label className="flex items-center gap-2 text-xs font-bold">
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-8 w-8 rounded" /> Accent color
                </label>
                <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} data-testid="checkbox-staff-active" /> Active</label>

                <div>
                  <p className="text-xs font-bold">Working days</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {weekdayLabels.map((label, day) => (
                      <button
                        key={label}
                        onClick={() => toggleDay(day)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${form.workingDays.includes(day) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                        data-testid={`button-staff-day-${day}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs font-bold">
                    Start hour
                    <input type="number" min={0} max={23} value={form.startHour} onChange={(e) => setForm({ ...form, startHour: Number(e.target.value) })} className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none" data-testid="input-staff-start-hour" />
                  </label>
                  <label className="grid gap-1 text-xs font-bold">
                    End hour
                    <input type="number" min={0} max={23} value={form.endHour} onChange={(e) => setForm({ ...form, endHour: Number(e.target.value) })} className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none" data-testid="input-staff-end-hour" />
                  </label>
                </div>
                <div>
                  <p className="text-xs font-bold">Services offered</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${form.serviceIds.includes(service.id) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                        data-testid={`button-staff-service-${service.id}`}
                      >
                        {service.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                {!creating && selected && (
                  <button onClick={() => remove(selected.id)} className="inline-flex items-center gap-2 text-xs font-bold text-destructive" data-testid="button-delete-staff">
                    <Trash2 size={14} /> Delete
                  </button>
                )}
                <button
                  onClick={save}
                  disabled={createStaff.isPending || updateStaff.isPending || !form.name}
                  className="ml-auto rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
                  data-testid="button-save-staff"
                >
                  Save team member
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
