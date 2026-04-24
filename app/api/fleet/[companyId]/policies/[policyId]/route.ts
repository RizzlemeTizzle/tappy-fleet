import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://tappy-shhd.onrender.com';

async function proxyPolicy(
  req: NextRequest,
  companyId: string,
  policyId: string,
  method: 'PUT' | 'DELETE',
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('tappy_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  if (method === 'PUT') {
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
    init.body = JSON.stringify(await req.json().catch(() => ({})));
  }

  const backendRes = await fetch(
    `${API_URL}/api/fleet/companies/${companyId}/policies/${policyId}`,
    init,
  );
  const data = await backendRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendRes.status });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; policyId: string }> },
) {
  const { companyId, policyId } = await params;
  return proxyPolicy(req, companyId, policyId, 'PUT');
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; policyId: string }> },
) {
  const { companyId, policyId } = await params;
  return proxyPolicy(req, companyId, policyId, 'DELETE');
}
