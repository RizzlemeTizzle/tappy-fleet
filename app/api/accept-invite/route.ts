import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://tappy-shhd.onrender.com';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('tappy_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { inviteToken, companyId } = await req.json();
  if (!inviteToken || !companyId) {
    return NextResponse.json({ error: 'Missing token or company' }, { status: 400 });
  }

  const backendRes = await fetch(`${API_URL}/api/fleet/companies/${companyId}/accept-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ token: inviteToken }),
  });

  const data = await backendRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendRes.status });
}
