import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://tappy-shhd.onrender.com';

async function proxyCompany(
  req: NextRequest,
  companyId: string,
  method: 'GET' | 'PUT' | 'DELETE',
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

  const backendRes = await fetch(`${API_URL}/api/fleet/companies/${companyId}`, init);
  const data = await backendRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendRes.status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;
  return proxyCompany(req, companyId, 'GET');
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;
  return proxyCompany(req, companyId, 'PUT');
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;
  return proxyCompany(req, companyId, 'DELETE');
}
