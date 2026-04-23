import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/apiFetch';
import Link from 'next/link';
import CreateOrgButton from './CreateOrgButton';

interface Membership {
  id: string;
  company_id: string;
  company_name: string;
  role: string;
  status: string;
}

const ROLE_COLORS: Record<string, string> = {
  FLEET_OWNER: 'bg-green-500/20 text-green-400',
  FLEET_ADMIN: 'bg-blue-500/20 text-blue-400',
  FINANCE_ADMIN: 'bg-orange-500/20 text-orange-400',
  TEAM_MANAGER: 'bg-purple-500/20 text-purple-400',
  EMPLOYEE: 'bg-zinc-500/20 text-zinc-400',
};

const ADMIN_ROLES = ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'];

export default async function FleetRootPage() {
  await requireAuth();
  const res = await apiFetch('/fleet/companies/mine');
  if (!res.ok) redirect('/auth/login');
  const allMemberships: Membership[] = await res.json();

  // Only show memberships where the user has dashboard access
  const memberships = allMemberships.filter((m) => ADMIN_ROLES.includes(m.role));

  if (memberships.length === 1) {
    redirect(`/fleet/${memberships[0].company_id}`);
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Your Organizations</h1>
          <p className="text-zinc-400 mt-1">Select a fleet to manage</p>
        </div>
        {memberships.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg">No fleet memberships</p>
            <p className="text-sm mt-2">
              {allMemberships.length > 0
                ? 'You are a member of a fleet but do not have dashboard access. Use the TapCharge app to manage your charging.'
                : 'Create a new organization or ask your fleet manager to invite you.'}
            </p>
            {allMemberships.length === 0 && <CreateOrgButton />}
          </div>
        ) : (
          <div className="space-y-3">
            {memberships.map((m) => (
              <Link
                key={m.id}
                href={`/fleet/${m.company_id}`}
                className="flex items-center justify-between bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 rounded-xl p-5 transition-colors group shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
              >
                <div>
                  <p className="text-white font-semibold text-lg">{m.company_name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded mt-1 inline-block ${ROLE_COLORS[m.role] ?? 'bg-zinc-700 text-zinc-300'}`}>
                    {m.role.replace(/_/g, ' ')}
                  </span>
                </div>
                <svg className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
