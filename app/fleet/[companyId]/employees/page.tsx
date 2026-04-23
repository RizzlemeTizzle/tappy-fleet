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
  const members = Array.isArray(membersBody) ? membersBody : (membersBody.members ?? []);
  const policiesBody = policiesRes.ok ? await policiesRes.json() : {};
  const policies = Array.isArray(policiesBody) ? policiesBody : (policiesBody.policies ?? []);

  return <EmployeesClient companyId={companyId} initialMembers={members} policies={policies} />;
}
