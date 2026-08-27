'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';

export async function updateAvatarAction(formData: FormData) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const userId = user.id as string;
  const pbAdmin = await getAdminPB();
  const updated = await pbAdmin.collection('users').update(userId, formData);
  const url = pbAdmin.files.getURL(updated, updated.avatar, { thumb: '256x256' });

  revalidatePath('/profile');
  return { success: true, url };
}

export async function removeAvatarAction() {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const userId = user.id as string;
  const pbAdmin = await getAdminPB();
  await pbAdmin.collection('users').update(userId, { avatar: null });

  revalidatePath('/profile');
  return { success: true };
}

export async function updatePasswordAction(data: {
  oldPassword: string;
  password: string;
  passwordConfirm: string;
}) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const userId = user.id as string;
  const pbAdmin = await getAdminPB();

  try {
    await pbAdmin.collection('users').update(userId, {
      oldPassword: data.oldPassword,
      password: data.password,
      passwordConfirm: data.passwordConfirm,
    });
    return { success: true };
  } catch (error: any) {
    if (error?.status === 400) {
      return { success: false, error: 'Aktuelles Passwort ist falsch' };
    }
    return { success: false, error: error?.message || 'Fehler beim Ändern des Passworts' };
  }
}

export async function updateNotificationSettingsAction(settings: Record<string, boolean>) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const userId = user.id as string;
  const pbAdmin = await getAdminPB();
  await pbAdmin.collection('users').update(userId, settings);

  revalidatePath('/profile');
  return { success: true };
}

export async function updateUserPreferencesAction(preferences: Record<string, any>) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const userId = user.id as string;
  const pbAdmin = await getAdminPB();

  try {
    const existing = await pbAdmin.collection('users').getOne(userId);
    const merged = { ...((existing as any).preferences || {}), ...preferences };
    await pbAdmin.collection('users').update(userId, { preferences: merged });
    revalidatePath('/profile');
    return { success: true, preferences: merged };
  } catch (error: any) {
    console.error('Failed to update user preferences in action:', error);
    return { success: false, error: error?.message || 'Fehler beim Speichern der Präferenzen' };
  }
}

