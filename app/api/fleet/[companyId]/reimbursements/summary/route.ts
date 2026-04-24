import { apiFetch } from '@/lib/apiFetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;
  const res = await apiFetch(`/fleet/companies/${companyId}/reimbursements/summary`);
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
