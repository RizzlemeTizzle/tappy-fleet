import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://tappy-shhd.onrender.com';

async function proxyOrganizationUsers(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
  method: 'GET' | 'POST',
) {
  const { companyId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('tappy_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const init: RequestInit = {
    method,
    headers: { Authorization: `Bearer ${token}` },
  };

  const path =
    method === 'POST'
      ? `/api/fleet/companies/${companyId}/organization-users/invite`
      : `/api/fleet/companies/${companyId}/organization-users`;

  if (method === 'POST') {
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
    init.body = JSON.stringify(await req.json().catch(() => ({})));
  }

  const backendRes = await fetch(`${API_URL}${path}`, init);
  const data = await backendRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendRes.status });
}

export const GET = (
  req: NextRequest,
  ctx: { params: Promise<{ companyId: string }> },
) => proxyOrganizationUsers(req, ctx, 'GET');

export const POST = (
  req: NextRequest,
  ctx: { params: Promise<{ companyId: string }> },
) => proxyOrganizationUsers(req, ctx, 'POST');
