import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/apiFetch';
import { redirect } from 'next/navigation';
import FleetSidebar from '@/components/fleet/FleetSidebar';

interface Membership {
  company_id: string;
  company_name: string;
  role: string;
  status: string;
}

const ADMIN_ROLES = ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'];

export default async function FleetCompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  await requireAuth();
  const { companyId } = await params;

  const res = await apiFetch('/fleet/companies/mine');
  if (!res.ok) redirect('/auth/login');
  const memberships: Membership[] = await res.json();
  const membership = memberships.find((m) => m.company_id === companyId);
  if (!membership) redirect('/fleet');

  if (!ADMIN_ROLES.includes(membership.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚡</div>
          <h1 className="text-xl font-bold text-white mb-2">Dashboard not available</h1>
          <p className="text-zinc-400 text-sm">
            The fleet dashboard is for fleet managers. Use the Tappy Charge mobile app to manage your charging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <FleetSidebar companyId={companyId} companyName={membership.company_name} role={membership.role} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
