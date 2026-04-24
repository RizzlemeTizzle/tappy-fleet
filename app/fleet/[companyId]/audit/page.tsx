import { apiFetch } from '@/lib/apiFetch';
import { AuditClient } from './AuditClient';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  performedByUserId: string;
  createdAt: string;
  changes: Record<string, unknown> | null;
}

export default async function AuditPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const res = await apiFetch(`/fleet/companies/${companyId}/audit-log`);
  const data = res.ok ? await res.json() : {};
  const logs: AuditEntry[] = data.logs ?? [];

  return <AuditClient logs={logs} />;
}
