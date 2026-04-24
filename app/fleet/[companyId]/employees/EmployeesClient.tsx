'use client';

import { useEffect, useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fleetButtonClass } from '@/lib/fleet-ui';

interface Member {
  id: string;
  user_name: string;
  user_email: string;
  role: string;
  status: string;
  department_name?: string;
  policy_name?: string;
}

interface Policy {
  id: string;
  name: string;
}

const ROLES = ['EMPLOYEE', 'TEAM_MANAGER', 'FLEET_ADMIN', 'FINANCE_ADMIN', 'FLEET_OWNER'];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  INVITED: 'bg-yellow-500/20 text-yellow-400',
  SUSPENDED: 'bg-red-500/20 text-red-400',
};

export default function EmployeesClient({
  companyId,
  initialMembers,
  policies,
}: {
  companyId: string;
  initialMembers: Member[];
  policies: Policy[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('EMPLOYEE');
  const [inviteError, setInviteError] = useState('');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviting(true);
    try {
      const res = await fetch(`/api/fleet/${companyId}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setInviteError(body.error ?? 'Invite failed');
        return;
      }
      setShowInvite(false);
      setInviteEmail('');
      router.refresh();
    } catch {
      setInviteError('Network error');
    } finally {
      setInviting(false);
    }
  };

  const handleSuspend = async (memberId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const res = await fetch(`/api/fleet/${companyId}/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, status: newStatus } : m)));
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;
    const res = await fetch(`/api/fleet/${companyId}/members/${memberId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
  };

  void policies;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Employees</h1>
        <button
          onClick={() => setShowInvite(true)}
          className={fleetButtonClass('primary', 'md', 'w-full sm:w-auto')}
        >
          <Plus size={16} strokeWidth={2.3} />
          Invite member
        </button>
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 md:block">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Email</th>
              <th className="px-5 py-3 text-left">Role</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-5 py-3 font-medium text-white">{m.user_name ?? '-'}</td>
                <td className="px-5 py-3 text-zinc-400">{m.user_email}</td>
                <td className="px-5 py-3 text-zinc-300">{m.role.replace(/_/g, ' ')}</td>
                <td className="px-5 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[m.status] ?? 'bg-zinc-700 text-zinc-400'}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSuspend(m.id, m.status)}
                      className={fleetButtonClass('secondary', 'sm')}
                    >
                      {m.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                    </button>
                    {m.role !== 'FLEET_OWNER' && (
                      <button
                        onClick={() => handleRemove(m.id)}
                        className={fleetButtonClass('danger', 'sm')}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-zinc-500">
                  No members yet. Invite your first employee.
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
            No members yet. Invite your first employee.
          </div>
        )}
        {members.map((m) => (
          <article key={m.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-white">{m.user_name ?? '-'}</h2>
                <p className="mt-1 break-all text-sm text-zinc-400">{m.user_email}</p>
              </div>
              <span className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${STATUS_STYLES[m.status] ?? 'bg-zinc-700 text-zinc-400'}`}>
                {m.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-300">
              <span className="rounded bg-zinc-800 px-2 py-1">{m.role.replace(/_/g, ' ')}</span>
              {m.department_name && <span className="rounded bg-zinc-800 px-2 py-1">{m.department_name}</span>}
              {m.policy_name && <span className="rounded bg-zinc-800 px-2 py-1">{m.policy_name}</span>}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => handleSuspend(m.id, m.status)}
                className={fleetButtonClass('secondary', 'md', 'w-full')}
              >
                {m.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
              </button>
              {m.role !== 'FLEET_OWNER' && (
                <button
                  onClick={() => handleRemove(m.id)}
                  className={fleetButtonClass('danger', 'md', 'w-full')}
                >
                  Remove
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#33d6c5]/20 bg-[#33d6c5]/10 text-[#7ce9de]">
                <UserPlus size={18} strokeWidth={2.1} />
              </span>
              <h2 className="text-lg font-bold text-white">Invite member</h2>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              {inviteError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {inviteError}
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">Email address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
                  placeholder="employee@company.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#33d6c5] focus:outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, ' ')}
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className={fleetButtonClass('primary', 'md', 'flex-1')}
                >
                  {inviting ? 'Sending...' : 'Send invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
