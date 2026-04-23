'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

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
      const res = await fetch(`${API_URL}/api/fleet/companies/${companyId}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
    await fetch(`${API_URL}/api/fleet/companies/${companyId}/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;
    await fetch(`${API_URL}/api/fleet/companies/${companyId}/members/${memberId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    router.refresh();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Employees</h1>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-[#4CAF50] hover:bg-[#43A047] text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Invite member
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-left px-5 py-3">Role</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-5 py-3 text-white font-medium">{m.user_name ?? '—'}</td>
                <td className="px-5 py-3 text-zinc-400">{m.user_email}</td>
                <td className="px-5 py-3 text-zinc-300">{m.role.replace(/_/g, ' ')}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_STYLES[m.status] ?? 'bg-zinc-700 text-zinc-400'}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSuspend(m.id, m.status)}
                      className="text-xs text-zinc-400 hover:text-yellow-400 transition-colors"
                    >
                      {m.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                    </button>
                    {m.role !== 'FLEET_OWNER' && (
                      <button
                        onClick={() => handleRemove(m.id)}
                        className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
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

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-4">Invite member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              {inviteError && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {inviteError}
                </div>
              )}
              <div>
                <label className="text-sm text-zinc-400 block mb-1.5">Email address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4CAF50]"
                  placeholder="employee@company.com"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 block mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4CAF50]"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 bg-zinc-800 text-zinc-300 py-2 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 bg-[#4CAF50] text-black font-semibold py-2 rounded-lg text-sm disabled:opacity-60 transition-colors"
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
