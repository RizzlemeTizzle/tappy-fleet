import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL } from '@/lib/api';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('tappy_token')?.value;
  if (!token) return NextResponse.json({ authed: false }, { status: 401 });

  const backendRes = await fetch(`${API_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!backendRes.ok) {
    return NextResponse.json({ authed: false }, { status: 401 });
  }

  const user = await backendRes.json().catch(() => ({}));
  return NextResponse.json({ authed: true, email: user.email ?? null, user });
}
