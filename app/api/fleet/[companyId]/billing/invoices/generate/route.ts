import { apiFetch } from '@/lib/apiFetch';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;
  const body = await req.json();
  const res = await apiFetch(`/fleet/companies/${companyId}/billing/invoices/generate`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
