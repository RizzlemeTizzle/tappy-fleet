import { apiFetch } from '@/lib/apiFetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;
  const qs = req.nextUrl.searchParams.toString();
  const res = await apiFetch(
    `/fleet/companies/${companyId}/reports/sessions/export${qs ? `?${qs}` : ''}`,
  );
  if (!res.ok) {
    return NextResponse.json({ error: 'Export failed' }, { status: res.status });
  }
  const csv = await res.text();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': res.headers.get('Content-Disposition') ?? 'attachment; filename="fleet-report.csv"',
    },
  });
}
