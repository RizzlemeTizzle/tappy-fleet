import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const token = req.cookies.get('tappy_token')?.value;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/fleet') && !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/fleet/:path*'],
};
