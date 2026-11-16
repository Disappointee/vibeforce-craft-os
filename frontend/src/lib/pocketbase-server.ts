import 'server-only';

import PocketBase from 'pocketbase';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { withRetry } from './db-retry';

/**
 * 🛡️ Next.js 16 SSR Request-Scope Isolation & Superuser Token Cache
 * Vibeforce Flow OS - Enterprise Hardening Engine
 * 
 * Prevents Cross-User Cache Poisoning by instantiating fresh PocketBase
 * instances per request while safely reusing immutable admin JWT tokens.
 */

const cleanUrl = (raw: string | undefined): string =>
  raw ? raw.trim().replace(/[\r\n\t]+/g, '') : '';

const rawServerUrl =
  cleanUrl(process.env.POCKETBASE_URL) ||
  cleanUrl(process.env.NEXT_PUBLIC_POCKETBASE_URL);

export const POCKETBASE_URL =
  (!rawServerUrl || rawServerUrl.includes('railway.app'))
    ? 'https://pb-vibeforce.46-225-178-235.sslip.io'
    : rawServerUrl;

interface CachedAdminAuth {
  token: string;
  expiresAt: number; // Unix timestamp in ms
}

let cachedAdminToken: CachedAdminAuth | null = null;
let authPromise: Promise<string> | null = null;

export function invalidateAdminTokenCache(): void {
  cachedAdminToken = null;
  authPromise = null;
}

/**
 * Returns a valid superuser token string, reusing cached token if unexpired (valid for 50 min).
 */
async function getAdminToken(): Promise<string> {
  const now = Date.now();
  if (cachedAdminToken && cachedAdminToken.expiresAt > now) {
    return cachedAdminToken.token;
  }

  if (authPromise) {
    return authPromise;
  }

  const cleanEnv = (raw: string | undefined): string =>
    raw ? raw.trim().replace(/[\r\n\t]+/g, '') : '';

  const email =
    cleanEnv(process.env.POCKETBASE_ADMIN_EMAIL) ||
    cleanEnv(process.env.PB_ADMIN_EMAIL);

  const password =
    cleanEnv(process.env.POCKETBASE_ADMIN_PASSWORD) ||
    cleanEnv(process.env.PB_ADMIN_PASSWORD);

  if (!email || !email.includes('@') || !password) {
    throw new Error(
      '[getAdminPB] Missing superuser credentials. Set POCKETBASE_ADMIN_EMAIL + POCKETBASE_ADMIN_PASSWORD (or PB_ADMIN_EMAIL + PB_ADMIN_PASSWORD).',
    );
  }

  authPromise = (async () => {
    const pb = new PocketBase(POCKETBASE_URL);
    pb.autoCancellation(false);

    try {
      const authData = await pb.collection('_superusers').authWithPassword(email, password);
      const token = authData.token;

      // Cache token for 50 minutes (PocketBase tokens default to 7-14 days)
      cachedAdminToken = {
        token,
        expiresAt: Date.now() + 50 * 60 * 1000,
      };

      return token;
    } catch (err) {
      console.warn('[getAdminPB] Superuser authentication failed, attempting fallback to admin user credentials...');
      
      const fallbackEmail =
        cleanEnv(process.env.DEMO_GUEST_A_EMAIL) ||
        cleanEnv(process.env.ADMIN_FALLBACK_EMAIL) ||
        'guest_slot_a@vibeforce.de';
      const fallbackPassword =
        cleanEnv(process.env.DEMO_GUEST_A_PASSWORD) ||
        cleanEnv(process.env.ADMIN_FALLBACK_PASSWORD);

      if (fallbackPassword) {
        try {
          const userAuth = await pb.collection('users').authWithPassword(fallbackEmail, fallbackPassword);
          const token = userAuth.token;
          cachedAdminToken = {
            token,
            expiresAt: Date.now() + 50 * 60 * 1000,
          };
          console.info(`[getAdminPB] Successfully authenticated fallback admin user (${fallbackEmail})`);
          return token;
        } catch (fallbackErr) {
          console.error('[getAdminPB] Both superuser and fallback admin authentication failed:', fallbackErr);
        }
      }

      invalidateAdminTokenCache();
      throw err;
    }
  })().finally(() => {
    authPromise = null;
  });

  return authPromise;
}

/**
 * Creates a fresh, request-scoped PocketBase instance authenticated as Superuser.
 */
export async function getAdminPB(): Promise<PocketBase> {
  const token = await getAdminToken();
  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);
  pb.authStore.save(token, null);
  return pb;
}

/**
 * Executes an operation with Superuser PB and automatically invalidates token cache on 401/403.
 */
export async function withAdminPB<T>(operation: (pb: PocketBase) => Promise<T>): Promise<T> {
  return withRetry(async () => {
    try {
      const pb = await getAdminPB();
      return await operation(pb);
    } catch (err: unknown) {
      const status =
        (err as { status?: number; response?: { status?: number } }).status ||
        (err as { status?: number; response?: { status?: number } }).response?.status;

      if (status === 401 || status === 403) {
        console.warn('[withAdminPB] Received 401/403 with admin token. Invalidating cache and retrying...');
        invalidateAdminTokenCache();
        const freshPb = await getAdminPB();
        return await operation(freshPb);
      }
      throw err;
    }
  });
}

import { getAuthCookieName } from '@/config/app-mode';

/**
 * Verifies current user session from request cookies and returns user record.
 */
export async function verifyUserSession(): Promise<Record<string, unknown> | null> {
  const cookieStore = await cookies();
  const headerStore = await headers().catch(() => null);
  const host = headerStore?.get('x-vibeforce-host') || headerStore?.get('host') || null;
  const cookieKey = getAuthCookieName(host);
  const authCookie =
    cookieStore.get(cookieKey) ||
    cookieStore.get('pb_auth_craft') ||
    cookieStore.get('pb_auth_flow') ||
    cookieStore.get('pb_auth');
  if (!authCookie?.value) return null;

  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);

  let userRecord: Record<string, unknown> | null = null;

  try {
    const decodedValue = decodeURIComponent(authCookie.value);
    const authData = JSON.parse(decodedValue);
    const userModel = authData.record || authData.model || null;
    if (authData.token) {
      pb.authStore.save(authData.token, userModel);
      userRecord = userModel;
    }
  } catch {
    pb.authStore.loadFromCookie(`${cookieKey}=${authCookie.value}`, cookieKey);
  }

  try {
    await pb.collection('users').authRefresh();
    if (pb.authStore.record) {
      return pb.authStore.record as unknown as Record<string, unknown>;
    }
  } catch (refreshErr) {
    console.warn('[verifyUserSession] authRefresh warning:', refreshErr);
  }

  // If token & record from cookie are valid, maintain the session
  if (pb.authStore.isValid && (pb.authStore.record || pb.authStore.model)) {
    return (pb.authStore.record || pb.authStore.model) as unknown as Record<string, unknown>;
  }

  if (userRecord && (userRecord.role || userRecord.email)) {
    return userRecord;
  }

  return null;
}

/**
 * SSR Guard that enforces authentication before page rendering.
 */
export async function requireAuth(redirectUrl = '/login'): Promise<Record<string, unknown>> {
  const user = await verifyUserSession();
  if (!user) {
    redirect(redirectUrl);
  }
  return user;
}

/**
 * Returns a user-authenticated PocketBase instance loaded from cookies.
 */
export async function getUserAuthPB(): Promise<PocketBase | null> {
  const cookieStore = await cookies();
  const headerStore = await headers().catch(() => null);
  const host = headerStore?.get('x-vibeforce-host') || headerStore?.get('host') || null;
  const cookieKey = getAuthCookieName(host);
  const authCookie =
    cookieStore.get(cookieKey) ||
    cookieStore.get('pb_auth_craft') ||
    cookieStore.get('pb_auth_flow') ||
    cookieStore.get('pb_auth');
  if (!authCookie?.value) return null;

  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);

  try {
    const decodedValue = decodeURIComponent(authCookie.value);
    const authData = JSON.parse(decodedValue);
    const userModel = authData.record || authData.model || null;
    if (authData.token) {
      pb.authStore.save(authData.token, userModel);
    }
  } catch {
    pb.authStore.loadFromCookie(`${cookieKey}=${authCookie.value}`, cookieKey);
  }

  if (pb.authStore.isValid) {
    return pb;
  }
  return null;
}

/**
 * Returns a user-authenticated PB instance if available, otherwise falls back to admin PB.
 * Ensures user context / Slot isolation in Server Actions while maintaining fallback resilience.
 */
export async function getAuthenticatedOrAdminPB(): Promise<PocketBase> {
  try {
    const userPB = await getUserAuthPB();
    if (userPB && userPB.authStore.isValid) {
      return userPB;
    }
  } catch {
    // Proceed to admin PB fallback
  }
  return getAdminPB();
}


