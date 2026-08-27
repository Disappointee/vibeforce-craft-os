import 'server-only';

import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

const POCKETBASE_URL = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://api-46-225-178-235.sslip.io';

let adminPb: PocketBase | null = null;

export async function getAdminPB(): Promise<PocketBase> {
  // Re-use cached instance if token is still valid
  if (adminPb && adminPb.authStore.isValid) {
    try {
      await adminPb.collection('_superusers').authRefresh();
      return adminPb;
    } catch {
      // Token expired — re-auth below
      adminPb = null;
    }
  }

  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);
  const email = (process.env.POCKETBASE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL || '***REMOVED***').trim();
  const password = (process.env.POCKETBASE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD || '***REMOVED***').trim();

  if (!password) {
    console.error('[getAdminPB] POCKETBASE_ADMIN_PASSWORD is not set — admin actions will fail.');
    throw new Error('Server-Konfigurationsfehler: Admin-Passwort nicht gesetzt.');
  }

  try {
    await pb.collection('_superusers').authWithPassword(email, password);
    adminPb = pb;
  } catch (err) {
    console.error('[getAdminPB] Superuser auth failed:', err);
    throw new Error('Server-Konfigurationsfehler: Admin-Authentifizierung fehlgeschlagen.');
  }

  return pb;
}

export async function verifyUserSession(): Promise<Record<string, unknown> | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');
  if (!authCookie?.value) return null;

  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);
  
  try {
    const decodedValue = decodeURIComponent(authCookie.value);
    const authData = JSON.parse(decodedValue);
    pb.authStore.save(authData.token, authData.model);
  } catch {
    pb.authStore.loadFromCookie(`pb_auth=${authCookie.value}`, 'pb_auth');
  }

  try {
    await pb.collection('users').authRefresh();
    if (!pb.authStore.record) {
      cookieStore.delete('pb_auth');
      return null;
    }
    return pb.authStore.record as unknown as Record<string, unknown>;
  } catch (refreshErr) {
    console.warn('[verifyUserSession] authRefresh warning:', refreshErr);
    // If the token & record restored from the cookie are valid, maintain the session
    if (pb.authStore.isValid && pb.authStore.record) {
      return pb.authStore.record as unknown as Record<string, unknown>;
    }
    cookieStore.delete('pb_auth');
    return null;
  }
}

export async function getUserAuthPB(): Promise<PocketBase | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');
  if (!authCookie?.value) return null;

  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);
  
  try {
    const decodedValue = decodeURIComponent(authCookie.value);
    const authData = JSON.parse(decodedValue);
    pb.authStore.save(authData.token, authData.model);
  } catch {
    pb.authStore.loadFromCookie(`pb_auth=${authCookie.value}`, 'pb_auth');
  }

  if (pb.authStore.isValid) {
    return pb;
  }
  return null;
}
