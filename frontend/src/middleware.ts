import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    const authCookie = request.cookies.get('pb_auth');
    if (!authCookie?.value) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      let authData: { token?: string; model?: { role?: string }; record?: { role?: string } } | null = null;
      try {
        const decoded = decodeURIComponent(authCookie.value);
        authData = JSON.parse(decoded);
      } catch {
        authData = JSON.parse(authCookie.value);
      }

      const role = authData?.model?.role || authData?.record?.role;
      if (role !== 'admin') {
        // Redirect non-admin users to /tasks
        return NextResponse.redirect(new URL('/tasks', request.url));
      }
    } catch {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
