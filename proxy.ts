import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const token = req.cookies.get('tappy_token')?.value;
  const { pathname } = req.nextUrl;
  const unsafeMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  if (pathname.startsWith('/fleet') && !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/api/fleet') && unsafeMethod) {
    const origin = req.headers.get('origin');
    const expectedOrigin = req.nextUrl.origin;
    if (!origin || origin !== expectedOrigin) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/fleet/:path*', '/api/fleet/:path*'],
};
