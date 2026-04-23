import { apiFetch } from '@/lib/apiFetch';
import EmployeesClient from './EmployeesClient';

export default async function EmployeesPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const [membersRes, policiesRes] = await Promise.all([
    apiFetch(`/fleet/companies/${companyId}/members`),
    apiFetch(`/fleet/companies/${companyId}/policies`),
  ]);
  const membersBody = membersRes.ok ? await membersRes.json() : {};
  const rawMembers = Array.isArray(membersBody) ? membersBody : (membersBody.members ?? []);
  const members = rawMembers.map((m: any) => ({
    id: m.id,
    user_name: m.user?.name ?? m.user_name ?? null,
    user_email: m.user?.email ?? m.user_email ?? '',
    role: m.role,
    status: m.status,
    department_name: m.department?.name ?? m.department_name ?? null,
    policy_name: m.policy?.name ?? m.policy_name ?? null,
  }));
  const policiesBody = policiesRes.ok ? await policiesRes.json() : {};
  const policies = Array.isArray(policiesBody) ? policiesBody : (policiesBody.policies ?? []);

  return <EmployeesClient companyId={companyId} initialMembers={members} policies={policies} />;
}
