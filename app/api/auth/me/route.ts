import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('tappy_token')?.value;
  if (!token) return NextResponse.json({ authed: false }, { status: 401 });

  // Decode JWT payload to read email (no signature verification needed here)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return NextResponse.json({ authed: true, email: payload.email ?? null });
  } catch {
    return NextResponse.json({ authed: true, email: null });
  }
}
