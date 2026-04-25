import { apiFetch } from '@/lib/apiFetch';
import BillingClient from './BillingClient';

const PAGE_SIZE = 20;

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { companyId } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1'));

  const res = await apiFetch(
    `/fleet/companies/${companyId}/billing/invoices?page=${page}&pageSize=${PAGE_SIZE}`,
  );
  const data = res.ok ? await res.json() : { invoices: [], total: 0 };

  return (
    <BillingClient
      companyId={companyId}
      initialInvoices={data.invoices ?? []}
      currentPage={page}
      totalPages={data.totalPages ?? Math.ceil((data.total ?? 0) / PAGE_SIZE)}
      total={data.total ?? 0}
      pageSize={PAGE_SIZE}
    />
  );
}
