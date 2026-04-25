import { apiFetch } from '@/lib/apiFetch';
import PoliciesClient from './PoliciesClient';

const PAGE_SIZE = 20;

export default async function PoliciesPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { companyId } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1'));

  const [policiesRes, membersRes] = await Promise.all([
    apiFetch(`/fleet/companies/${companyId}/policies?page=${page}&pageSize=${PAGE_SIZE}`),
    apiFetch(`/fleet/companies/${companyId}/members?pageSize=1000`),
  ]);

  const policiesBody = policiesRes.ok ? await policiesRes.json() : {};
  const policies = Array.isArray(policiesBody) ? policiesBody : (policiesBody.policies ?? []);
  const total: number = policiesBody.total ?? policies.length;
  const totalPages: number = policiesBody.totalPages ?? Math.ceil(total / PAGE_SIZE);

  const membersBody = membersRes.ok ? await membersRes.json() : {};
  const rawMembers = Array.isArray(membersBody) ? membersBody : (membersBody.members ?? []);
  const members = rawMembers.map((m: any) => ({
    id: m.id,
    user_name: m.user?.name ?? m.user_name ?? null,
    user_email: m.user?.email ?? m.user_email ?? '',
  }));

  return (
    <PoliciesClient
      companyId={companyId}
      initialPolicies={policies}
      members={members}
      currentPage={page}
      totalPages={totalPages}
      total={total}
      pageSize={PAGE_SIZE}
    />
  );
}
