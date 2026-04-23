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
  const members = membersRes.ok ? await membersRes.json() : [];
  const policies = policiesRes.ok ? await policiesRes.json() : [];

  return <EmployeesClient companyId={companyId} initialMembers={members} policies={policies} />;
}
