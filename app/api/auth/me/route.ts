import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('tappy_token')?.value;
  if (!token) return NextResponse.json({ authed: false }, { status: 401 });
  return NextResponse.json({ authed: true });
}
