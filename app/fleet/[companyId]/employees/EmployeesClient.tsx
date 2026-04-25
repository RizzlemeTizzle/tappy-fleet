'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { Pencil, Plus, UserPlus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { FleetCard, FleetPageHeader } from '@/components/fleet/FleetDashboard';
import { Pagination } from '@/components/fleet/Pagination';
import { fleetButtonClass } from '@/lib/fleet-ui';
import { useT } from '@/lib/i18n';

interface Member {
  id: string;
  user_name: string | null;
  user_email: string;
  role: string;
  status: string;
  billing_mode: string;
  department_id?: string | null;
  department_name?: string | null;
  policy_id?: string | null;
  policy_name?: string | null;
}

interface Policy {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

const ROLES = ['EMPLOYEE', 'TEAM_MANAGER', 'FLEET_ADMIN', 'FINANCE_ADMIN', 'FLEET_OWNER'];
const BILLING_MODES = [
  { value: 'COMPANY_PAID', label: 'Company paid' },
  { value: 'EMPLOYEE_REIMBURSABLE', label: 'Reimbursable' },
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  INVITED: 'bg-yellow-500/20 text-yellow-400',
  SUSPENDED: 'bg-red-500/20 text-red-400',
};

const inputCls =
  'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-[#33d6c5] focus:outline-none';

function DepartmentCombobox({
  value,
  onChange,
  departments,
  placeholder = 'e.g. Engineering',
}: {
  value: string;
  onChange: (v: string) => void;
  departments: Department[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestions = departments.filter(
    (d) => d.name.toLowerCase().includes(value.toLowerCase()),
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className={inputCls}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 shadow-lg">
          {suggestions.map((d) => (
            <li
              key={d.id}
              onMouseDown={(e) => { e.preventDefault(); onChange(d.name); setOpen(false); }}
              className="cursor-pointer px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              {d.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EmployeesClient({
  companyId,
  initialMembers,
  policies,
  departments: initialDepartments,
  currentPage,
  totalPages,
  total,
  pageSize,
}: {
  companyId: string;
  initialMembers: Member[];
  policies: Policy[];
  departments: Department[];
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  useEffect(() => { setMembers(initialMembers); }, [initialMembers]);
  useEffect(() => { setDepartments(initialDepartments); }, [initialDepartments]);

  const goToPage = (page: number) => {
    startTransition(() => {
      router.push(page === 1 ? pathname : `${pathname}?page=${page}`);
    });
  };

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('EMPLOYEE');
  const [inviteBillingMode, setInviteBillingMode] = useState('COMPANY_PAID');
  const [inviteDepartmentName, setInviteDepartmentName] = useState('');
  const [invitePolicyId, setInvitePolicyId] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviting, setInviting] = useState(false);

  // Edit modal state
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({
    role: '',
    billingMode: '',
    departmentName: '',
    policyId: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [actionError, setActionError] = useState('');
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  const isOwner = (member: Member) => member.role === 'FLEET_OWNER';
  const billingLabel = (mode: string) =>
    BILLING_MODES.find((m) => m.value === mode)?.label ?? mode.replace(/_/g, ' ');

  // Resolve a department name to an ID, creating the department if it doesn't exist yet.
  const resolveDepartmentId = async (name: string): Promise<string | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const existing = departments.find((d) => d.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;
    try {
      const res = await fetch(`/api/fleet/${companyId}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const newId: string | undefined = data.id ?? data.department?.id;
      if (newId) {
        const newDept: Department = { id: newId, name: trimmed };
        setDepartments((prev) => [...prev, newDept]);
        return newId;
      }
    } catch { /* ignore */ }
    return null;
  };

  const openEdit = (member: Member) => {
    setEditError('');
    setEditForm({
      role: member.role,
      billingMode: member.billing_mode,
      departmentName: member.department_name ?? '',
      policyId: member.policy_id ?? '',
    });
    setEditingMember(member);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setEditSaving(true);
    setEditError('');
    try {
      const departmentId = await resolveDepartmentId(editForm.departmentName);
      const res = await fetch(`/api/fleet/${companyId}/members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editForm.role,
          billingMode: editForm.billingMode,
          departmentId,
          policyId: editForm.policyId || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(body.error ?? t('emp_action_failed'));
        return;
      }
      const policyName = policies.find((p) => p.id === editForm.policyId)?.name ?? null;
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
            ? {
                ...m,
                role: editForm.role,
                billing_mode: editForm.billingMode,
                department_id: departmentId,
                department_name: editForm.departmentName.trim() || null,
                policy_id: editForm.policyId || null,
                policy_name: policyName,
              }
            : m,
        ),
      );
      setEditingMember(null);
    } catch {
      setEditError(t('network_error'));
    } finally {
      setEditSaving(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviting(true);
    try {
      const departmentId = await resolveDepartmentId(inviteDepartmentName);
      const res = await fetch(`/api/fleet/${companyId}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          billingMode: inviteBillingMode,
          departmentId: departmentId ?? undefined,
          policyId: invitePolicyId || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setInviteError(body.error ?? t('invite_failed'));
        return;
      }
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('EMPLOYEE');
      setInviteBillingMode('COMPANY_PAID');
      setInviteDepartmentName('');
      setInvitePolicyId('');
      router.refresh();
    } catch {
      setInviteError(t('network_error'));
    } finally {
      setInviting(false);
    }
  };

  const handleSuspend = async (member: Member) => {
    const newStatus = member.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setActionError('');
    setBusyMemberId(member.id);
    try {
      const res = await fetch(`/api/fleet/${companyId}/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setActionError(body.error ?? t('emp_action_failed'));
        return;
      }
      setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, status: newStatus } : m));
    } catch {
      setActionError(t('network_error'));
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleResendInvite = async (member: Member) => {
    setActionError('');
    setBusyMemberId(member.id);
    try {
      const res = await fetch(`/api/fleet/${companyId}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: member.user_email,
          role: member.role,
          billingMode: member.billing_mode,
          departmentId: member.department_id ?? undefined,
          policyId: member.policy_id ?? undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setActionError(body.error ?? t('emp_resend_failed'));
    } catch {
      setActionError(t('network_error'));
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm(t('emp_confirm_remove'))) return;
    const res = await fetch(`/api/fleet/${companyId}/members/${memberId}`, { method: 'DELETE' });
    if (res.ok) setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <FleetPageHeader
        title={t('nav_employees')}
        description="Manage fleet access, billing modes, departments, and policy assignments."
        actions={
          <button
            onClick={() => setShowInvite(true)}
            className={fleetButtonClass('primary', 'md', 'w-full sm:w-auto')}
          >
            <Plus size={16} strokeWidth={2.3} />
            {t('emp_invite_btn')}
          </button>
        }
      />

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {actionError}
        </div>
      )}

      {/* Desktop table */}
      <FleetCard className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="px-5 py-3 text-left">{t('emp_col_name')}</th>
                <th className="px-5 py-3 text-left">{t('emp_col_role')}</th>
                <th className="px-5 py-3 text-left">Billing mode</th>
                <th className="px-5 py-3 text-left">Department</th>
                <th className="px-5 py-3 text-left">Policy</th>
                <th className="px-5 py-3 text-left">{t('emp_col_status')}</th>
                <th className="px-5 py-3 text-left">{t('emp_col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-5 py-3">
                    <div className="font-medium text-white">{member.user_name ?? '-'}</div>
                    <div className="text-xs text-zinc-400">{member.user_email}</div>
                  </td>
                  <td className="px-5 py-3 text-zinc-300">{member.role.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3 text-zinc-300">{billingLabel(member.billing_mode)}</td>
                  <td className="px-5 py-3 text-zinc-300">{member.department_name ?? '—'}</td>
                  <td className="px-5 py-3 text-zinc-300">{member.policy_name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[member.status] ?? 'bg-zinc-700 text-zinc-400'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openEdit(member)}
                        disabled={busyMemberId === member.id}
                        className={fleetButtonClass('subtle', 'sm')}
                      >
                        <Pencil size={13} strokeWidth={2.2} />
                        Edit
                      </button>
                      {member.status === 'INVITED' && (
                        <button
                          onClick={() => void handleResendInvite(member)}
                          disabled={busyMemberId === member.id}
                          className={fleetButtonClass('subtle', 'sm')}
                        >
                          {busyMemberId === member.id ? t('emp_resending') : t('emp_resend_invite')}
                        </button>
                      )}
                      <button
                        onClick={() => void handleSuspend(member)}
                        disabled={busyMemberId === member.id}
                        className={fleetButtonClass('secondary', 'sm')}
                      >
                        {member.status === 'SUSPENDED' ? t('emp_activate') : t('emp_suspend')}
                      </button>
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={busyMemberId === member.id}
                        className={fleetButtonClass('danger', 'sm')}
                      >
                        {t('emp_remove')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">
                    {t('emp_empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-800 px-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={goToPage} />
        </div>
      </FleetCard>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {members.length === 0 && (
          <FleetCard className="px-4 py-10 text-center text-zinc-500">
            {t('emp_empty')}
          </FleetCard>
        )}
        {members.map((member) => (
          <FleetCard key={member.id} as="article" className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-white">{member.user_name ?? '-'}</h2>
                <p className="mt-1 break-all text-sm text-zinc-400">{member.user_email}</p>
              </div>
              <span className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${STATUS_STYLES[member.status] ?? 'bg-zinc-700 text-zinc-400'}`}>
                {member.status}
              </span>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <MobileRow label={t('emp_col_role')} value={member.role.replace(/_/g, ' ')} />
              <MobileRow label="Billing" value={billingLabel(member.billing_mode)} />
              <MobileRow label="Department" value={member.department_name ?? '—'} />
              <MobileRow label="Policy" value={member.policy_name ?? '—'} />
            </dl>
            <div className="mt-4 grid gap-2">
              <button
                onClick={() => openEdit(member)}
                disabled={busyMemberId === member.id}
                className={fleetButtonClass('subtle', 'md', 'w-full')}
              >
                <Pencil size={14} strokeWidth={2.2} />
                Edit employee
              </button>
              {member.status === 'INVITED' && (
                <button
                  onClick={() => void handleResendInvite(member)}
                  disabled={busyMemberId === member.id}
                  className={fleetButtonClass('subtle', 'md', 'w-full')}
                >
                  {busyMemberId === member.id ? t('emp_resending') : t('emp_resend_invite')}
                </button>
              )}
              <button
                onClick={() => void handleSuspend(member)}
                disabled={busyMemberId === member.id}
                className={fleetButtonClass('secondary', 'md', 'w-full')}
              >
                {member.status === 'SUSPENDED' ? t('emp_activate') : t('emp_suspend')}
              </button>
              <button
                onClick={() => handleRemove(member.id)}
                disabled={busyMemberId === member.id}
                className={fleetButtonClass('danger', 'md', 'w-full')}
              >
                {t('emp_remove')}
              </button>
            </div>
          </FleetCard>
        ))}
      </div>
      <div className="md:hidden">
        <Pagination currentPage={currentPage} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={goToPage} />
      </div>

      {/* Invite member modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#33d6c5]/20 bg-[#33d6c5]/10 text-[#7ce9de]">
                <UserPlus size={18} strokeWidth={2.1} />
              </span>
              <h2 className="text-lg font-bold text-white">{t('emp_invite_title')}</h2>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              {inviteError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {inviteError}
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">{t('label_email')}</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className={inputCls}
                  placeholder="employee@company.com"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">{t('emp_col_role')}</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className={inputCls}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">Billing mode</label>
                  <select
                    value={inviteBillingMode}
                    onChange={(e) => setInviteBillingMode(e.target.value)}
                    className={inputCls}
                  >
                    {BILLING_MODES.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">Department <span className="text-zinc-600">(optional)</span></label>
                <DepartmentCombobox
                  value={inviteDepartmentName}
                  onChange={setInviteDepartmentName}
                  departments={departments}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Policy <span className="text-zinc-600">(optional)</span></label>
                <p className="mb-1.5 text-xs text-zinc-600">Only needed if you want to set spending limits or time restrictions for this employee.</p>
                <select
                  value={invitePolicyId}
                  onChange={(e) => setInvitePolicyId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">No policy</option>
                  {policies.map((policy) => (
                    <option key={policy.id} value={policy.id}>
                      {policy.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className={fleetButtonClass('secondary', 'md', 'flex-1')}
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className={fleetButtonClass('primary', 'md', 'flex-1')}
                >
                  {inviting ? t('emp_invite_sending') : t('emp_invite_send')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit employee modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#33d6c5]/20 bg-[#33d6c5]/10 text-[#7ce9de]">
                <Pencil size={18} strokeWidth={2.1} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white">Edit employee</h2>
                <p className="text-xs text-zinc-500">{editingMember.user_name ?? editingMember.user_email}</p>
              </div>
            </div>
            <form onSubmit={handleEditSave} className="space-y-4">
              {editError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {editError}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">{t('emp_col_role')}</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                    disabled={isOwner(editingMember)}
                    className={inputCls}
                  >
                    {ROLES.filter((r) => r !== 'FLEET_OWNER').map((role) => (
                      <option key={role} value={role}>
                        {role.replace(/_/g, ' ')}
                      </option>
                    ))}
                    {isOwner(editingMember) && (
                      <option value="FLEET_OWNER">FLEET OWNER</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">Billing mode</label>
                  <select
                    value={editForm.billingMode}
                    onChange={(e) => setEditForm((f) => ({ ...f, billingMode: e.target.value }))}
                    className={inputCls}
                  >
                    {BILLING_MODES.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">Department <span className="text-zinc-600">(optional)</span></label>
                <DepartmentCombobox
                  value={editForm.departmentName}
                  onChange={(v) => setEditForm((f) => ({ ...f, departmentName: v }))}
                  departments={departments}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Policy <span className="text-zinc-600">(optional)</span></label>
                <p className="mb-1.5 text-xs text-zinc-600">Only needed if you want to set spending limits or time restrictions for this employee.</p>
                <select
                  value={editForm.policyId}
                  onChange={(e) => setEditForm((f) => ({ ...f, policyId: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">No policy</option>
                  {policies.map((policy) => (
                    <option key={policy.id} value={policy.id}>
                      {policy.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className={fleetButtonClass('secondary', 'md', 'flex-1')}
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className={fleetButtonClass('primary', 'md', 'flex-1')}
                >
                  {editSaving ? t('btn_saving') : t('btn_save_changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right text-zinc-200">{value}</dd>
    </div>
  );
}
