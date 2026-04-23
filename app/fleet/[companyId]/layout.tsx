import { ShieldAlert } from 'lucide-react';
import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/apiFetch';
import { redirect } from 'next/navigation';
import { BrandIcon } from '@/components/BrandIcon';
import FleetSidebar from '@/components/fleet/FleetSidebar';

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
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="mb-4 flex justify-center">
            <BrandIcon icon={ShieldAlert} tone="violet" className="h-16 w-16" size={28} />
          </div>
          <h1 className="mb-2 text-xl font-bold text-white">Dashboard not available</h1>
          <p className="text-sm text-zinc-400">
            The fleet dashboard is for fleet managers. Use the Tappy Charge mobile app to manage your charging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <FleetSidebar
        companyId={companyId}
        companyName={membership.company_name}
        role={membership.role}
        memberships={adminMemberships}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
