import { apiFetch } from '@/lib/apiFetch';
import ReportsClient from './ReportsClient';

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ from?: string; to?: string; page?: string }>;
}) {
  const { companyId } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.from) qs.set('from', sp.from);
  if (sp.to) qs.set('to', sp.to);
  if (sp.page) qs.set('page', sp.page);

  const res = await apiFetch(`/fleet/companies/${companyId}/reports/sessions?${qs}`);
  const data = res.ok ? await res.json() : { sessions: [], total: 0 };

  return (
    <ReportsClient
      companyId={companyId}
      initialSessions={data.sessions ?? []}
      total={data.total ?? 0}
      from={sp.from ?? ''}
      to={sp.to ?? ''}
    />
  );
}
