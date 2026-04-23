import { apiFetch } from '@/lib/apiFetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; invoiceId: string }> },
) {
  const { companyId, invoiceId } = await params;
  const res = await apiFetch(
    `/fleet/companies/${companyId}/billing/invoices/${invoiceId}/pdf`,
  );
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: res.status });
  }
  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': res.headers.get('Content-Disposition') ?? 'attachment; filename="invoice.pdf"',
    },
  });
}
