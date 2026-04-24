'use client';

import { useEffect, useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fleetButtonClass } from '@/lib/fleet-ui';

interface Policy {
  id: string;
  name: string;
  maxSpendPerSessionCents: number | null;
  maxMonthlySpendCents: number | null;
  allowedHoursStart: number | null;
  allowedHoursEnd: number | null;
  businessDaysOnly: boolean;
  acOnly: boolean;
  dcAllowed: boolean;
  roamingAllowed: boolean;
}

const emptyPolicy = {
  name: '',
  maxSpendPerSessionCents: '',
  maxMonthlySpendCents: '',
  allowedHoursStart: '',
  allowedHoursEnd: '',
  businessDaysOnly: false,
  acOnly: false,
};

export default function PoliciesClient({
  companyId,
  initialPolicies,
}: {
  companyId: string;
  initialPolicies: Policy[];
}) {
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies);
  useEffect(() => {
    setPolicies(initialPolicies);
  }, [initialPolicies]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyPolicy);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyPolicy);
    setError('');
    setShowEditor(true);
  };

  const openEdit = (p: Policy) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      maxSpendPerSessionCents: p.maxSpendPerSessionCents != null ? String(p.maxSpendPerSessionCents / 100) : '',
      maxMonthlySpendCents: p.maxMonthlySpendCents != null ? String(p.maxMonthlySpendCents / 100) : '',
      allowedHoursStart: p.allowedHoursStart != null ? String(p.allowedHoursStart) : '',
      allowedHoursEnd: p.allowedHoursEnd != null ? String(p.allowedHoursEnd) : '',
      businessDaysOnly: p.businessDaysOnly,
      acOnly: p.acOnly,
    });
    setError('');
    setShowEditor(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      name: form.name,
      maxSpendPerSessionCents: form.maxSpendPerSessionCents ? Math.round(parseFloat(form.maxSpendPerSessionCents) * 100) : null,
      maxMonthlySpendCents: form.maxMonthlySpendCents ? Math.round(parseFloat(form.maxMonthlySpendCents) * 100) : null,
      allowedHoursStart: form.allowedHoursStart !== '' ? parseInt(form.allowedHoursStart, 10) : null,
      allowedHoursEnd: form.allowedHoursEnd !== '' ? parseInt(form.allowedHoursEnd, 10) : null,
      businessDaysOnly: form.businessDaysOnly,
      acOnly: form.acOnly,
    };
    try {
      const url = editingId
        ? `/api/fleet/${companyId}/policies/${editingId}`
        : `/api/fleet/${companyId}/policies`;
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Save failed');
        return;
      }
      const body = await res.json().catch(() => null);
      const savedPolicy =
        body && typeof body === 'object' && 'policy' in body
          ? (body.policy as Policy)
          : (body as Policy | null);
      if (savedPolicy?.id) {
        setPolicies((current) => {
          if (editingId) {
            return current.map((policy) => (policy.id === savedPolicy.id ? savedPolicy : policy));
          }
          return [savedPolicy, ...current];
        });
      }
      setShowEditor(false);
      setEditingId(null);
      setForm(emptyPolicy);
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this policy?')) return;
    const res = await fetch(`/api/fleet/${companyId}/policies/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? 'Delete failed');
      return;
    }
    setPolicies((current) => current.filter((policy) => policy.id !== id));
    router.refresh();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Charging Policies</h1>
        <button
          onClick={openCreate}
          className={fleetButtonClass('primary', 'md', 'w-full sm:w-auto')}
        >
          <Plus size={16} strokeWidth={2.3} />
          New policy
        </button>
      </div>

      <div className="space-y-3">
        {policies.map((p) => (
          <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-white">{p.name}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.maxSpendPerSessionCents != null && (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                      Max EUR {(p.maxSpendPerSessionCents / 100).toFixed(2)}/session
                    </span>
                  )}
                  {p.businessDaysOnly && (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">Business days only</span>
                  )}
                  {p.acOnly && (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">AC only</span>
                  )}
                  {p.allowedHoursStart != null && p.allowedHoursEnd != null && (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                      {String(p.allowedHoursStart).padStart(2, '0')}:00 - {String(p.allowedHoursEnd).padStart(2, '0')}:00
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button onClick={() => openEdit(p)} className={fleetButtonClass('secondary', 'sm')}>
                  Edit
                </button>
                <button onClick={() => handleDelete(p.id)} className={fleetButtonClass('danger', 'sm')}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {policies.length === 0 && (
          <div className="py-16 text-center text-zinc-500">No policies yet. Create one to restrict employee charging.</div>
        )}
      </div>

      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#7c5cff]/20 bg-[#7c5cff]/10 text-[#9f89ff]">
                <ShieldCheck size={18} strokeWidth={2.1} />
              </span>
              <h2 className="text-lg font-bold text-white">{editingId ? 'Edit policy' : 'New policy'}</h2>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">Policy name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">Max per session (EUR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.maxSpendPerSessionCents}
                    onChange={(e) => setForm((f) => ({ ...f, maxSpendPerSessionCents: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
                    placeholder="No limit"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">Max per month (EUR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.maxMonthlySpendCents}
                    onChange={(e) => setForm((f) => ({ ...f, maxMonthlySpendCents: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
                    placeholder="No limit"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">Allowed from (hour)</label>
                  <select
                    value={form.allowedHoursStart}
                    onChange={(e) => setForm((f) => ({ ...f, allowedHoursStart: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
                  >
                    <option value="">Any time</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">Allowed until (hour)</label>
                  <select
                    value={form.allowedHoursEnd}
                    onChange={(e) => setForm((f) => ({ ...f, allowedHoursEnd: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
                  >
                    <option value="">Any time</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.businessDaysOnly}
                    onChange={(e) => setForm((f) => ({ ...f, businessDaysOnly: e.target.checked }))}
                    className="accent-[#33d6c5]"
                  />
                  <span className="text-sm text-zinc-300">Business days only (Mon-Fri)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.acOnly}
                    onChange={(e) => setForm((f) => ({ ...f, acOnly: e.target.checked }))}
                    className="accent-[#33d6c5]"
                  />
                  <span className="text-sm text-zinc-300">AC charging only (no DC fast charge)</span>
                </label>
              </div>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <button type="button" onClick={() => setShowEditor(false)} className={fleetButtonClass('secondary', 'md', 'flex-1')}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={fleetButtonClass('primary', 'md', 'flex-1')}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
