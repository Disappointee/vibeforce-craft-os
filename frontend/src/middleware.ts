import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  loginRateLimiter,
  apiRateLimiter,
  createRateLimitResponse,
} from '@/lib/rate-limiter';

/**
 * 🛡️ Next.js 16 Security Headers & Rate Limiting Middleware
 * Vibeforce Flow OS - Enterprise Hardening Engine
 */

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // 1. Rate Limiting for sensitive routes
  if (pathname === '/login' && request.method === 'POST') {
    const rateCheck = loginRateLimiter.check(ip);
    if (!rateCheck.success) {
      return createRateLimitResponse(rateCheck);
    }
  } else if (pathname.startsWith('/api/') && !pathname.startsWith('/api/health')) {
    const rateCheck = apiRateLimiter.check(ip);
    if (!rateCheck.success) {
      return createRateLimitResponse(rateCheck);
    }
  }

  // 2. Protect /admin routes
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
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  const response = NextResponse.next();

  // 3. Apply Hardened Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(self), payment=()'
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Content-Security-Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

