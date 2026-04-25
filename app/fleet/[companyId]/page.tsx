import { apiFetch } from '@/lib/apiFetch';
import { OverviewClient, type OverviewData } from './OverviewClient';

const emptyOverview: OverviewData = {
  company_name: null,
  period_label: null,
  active_members: 0,
  invited_members: 0,
  members_missing_policy: 0,
  sessions_this_month: 0,
  sessions_previous_month: 0,
  spend_this_month_cents: 0,
  spend_previous_month_cents: 0,
  kwh_this_month: 0,
  kwh_previous_month: 0,
  sessions_all_time: 0,
  policy_violations_this_month: 0,
  policy_violations_previous_month: 0,
  pending_reimbursements: 0,
  overdue_invoices: 0,
  draft_invoices: 0,
};

export default async function FleetOverviewPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const res = await apiFetch(`/fleet/companies/${companyId}/reports/overview`);
  const overview: OverviewData = res.ok
    ? { ...emptyOverview, ...(await res.json().catch(() => ({}))) }
    : emptyOverview;

  return <OverviewClient companyId={companyId} overview={overview} />;
}

