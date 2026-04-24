import { apiFetch } from '@/lib/apiFetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;
  const qs = req.nextUrl.searchParams.toString();
  const res = await apiFetch(`/fleet/companies/${companyId}/reimbursements${qs ? `?${qs}` : ''}`);
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
