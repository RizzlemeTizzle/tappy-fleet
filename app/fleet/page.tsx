import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/apiFetch';
import { redirect } from 'next/navigation';
import OrganizationHub, { OrganizationSummary } from './OrganizationHub';

interface Membership {
  id: string;
  company_id: string;
  company_name: string;
  role: string;
  status: string;
}

interface OrganizationUser {
  id: string;
  company_id: string;
  user_name: string | null;
  user_email: string;
  invited_email: string | null;
  role: string;
  status: string;
  employee_access: boolean;
}

const ADMIN_ROLES = ['FLEET_OWNER', 'FLEET_ADMIN', 'FINANCE_ADMIN'];
const EDIT_ROLES = ['FLEET_OWNER', 'FLEET_ADMIN'];

function readText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return '';
}

function normalizeOrganization(membership: Membership, payload: unknown): OrganizationSummary {
  const data =
    payload && typeof payload === 'object' && 'company' in payload
      ? ((payload as { company?: Record<string, unknown> }).company ?? {})
      : ((payload as Record<string, unknown> | null) ?? {});

  const address =
    data && typeof data.address === 'object'
      ? (data.address as Record<string, unknown>)
      : {};

  return {
    id: membership.id,
    companyId: membership.company_id,
    companyName: readText(data.name, data.company_name, membership.company_name),
    role: membership.role,
    status: membership.status,
    legalName: readText(data.legalName, data.legal_name),
    billingEmail: readText(data.billingEmail, data.billing_email),
    vatNumber: readText(data.vatNumber, data.vat_number),
    addressLine1: readText(data.addressLine1, data.address_line1, address.line1),
    addressPostcode: readText(data.addressPostcode, data.address_postcode, address.postcode, address.postalCode, address.postal_code),
    addressCity: readText(data.addressCity, data.address_city, address.city),
    addressCountry: readText(data.addressCountry, data.address_country, address.country),
    paymentMode:
      readText(data.paymentMode, data.payment_mode) === 'EMPLOYEE_PAID_REIMBURSABLE'
        ? 'EMPLOYEE_PAID_REIMBURSABLE'
        : 'COMPANY_PAID',
    canEdit: EDIT_ROLES.includes(membership.role),
    canDelete: false,
  };
}

export default async function FleetRootPage() {
  await requireAuth();

  const res = await apiFetch('/fleet/companies/mine');
  if (!res.ok) {
    redirect('/auth/login');
  }

  const allMemberships: Membership[] = await res.json();
  const memberships = allMemberships.filter((membership) => ADMIN_ROLES.includes(membership.role));

  const organizations = await Promise.all(
    memberships.map(async (membership) => {
      const detailRes = await apiFetch(`/fleet/companies/${membership.company_id}`);
      const details = detailRes.ok ? await detailRes.json().catch(() => null) : null;
      return normalizeOrganization(membership, details);
    }),
  );

  const organizationUsers = Object.fromEntries(
    await Promise.all(
      organizations.map(async (org) => {
        const usersRes = await apiFetch(`/fleet/companies/${org.companyId}/organization-users`);
        const usersBody = usersRes.ok ? await usersRes.json().catch(() => ({})) : {};
        const users: OrganizationUser[] = Array.isArray(usersBody)
          ? usersBody
          : (usersBody.users ?? []);
        return [org.companyId, users];
      }),
    ),
  );

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <OrganizationHub
          organizations={organizations}
          totalMemberships={allMemberships.length}
          organizationUsers={organizationUsers}
        />
      </div>
    </div>
  );
}
