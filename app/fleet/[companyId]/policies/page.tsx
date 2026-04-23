import { apiFetch } from '@/lib/apiFetch';
import PoliciesClient from './PoliciesClient';

export default async function PoliciesPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const res = await apiFetch(`/fleet/companies/${companyId}/policies`);
  const policies = res.ok ? await res.json() : [];
  return <PoliciesClient companyId={companyId} initialPolicies={policies} />;
}
