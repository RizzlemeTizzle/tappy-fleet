import { apiFetch } from '@/lib/apiFetch';
import ReportsClient from './ReportsClient';

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    page?: string;
    employeeId?: string;
    department?: string;
    billingMode?: string;
    policyId?: string;
  }>;
}) {
  const { companyId } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.from) qs.set('from', sp.from);
  if (sp.to) qs.set('to', sp.to);
  if (sp.page) qs.set('page', sp.page);
  if (sp.employeeId) qs.set('employeeId', sp.employeeId);
  if (sp.department) qs.set('department', sp.department);
  if (sp.billingMode) qs.set('billingMode', sp.billingMode);
  if (sp.policyId) qs.set('policyId', sp.policyId);

  const [sessionsRes, membersRes, policiesRes] = await Promise.all([
    apiFetch(`/fleet/companies/${companyId}/reports/sessions?${qs}`),
    apiFetch(`/fleet/companies/${companyId}/members?pageSize=1000`),
    apiFetch(`/fleet/companies/${companyId}/policies?pageSize=1000`),
  ]);

  const data = sessionsRes.ok ? await sessionsRes.json() : { sessions: [], total: 0, page: 1, pageSize: 50, totalPages: 1 };
  const membersBody = membersRes.ok ? await membersRes.json() : {};
  const rawMembers = Array.isArray(membersBody) ? membersBody : (membersBody.members ?? []);
  const members = rawMembers.map((m: any) => ({
    id: m.id,
    user_name: m.user?.name ?? m.user_name ?? null,
    user_email: m.user?.email ?? m.user_email ?? '',
    department_id: m.department?.id ?? m.department_id ?? null,
    department_name: m.department?.name ?? m.department_name ?? null,
    policy_id: m.policy?.id ?? m.policy_id ?? null,
    policy_name: m.policy?.name ?? m.policy_name ?? null,
  }));
  const policiesBody = policiesRes.ok ? await policiesRes.json() : {};
  const policies = Array.isArray(policiesBody) ? policiesBody : (policiesBody.policies ?? []);

  return (
    <ReportsClient
      companyId={companyId}
      initialSessions={data.sessions ?? []}
      total={data.total ?? 0}
      currentPage={data.page ?? 1}
      totalPages={data.totalPages ?? 1}
      pageSize={data.pageSize ?? 50}
      members={members}
      policies={policies}
      from={sp.from ?? ''}
      to={sp.to ?? ''}
      employeeId={sp.employeeId ?? ''}
      department={sp.department ?? ''}
      billingMode={sp.billingMode ?? ''}
      policyId={sp.policyId ?? ''}
    />
  );
}
