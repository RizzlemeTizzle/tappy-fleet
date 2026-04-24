import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/apiFetch';
import { redirect } from 'next/navigation';
import FleetSidebar from '@/components/fleet/FleetSidebar';
import { DashboardUnavailable } from './DashboardUnavailable';

interface Membership {
  id: string;
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
  const adminMemberships = memberships.filter((m) => ADMIN_ROLES.includes(m.role));

  if (!ADMIN_ROLES.includes(membership.role)) {
    return <DashboardUnavailable />;
  }

  return (
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row md:overflow-hidden">
      <FleetSidebar
        companyId={companyId}
        companyName={membership.company_name}
        role={membership.role}
        memberships={adminMemberships}
      />
      <main className="min-h-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
