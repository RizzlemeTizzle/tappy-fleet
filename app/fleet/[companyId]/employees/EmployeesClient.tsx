'use client';

import { useEffect, useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  { value: 'PERSONAL', label: 'Personal' },
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  INVITED: 'bg-yellow-500/20 text-yellow-400',
  SUSPENDED: 'bg-red-500/20 text-red-400',
};

export default function EmployeesClient({
  companyId,
  initialMembers,
  policies,
  departments,
}: {
  companyId: string;
  initialMembers: Member[];
  policies: Policy[];
  departments: Department[];
}) {
  const t = useT();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('EMPLOYEE');
  const [inviteBillingMode, setInviteBillingMode] = useState('COMPANY_PAID');
  const [inviteDepartmentId, setInviteDepartmentId] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviting, setInviting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  const isOwner = (member: Member) => member.role === 'FLEET_OWNER';

  const updateMember = async (
    memberId: string,
    payload: Record<string, string | null | boolean>,
    optimistic: (member: Member) => Member,
  ) => {
    setActionError('');
    setBusyMemberId(memberId);
    try {
      const res = await fetch(`/api/fleet/${companyId}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(body.error ?? t('emp_action_failed'));
        return false;
      }
      setMembers((prev) => prev.map((member) => (member.id === memberId ? optimistic(member) : member)));
      return true;
    } catch {
      setActionError(t('network_error'));
      return false;
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviting(true);
    try {
      const res = await fetch(`/api/fleet/${companyId}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          billingMode: inviteBillingMode,
          departmentId: inviteDepartmentId || undefined,
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
      setInviteDepartmentId('');
      router.refresh();
    } catch {
      setInviteError(t('network_error'));
    } finally {
      setInviting(false);
    }
  };

  const handleSuspend = async (member: Member) => {
    const newStatus = member.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    await updateMember(member.id, { status: newStatus }, (current) => ({ ...current, status: newStatus }));
  };

  const handleRoleChange = async (member: Member, role: string) => {
    await updateMember(member.id, { role }, (current) => ({ ...current, role }));
  };

  const handleDepartmentChange = async (member: Member, departmentId: string) => {
    const department = departments.find((item) => item.id === departmentId) ?? null;
    await updateMember(
      member.id,
      { departmentId: departmentId || null },
      (current) => ({
        ...current,
        department_id: departmentId || null,
        department_name: department?.name ?? null,
      }),
    );
  };

  const handleBillingModeChange = async (member: Member, billingMode: string) => {
    await updateMember(
      member.id,
      { billingMode },
      (current) => ({
        ...current,
        billing_mode: billingMode,
      }),
    );
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
      if (!res.ok) {
        setActionError(body.error ?? t('emp_resend_failed'));
      }
    } catch {
      setActionError(t('network_error'));
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm(t('emp_confirm_remove'))) return;
    const res = await fetch(`/api/fleet/${companyId}/members/${memberId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((member) => member.id !== memberId));
    }
  };

  const billingLabel = (mode: string) =>
    BILLING_MODES.find((item) => item.value === mode)?.label ?? mode.replace(/_/g, ' ');

  void policies;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">{t('nav_employees')}</h1>
        <button
          onClick={() => setShowInvite(true)}
          className={fleetButtonClass('primary', 'md', 'w-full sm:w-auto')}
        >
          <Plus size={16} strokeWidth={2.3} />
          {t('emp_invite_btn')}
        </button>
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {actionError}
        </div>
      )}

      <div className="hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
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
                    <div className="text-sm text-zinc-400">{member.user_email}</div>
                  </td>
                  <td className="px-5 py-3 text-zinc-300">
                    {isOwner(member) ? (
                      member.role.replace(/_/g, ' ')
                    ) : (
                      <select
                        value={member.role}
                        onChange={(e) => void handleRoleChange(member, e.target.value)}
                        disabled={busyMemberId === member.id}
                        className="min-w-[170px] rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {ROLES.filter((role) => role !== 'FLEET_OWNER').map((role) => (
                          <option key={role} value={role}>
                            {role.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={member.billing_mode}
                      onChange={(e) => void handleBillingModeChange(member, e.target.value)}
                      disabled={busyMemberId === member.id || isOwner(member)}
                      className="min-w-[170px] rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {BILLING_MODES.map((mode) => (
                        <option key={mode.value} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={member.department_id ?? ''}
                      onChange={(e) => void handleDepartmentChange(member, e.target.value)}
                      disabled={busyMemberId === member.id}
                      className="min-w-[180px] rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">No department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-zinc-300">{member.policy_name ?? 'No policy'}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[member.status] ?? 'bg-zinc-700 text-zinc-400'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
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
                      {!isOwner(member) && (
                        <button
                          onClick={() => handleRemove(member.id)}
                          disabled={busyMemberId === member.id}
                          className={fleetButtonClass('danger', 'sm')}
                        >
                          {t('emp_remove')}
                        </button>
                      )}
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
      </div>

      <div className="space-y-3 md:hidden">
        {members.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-10 text-center text-zinc-500">
            {t('emp_empty')}
          </div>
        )}
        {members.map((member) => (
          <article key={member.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
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
              <MobileRow label="Department" value={member.department_name ?? 'None'} />
              <MobileRow label="Policy" value={member.policy_name ?? 'No policy'} />
            </dl>
            <div className="mt-4 grid gap-2">
              {!isOwner(member) && (
                <select
                  value={member.billing_mode}
                  onChange={(e) => void handleBillingModeChange(member, e.target.value)}
                  disabled={busyMemberId === member.id}
                  className="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {BILLING_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={member.department_id ?? ''}
                onChange={(e) => void handleDepartmentChange(member, e.target.value)}
                disabled={busyMemberId === member.id}
                className="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">No department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
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
              {!isOwner(member) && (
                <button
                  onClick={() => handleRemove(member.id)}
                  disabled={busyMemberId === member.id}
                  className={fleetButtonClass('danger', 'md', 'w-full')}
                >
                  {t('emp_remove')}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

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
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
                  placeholder="employee@company.com"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">{t('emp_col_role')}</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
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
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
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
                <label className="mb-1.5 block text-sm text-zinc-400">Department</label>
                <select
                  value={inviteDepartmentId}
                  onChange={(e) => setInviteDepartmentId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
                >
                  <option value="">No department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
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
