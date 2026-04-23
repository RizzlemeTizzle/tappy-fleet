import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://tappy-shhd.onrender.com';

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
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return NextResponse.json({ ok: true });
}
