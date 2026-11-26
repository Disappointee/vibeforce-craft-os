import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  loginRateLimiter,
  apiRateLimiter,
  createRateLimitResponse,
} from '@/lib/rate-limiter';
import { detectModeFromHostname, isCraftMode, getAuthCookieName } from '@/config/app-mode';
import PocketBase from 'pocketbase';
import { POCKETBASE_URL } from '@/lib/pocketbase-server';

/**
 * 🛡️ Next.js 16 Security Headers & Rate Limiting Middleware
 * Vibeforce Flow OS - Enterprise Hardening Engine
 */

async function validateAdminSession(request: NextRequest, isCraftHost: boolean): Promise<boolean> {
  const cookieKey = isCraftHost ? 'pb_auth_craft' : 'pb_auth_flow';
  const authCookie = request.cookies.get(cookieKey) || request.cookies.get('pb_auth');
  if (!authCookie?.value) return false;

  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);

  try {
    const decoded = decodeURIComponent(authCookie.value);
    const authData = JSON.parse(decoded);
    const token = authData.token;
    const model = authData.record || authData.model || null;
    
    if (!token) return false;
    
    pb.authStore.save(token, model);
    
    // Validate session with PocketBase (fail-closed)
    await pb.collection('users').authRefresh();
    
    const user = pb.authStore.record;
    if (!user) return false;
    
    const role = user.role;
    // Admin OR meister have access to /admin
    return role === 'admin' || role === 'meister';
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // Subdomain & Hostname Detection (e.g. craft.vibeforce-flow-os.vercel.app)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const isCraftHost = detectModeFromHostname(host) === 'craft' || isCraftMode();

  // Direct root traffic on craft subdomains to /craft
  if (isCraftHost && pathname === '/') {
    return NextResponse.redirect(new URL('/craft', request.url));
  }

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
    const isAdmin = await validateAdminSession(request, isCraftHost);
    if (!isAdmin) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-vibeforce-app-mode', isCraftHost ? 'craft' : 'agency');
  requestHeaders.set('x-vibeforce-host', host);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set('x-vibeforce-app-mode', isCraftHost ? 'craft' : 'agency');

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

