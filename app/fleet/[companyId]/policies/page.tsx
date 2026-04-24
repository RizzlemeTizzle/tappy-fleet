import { apiFetch } from '@/lib/apiFetch';
import PoliciesClient from './PoliciesClient';

export default async function PoliciesPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const [policiesRes, membersRes] = await Promise.all([
    apiFetch(`/fleet/companies/${companyId}/policies`),
    apiFetch(`/fleet/companies/${companyId}/members`),
  ]);
  const policies = policiesRes.ok ? await policiesRes.json() : [];
  const membersBody = membersRes.ok ? await membersRes.json() : {};
  const rawMembers = Array.isArray(membersBody) ? membersBody : (membersBody.members ?? []);
  const members = rawMembers.map((m: any) => ({
    id: m.id,
    user_name: m.user?.name ?? m.user_name ?? null,
    user_email: m.user?.email ?? m.user_email ?? '',
  }));
  return <PoliciesClient companyId={companyId} initialPolicies={policies} members={members} />;
}
