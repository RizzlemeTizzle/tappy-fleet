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

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <OrganizationHub
          organizations={organizations}
          totalMemberships={allMemberships.length}
        />
      </div>
    </div>
  );
}
