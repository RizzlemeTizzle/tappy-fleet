import { apiFetch } from '@/lib/apiFetch';
import ReimbursementsClient from './ReimbursementsClient';

const PAGE_SIZE = 20;
const VALID_STATUSES = ['REQUESTED', 'APPROVED', 'REJECTED'] as const;
type Status = (typeof VALID_STATUSES)[number];

export default async function ReimbursementsPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { companyId } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1'));
  const status = VALID_STATUSES.includes(sp.status as Status) ? (sp.status as Status) : undefined;

  const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (status) qs.set('status', status);

  const [summaryRes, reimbursementsRes] = await Promise.all([
    apiFetch(`/fleet/companies/${companyId}/reimbursements/summary`),
    apiFetch(`/fleet/companies/${companyId}/reimbursements?${qs}`),
  ]);

  const summary = summaryRes.ok ? await summaryRes.json().catch(() => null) : null;
  const reimbursementBody = reimbursementsRes.ok
    ? await reimbursementsRes.json().catch(() => null)
    : null;

  return (
    <ReimbursementsClient
      companyId={companyId}
      initialSummary={summary ?? {
        total_requests: 0,
        pending_count: 0,
        approved_count: 0,
        rejected_count: 0,
        requested_amount_cents: 0,
        pending_amount_cents: 0,
        approved_amount_cents: 0,
      }}
      initialReimbursements={reimbursementBody?.reimbursements ?? []}
      activeStatus={status ?? 'ALL'}
      currentPage={page}
      totalPages={reimbursementBody?.totalPages ?? 1}
      total={reimbursementBody?.total ?? 0}
      pageSize={PAGE_SIZE}
    />
  );
}
