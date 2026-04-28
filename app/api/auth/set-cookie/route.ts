import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL } from '@/lib/api';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  // Server-to-server — no CORS restriction
  const backendRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await backendRes.json().catch(() => ({}));
  if (!backendRes.ok) {
    return NextResponse.json(
      { error: body.error ?? 'Invalid email or password' },
      { status: backendRes.status }
    );
  }

  const { token } = body;
  if (!token) return NextResponse.json({ error: 'No token received' }, { status: 502 });

  const cookieStore = await cookies();
  cookieStore.set('tappy_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
    path: '/',
  });
  return NextResponse.json({ ok: true });
}
