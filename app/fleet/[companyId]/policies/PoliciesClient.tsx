'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

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
      allowedHoursStart: form.allowedHoursStart !== '' ? parseInt(form.allowedHoursStart) : null,
      allowedHoursEnd: form.allowedHoursEnd !== '' ? parseInt(form.allowedHoursEnd) : null,
      businessDaysOnly: form.businessDaysOnly,
      acOnly: form.acOnly,
    };
    try {
      const url = editingId
        ? `${API_URL}/api/fleet/companies/${companyId}/policies/${editingId}`
        : `${API_URL}/api/fleet/companies/${companyId}/policies`;
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Save failed');
        return;
      }
      setShowEditor(false);
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this policy?')) return;
    const res = await fetch(`${API_URL}/api/fleet/companies/${companyId}/policies/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? 'Delete failed');
      return;
    }
    router.refresh();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Charging Policies</h1>
        <button
          onClick={openCreate}
          className="bg-[#4CAF50] hover:bg-[#43A047] text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + New policy
        </button>
      </div>

      <div className="space-y-3">
        {policies.map((p) => (
          <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-semibold">{p.name}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {p.maxSpendPerSessionCents != null && (
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                      Max €{(p.maxSpendPerSessionCents / 100).toFixed(2)}/session
                    </span>
                  )}
                  {p.businessDaysOnly && (
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">Business days only</span>
                  )}
                  {p.acOnly && (
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">AC only</span>
                  )}
                  {p.allowedHoursStart != null && p.allowedHoursEnd != null && (
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                      {String(p.allowedHoursStart).padStart(2, '0')}:00 – {String(p.allowedHoursEnd).padStart(2, '0')}:00
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="text-sm text-zinc-400 hover:text-white transition-colors">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="text-sm text-zinc-400 hover:text-red-400 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {policies.length === 0 && (
          <div className="text-center py-16 text-zinc-500">No policies yet. Create one to restrict employee charging.</div>
        )}
      </div>

      {/* Policy Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit policy' : 'New policy'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
              <div>
                <label className="text-sm text-zinc-400 block mb-1.5">Policy name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4CAF50]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-zinc-400 block mb-1.5">Max per session (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.maxSpendPerSessionCents}
                    onChange={(e) => setForm((f) => ({ ...f, maxSpendPerSessionCents: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4CAF50]"
                    placeholder="No limit"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-1.5">Max per month (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.maxMonthlySpendCents}
                    onChange={(e) => setForm((f) => ({ ...f, maxMonthlySpendCents: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4CAF50]"
                    placeholder="No limit"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-zinc-400 block mb-1.5">Allowed from (hour)</label>
                  <select
                    value={form.allowedHoursStart}
                    onChange={(e) => setForm((f) => ({ ...f, allowedHoursStart: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4CAF50]"
                  >
                    <option value="">Any time</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-1.5">Allowed until (hour)</label>
                  <select
                    value={form.allowedHoursEnd}
                    onChange={(e) => setForm((f) => ({ ...f, allowedHoursEnd: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4CAF50]"
                  >
                    <option value="">Any time</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.businessDaysOnly} onChange={(e) => setForm((f) => ({ ...f, businessDaysOnly: e.target.checked }))} className="accent-[#4CAF50]" />
                  <span className="text-sm text-zinc-300">Business days only (Mon–Fri)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.acOnly} onChange={(e) => setForm((f) => ({ ...f, acOnly: e.target.checked }))} className="accent-[#4CAF50]" />
                  <span className="text-sm text-zinc-300">AC charging only (no DC fast charge)</span>
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowEditor(false)} className="flex-1 bg-zinc-800 text-zinc-300 py-2 rounded-lg text-sm hover:bg-zinc-700">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#4CAF50] text-black font-semibold py-2 rounded-lg text-sm disabled:opacity-60">
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
