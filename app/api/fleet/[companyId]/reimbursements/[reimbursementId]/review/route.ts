import { apiFetch } from '@/lib/apiFetch';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; reimbursementId: string }> },
) {
  const { companyId, reimbursementId } = await params;
  const body = await req.json().catch(() => ({}));
  const res = await apiFetch(`/fleet/companies/${companyId}/reimbursements/${reimbursementId}/review`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
