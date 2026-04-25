import { apiFetch } from '@/lib/apiFetch';
import { OverviewClient, type OverviewData } from './OverviewClient';

interface ReimbursementSummary {
  pending_count?: number;
}

interface Invoice {
  status?: string;
}

interface Member {
  role?: string;
  status?: string;
  policy?: { id?: string | null } | null;
  policy_id?: string | null;
}

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

async function readJson(res: Response) {
  return res.ok ? await res.json().catch(() => null) : null;
}

export default async function FleetOverviewPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const [overviewRes, reimbursementSummaryRes, invoicesRes, membersRes] = await Promise.all([
    apiFetch(`/fleet/companies/${companyId}/reports/overview`),
    apiFetch(`/fleet/companies/${companyId}/reimbursements/summary`),
    apiFetch(`/fleet/companies/${companyId}/billing/invoices`),
    apiFetch(`/fleet/companies/${companyId}/members`),
  ]);

  const overviewBody = (await readJson(overviewRes)) as Partial<OverviewData> | null;
  const reimbursementSummary = (await readJson(reimbursementSummaryRes)) as ReimbursementSummary | null;
  const invoicesBody = await readJson(invoicesRes);
  const membersBody = await readJson(membersRes);

  const invoices: Invoice[] = Array.isArray(invoicesBody)
    ? invoicesBody
    : invoicesBody?.invoices ?? [];
  const rawMembers: Member[] = Array.isArray(membersBody)
    ? membersBody
    : membersBody?.members ?? [];
  const membersMissingPolicy = rawMembers.filter((member) => {
    const role = member.role ?? '';
    const isAdmin = ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'].includes(role);
    const policyId = member.policy?.id ?? member.policy_id ?? null;
    return member.status === 'ACTIVE' && !isAdmin && !policyId;
  }).length;

  const overview: OverviewData = {
    ...emptyOverview,
    ...(overviewBody ?? {}),
    pending_reimbursements: reimbursementSummary?.pending_count ?? overviewBody?.pending_reimbursements ?? 0,
    overdue_invoices: invoicesBody
      ? invoices.filter((invoice) => invoice.status === 'OVERDUE').length
      : overviewBody?.overdue_invoices ?? 0,
    draft_invoices: invoicesBody
      ? invoices.filter((invoice) => invoice.status === 'DRAFT').length
      : overviewBody?.draft_invoices ?? 0,
    members_missing_policy: membersBody
      ? membersMissingPolicy
      : overviewBody?.members_missing_policy ?? 0,
  };

  return <OverviewClient companyId={companyId} overview={overview} />;
}
