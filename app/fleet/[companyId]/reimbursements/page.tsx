import { apiFetch } from '@/lib/apiFetch';
import ReimbursementsClient from './ReimbursementsClient';

export default async function ReimbursementsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  const [summaryRes, reimbursementsRes] = await Promise.all([
    apiFetch(`/fleet/companies/${companyId}/reimbursements/summary`),
    apiFetch(`/fleet/companies/${companyId}/reimbursements`),
  ]);

  const summary = summaryRes.ok
    ? await summaryRes.json().catch(() => null)
    : null;
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
    />
  );
}
