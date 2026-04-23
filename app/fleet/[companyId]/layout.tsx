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

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <FleetSidebar companyId={companyId} companyName={membership.company_name} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
