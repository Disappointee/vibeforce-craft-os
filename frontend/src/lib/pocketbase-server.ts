import 'server-only';

import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

export const POCKETBASE_URL = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pb-vibeforce.46-225-178-235.sslip.io';

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
  const email = (process.env.POCKETBASE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL || 'admin@vibeforce-flow.de').trim();
  const password = (process.env.POCKETBASE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD || '***REMOVED***').trim();

  try {
    await pb.collection('_superusers').authWithPassword(email, password);
    adminPb = pb;
  } catch (err) {
    console.error('[getAdminPB] Superuser auth failed:', err);
    return pb;
  }

  return pb;
}

export async function verifyUserSession(): Promise<Record<string, unknown> | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');
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
    pb.authStore.loadFromCookie(`pb_auth=${authCookie.value}`, 'pb_auth');
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

export async function getUserAuthPB(): Promise<PocketBase | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');
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
    pb.authStore.loadFromCookie(`pb_auth=${authCookie.value}`, 'pb_auth');
  }

  if (pb.authStore.isValid) {
    return pb;
  }
  return null;
}
