import { apiFetch } from '@/lib/apiFetch';
import EmployeesClient from './EmployeesClient';

const PAGE_SIZE = 25;

export default async function EmployeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { companyId } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1'));

  const [membersRes, policiesRes, departmentsRes] = await Promise.all([
    apiFetch(`/fleet/companies/${companyId}/members?page=${page}&pageSize=${PAGE_SIZE}`),
    apiFetch(`/fleet/companies/${companyId}/policies?pageSize=1000`),
    apiFetch(`/fleet/companies/${companyId}/departments`),
  ]);

  const membersBody = membersRes.ok ? await membersRes.json() : {};
  const rawMembers = Array.isArray(membersBody) ? membersBody : (membersBody.members ?? []);
  const members = rawMembers.map((m: any) => ({
    id: m.id,
    user_name: m.user?.name ?? m.user_name ?? null,
    user_email: m.user?.email ?? m.user_email ?? '',
    role: m.role,
    status: m.status,
    billing_mode: m.billingMode ?? m.billing_mode ?? 'COMPANY_PAID',
    department_id: m.department?.id ?? m.department_id ?? null,
    department_name: m.department?.name ?? m.department_name ?? null,
    policy_id: m.policy?.id ?? m.policy_id ?? null,
    policy_name: m.policy?.name ?? m.policy_name ?? null,
  }));

  const total: number = membersBody.total ?? members.length;
  const totalPages: number = membersBody.totalPages ?? Math.ceil(total / PAGE_SIZE);

  const policiesBody = policiesRes.ok ? await policiesRes.json() : {};
  const policies = Array.isArray(policiesBody) ? policiesBody : (policiesBody.policies ?? []);
  const departmentsBody = departmentsRes.ok ? await departmentsRes.json() : [];
  const departments = Array.isArray(departmentsBody) ? departmentsBody : [];

  return (
    <EmployeesClient
      companyId={companyId}
      initialMembers={members}
      policies={policies}
      departments={departments}
      currentPage={page}
      totalPages={totalPages}
      total={total}
      pageSize={PAGE_SIZE}
    />
  );
}
