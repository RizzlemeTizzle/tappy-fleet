import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://tappy-shhd.onrender.com';

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; memberId: string }> },
  method: string,
) {
  const { companyId, memberId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('tappy_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const init: RequestInit = { method, headers: { Authorization: `Bearer ${token}` } };
  if (method !== 'DELETE') {
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
    init.body = JSON.stringify(await req.json().catch(() => ({})));
  }

  const backendRes = await fetch(
    `${API_URL}/api/fleet/companies/${companyId}/members/${memberId}`,
    init,
  );
  const data = await backendRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendRes.status });
}

export const PUT = (req: NextRequest, ctx: { params: Promise<{ companyId: string; memberId: string }> }) =>
  handler(req, ctx, 'PUT');

export const DELETE = (req: NextRequest, ctx: { params: Promise<{ companyId: string; memberId: string }> }) =>
  handler(req, ctx, 'DELETE');
