import { apiFetch } from '@/lib/apiFetch';
import { AuditClient } from './AuditClient';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  performedByUserId: string | null;
  createdAt: string;
  changes: Record<string, unknown> | null;
}

interface MemberLookup {
  id: string;
  userId: string | null;
  name: string | null;
  email: string;
}

interface PolicyLookup {
  id: string;
  name: string;
}

interface InvoiceLookup {
  id: string;
  periodStart: string;
  totalCents: number;
  status: string;
}

const PAGE_SIZE = 50;

export default async function AuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { companyId } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1'));

  const [auditRes, membersRes, policiesRes, invoicesRes] = await Promise.all([
    apiFetch(`/fleet/companies/${companyId}/audit-log?page=${page}&pageSize=${PAGE_SIZE}`),
    apiFetch(`/fleet/companies/${companyId}/members?pageSize=1000`),
    apiFetch(`/fleet/companies/${companyId}/policies?pageSize=1000`),
    apiFetch(`/fleet/companies/${companyId}/billing/invoices`),
  ]);

  const auditBody = auditRes.ok ? await auditRes.json() : {};
  const memberBody = membersRes.ok ? await membersRes.json() : {};
  const policyBody = policiesRes.ok ? await policiesRes.json() : {};
  const invoiceBody = invoicesRes.ok ? await invoicesRes.json() : {};

  const logs: AuditEntry[] = auditBody.logs ?? [];
  const total: number = auditBody.total ?? logs.length;
  const totalPages: number = auditBody.totalPages ?? Math.ceil(total / PAGE_SIZE);

  const rawMembers = Array.isArray(memberBody) ? memberBody : (memberBody.members ?? []);
  const rawPolicies = Array.isArray(policyBody) ? policyBody : (policyBody.policies ?? []);
  const rawInvoices = invoiceBody.invoices ?? [];

  const members: MemberLookup[] = rawMembers.map((member: any) => ({
    id: member.id,
    userId: member.user?.id ?? member.user_id ?? null,
    name: member.user?.name ?? member.user_name ?? null,
    email: member.user?.email ?? member.user_email ?? '',
  }));

  const policies: PolicyLookup[] = rawPolicies.map((policy: any) => ({
    id: policy.id,
    name: policy.name ?? 'Unnamed policy',
  }));

  const invoices: InvoiceLookup[] = rawInvoices.map((invoice: any) => ({
    id: invoice.id,
    periodStart: invoice.periodStart ?? '',
    totalCents: invoice.totalCents ?? 0,
    status: invoice.status ?? '',
  }));

  return (
    <AuditClient
      companyId={companyId}
      logs={logs}
      members={members}
      policies={policies}
      invoices={invoices}
      currentPage={page}
      totalPages={totalPages}
      total={total}
      pageSize={PAGE_SIZE}
    />
  );
}
