'use client';

import { startTransition, useEffect, useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { FleetCard, FleetPageHeader } from '@/components/fleet/FleetDashboard';
import { Pagination } from '@/components/fleet/Pagination';
import { fleetButtonClass } from '@/lib/fleet-ui';
import { useT } from '@/lib/i18n';

interface PolicyMember {
  id: string;
  user_name: string | null;
  user_email: string | null;
}

interface Policy {
  id: string;
  name: string;
  applyToAll?: boolean;
  assignedMemberIds?: string[];
  assignedMembers?: PolicyMember[];
  maxSpendPerSessionCents: number | null;
  maxMonthlySpendCents: number | null;
  allowedHoursStart: number | null;
  allowedHoursEnd: number | null;
  businessDaysOnly: boolean;
  acOnly: boolean;
  dcAllowed: boolean;
  roamingAllowed: boolean;
  mandatory: boolean;
}

interface MemberOption {
  id: string;
  user_name: string | null;
  user_email: string;
}

const emptyPolicy = {
  name: '',
  applyToAll: false,
  assignedMemberIds: [] as string[],
  maxSpendPerSessionCents: '',
  maxMonthlySpendCents: '',
  allowedHoursStart: '',
  allowedHoursEnd: '',
  businessDaysOnly: false,
  acOnly: false,
  mandatory: false,
};

export default function PoliciesClient({
  companyId,
  initialPolicies,
  members,
  currentPage,
  totalPages,
  total,
  pageSize,
}: {
  companyId: string;
  initialPolicies: Policy[];
  members: MemberOption[];
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies);
  useEffect(() => {
    setPolicies(initialPolicies);
  }, [initialPolicies]);

  const goToPage = (page: number) => {
    startTransition(() => {
      router.push(page === 1 ? pathname : `${pathname}?page=${page}`);
    });
  };
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

  const openEdit = (policy: Policy) => {
    setEditingId(policy.id);
    setForm({
      name: policy.name,
      applyToAll: policy.applyToAll ?? false,
      assignedMemberIds: policy.assignedMemberIds ?? [],
      maxSpendPerSessionCents: policy.maxSpendPerSessionCents != null ? String(policy.maxSpendPerSessionCents / 100) : '',
      maxMonthlySpendCents: policy.maxMonthlySpendCents != null ? String(policy.maxMonthlySpendCents / 100) : '',
      allowedHoursStart: policy.allowedHoursStart != null ? String(policy.allowedHoursStart) : '',
      allowedHoursEnd: policy.allowedHoursEnd != null ? String(policy.allowedHoursEnd) : '',
      businessDaysOnly: policy.businessDaysOnly,
      acOnly: policy.acOnly,
      mandatory: policy.mandatory,
    });
    setError('');
    setShowEditor(true);
  };

  const toggleAssignedMember = (memberId: string) => {
    setForm((current) => ({
      ...current,
      assignedMemberIds: current.assignedMemberIds.includes(memberId)
        ? current.assignedMemberIds.filter((id) => id !== memberId)
        : [...current.assignedMemberIds, memberId],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      name: form.name,
      applyToAll: form.applyToAll,
      assignedMemberIds: form.applyToAll ? [] : form.assignedMemberIds,
      maxSpendPerSessionCents: form.maxSpendPerSessionCents ? Math.round(parseFloat(form.maxSpendPerSessionCents) * 100) : null,
      maxMonthlySpendCents: form.maxMonthlySpendCents ? Math.round(parseFloat(form.maxMonthlySpendCents) * 100) : null,
      allowedHoursStart: form.allowedHoursStart !== '' ? parseInt(form.allowedHoursStart, 10) : null,
      allowedHoursEnd: form.allowedHoursEnd !== '' ? parseInt(form.allowedHoursEnd, 10) : null,
      businessDaysOnly: form.businessDaysOnly,
      acOnly: form.acOnly,
      mandatory: form.mandatory,
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
        setError(body.error ?? t('policy_save_failed'));
        return;
      }
      const savedPolicy = await res.json().catch(() => null);
      if (savedPolicy?.id) {
        setPolicies((current) =>
          editingId
            ? current.map((policy) => (policy.id === savedPolicy.id ? savedPolicy : policy))
            : [savedPolicy, ...current],
        );
      }
      setShowEditor(false);
      setEditingId(null);
      setForm(emptyPolicy);
      router.refresh();
    } catch {
      setError(t('network_error'));
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
      <FleetPageHeader
        title={t('policies_title')}
        description="Define spending, time, and charging rules for employees and teams."
        actions={
          <button
            onClick={openCreate}
            className={fleetButtonClass('primary', 'md', 'w-full sm:w-auto')}
          >
            <Plus size={16} strokeWidth={2.3} />
            {t('policy_new_btn')}
          </button>
        }
      />

      <div className="space-y-3">
        {policies.map((policy) => (
          <FleetCard key={policy.id} className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-white">{policy.name}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {policy.mandatory && (
                    <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
                      {t('policy_mandatory_badge')}
                    </span>
                  )}
                  {policy.applyToAll && (
                    <span className="rounded bg-[#33d6c5]/15 px-2 py-0.5 text-xs text-[#8cf0e6]">
                      Applies to all employees
                    </span>
                  )}
                  {!policy.applyToAll && (policy.assignedMembers?.length ?? 0) > 0 && (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                      {policy.assignedMembers?.length} employee{policy.assignedMembers?.length === 1 ? '' : 's'}
                    </span>
                  )}
                  {policy.maxSpendPerSessionCents != null && (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                      Max EUR {(policy.maxSpendPerSessionCents / 100).toFixed(2)}/session
                    </span>
                  )}
                  {policy.businessDaysOnly && (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{t('policy_business_days')}</span>
                  )}
                  {policy.acOnly && (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{t('policy_ac_only')}</span>
                  )}
                  {policy.allowedHoursStart != null && policy.allowedHoursEnd != null && (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                      {String(policy.allowedHoursStart).padStart(2, '0')}:00 - {String(policy.allowedHoursEnd).padStart(2, '0')}:00
                    </span>
                  )}
                </div>
                {!policy.applyToAll && (policy.assignedMembers?.length ?? 0) > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {policy.assignedMembers?.map((member) => (
                      <span key={member.id} className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
                        {member.user_name ?? member.user_email ?? 'Employee'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button onClick={() => openEdit(policy)} className={fleetButtonClass('secondary', 'sm')}>
                  {t('btn_edit')}
                </button>
                <button onClick={() => handleDelete(policy.id)} className={fleetButtonClass('danger', 'sm')}>
                  {t('btn_delete')}
                </button>
              </div>
            </div>
          </FleetCard>
        ))}
        {policies.length === 0 && (
          <FleetCard className="py-16 text-center text-zinc-500">{t('policies_empty')}</FleetCard>
        )}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={goToPage} />

      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#7c5cff]/20 bg-[#7c5cff]/10 text-[#9f89ff]">
                <ShieldCheck size={18} strokeWidth={2.1} />
              </span>
              <h2 className="text-lg font-bold text-white">{editingId ? t('policy_edit_title') : t('policy_new_title')}</h2>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">{t('policy_name_label')}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-3">
                <input
                  type="checkbox"
                  checked={form.applyToAll}
                  onChange={(e) => setForm((current) => ({ ...current, applyToAll: e.target.checked }))}
                  className="accent-[#33d6c5]"
                />
                <span className="text-sm text-zinc-300">Apply this policy to all employees by default</span>
              </label>
              {!form.applyToAll && (
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">Assign employees</label>
                  <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                    {members.map((member) => (
                      <label key={member.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-zinc-900">
                        <input
                          type="checkbox"
                          checked={form.assignedMemberIds.includes(member.id)}
                          onChange={() => toggleAssignedMember(member.id)}
                          className="accent-[#33d6c5]"
                        />
                        <span className="text-sm text-zinc-200">
                          {member.user_name ?? member.user_email}
                        </span>
                      </label>
                    ))}
                    {members.length === 0 && (
                      <div className="px-2 py-3 text-sm text-zinc-500">No employees available yet.</div>
                    )}
                  </div>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">{t('policy_max_session')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.maxSpendPerSessionCents}
                    onChange={(e) => setForm((current) => ({ ...current, maxSpendPerSessionCents: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
                    placeholder="No limit"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">{t('policy_max_month')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.maxMonthlySpendCents}
                    onChange={(e) => setForm((current) => ({ ...current, maxMonthlySpendCents: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
                    placeholder="No limit"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">{t('policy_hours_from')}</label>
                  <select
                    value={form.allowedHoursStart}
                    onChange={(e) => setForm((current) => ({ ...current, allowedHoursStart: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
                  >
                    <option value="">{t('policy_any_time')}</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">{t('policy_hours_until')}</label>
                  <select
                    value={form.allowedHoursEnd}
                    onChange={(e) => setForm((current) => ({ ...current, allowedHoursEnd: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
                  >
                    <option value="">{t('policy_any_time')}</option>
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
                    onChange={(e) => setForm((current) => ({ ...current, businessDaysOnly: e.target.checked }))}
                    className="accent-[#33d6c5]"
                  />
                  <span className="text-sm text-zinc-300">{t('policy_business_days_label')}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.acOnly}
                    onChange={(e) => setForm((current) => ({ ...current, acOnly: e.target.checked }))}
                    className="accent-[#33d6c5]"
                  />
                  <span className="text-sm text-zinc-300">{t('policy_ac_only_label')}</span>
                </label>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">{t('policy_enforcement_label')}</label>
                <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-zinc-900">
                    <input
                      type="radio"
                      name="mandatory"
                      checked={!form.mandatory}
                      onChange={() => setForm((current) => ({ ...current, mandatory: false }))}
                      className="mt-0.5 accent-[#33d6c5]"
                    />
                    <span className="text-sm text-zinc-200">{t('policy_soft_option')}</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-zinc-900">
                    <input
                      type="radio"
                      name="mandatory"
                      checked={form.mandatory}
                      onChange={() => setForm((current) => ({ ...current, mandatory: true }))}
                      className="mt-0.5 accent-[#33d6c5]"
                    />
                    <span className="text-sm text-zinc-200">{t('policy_mandatory_option')}</span>
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <button type="button" onClick={() => setShowEditor(false)} className={fleetButtonClass('secondary', 'md', 'flex-1')}>
                  {t('btn_cancel')}
                </button>
                <button type="submit" disabled={saving} className={fleetButtonClass('primary', 'md', 'flex-1')}>
                  {saving ? t('btn_saving') : t('btn_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
