import { apiFetch } from '@/lib/apiFetch';
import BillingClient from './BillingClient';

export default async function BillingPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const res = await apiFetch(`/fleet/companies/${companyId}/billing/invoices`);
  const data = res.ok ? await res.json() : { invoices: [] };
  return <BillingClient companyId={companyId} initialInvoices={data.invoices ?? []} />;
}
