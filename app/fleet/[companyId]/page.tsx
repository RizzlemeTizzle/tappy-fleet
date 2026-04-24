import { apiFetch } from '@/lib/apiFetch';
import { OverviewClient } from './OverviewClient';

interface OverviewData {
  active_members: number;
  sessions_this_month: number;
  spend_this_month_cents: number;
  kwh_this_month: number;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export default async function FleetOverviewPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const res = await apiFetch(`/fleet/companies/${companyId}/reports/overview`);
  const overview: OverviewData = res.ok
    ? await res.json()
    : { active_members: 0, sessions_this_month: 0, spend_this_month_cents: 0, kwh_this_month: 0 };

  return (
    <OverviewClient
      companyId={companyId}
      activeMembersValue={String(overview.active_members)}
      sessionsValue={String(overview.sessions_this_month)}
      spendValue={formatCurrency(overview.spend_this_month_cents)}
      kwhValue={`${overview.kwh_this_month.toFixed(1)} kWh`}
    />
  );
}
