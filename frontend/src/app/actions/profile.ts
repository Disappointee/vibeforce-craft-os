'use server';

import { revalidatePath } from 'next/cache';
import { getUserAuthPB, verifyUserSession } from '@/lib/pocketbase-server';
import { z } from 'zod';

const NotificationSettingsSchema = z.object({
  notify_on_assignment: z.boolean().optional(),
  notify_on_mention: z.boolean().optional(),
  notify_on_due: z.boolean().optional(),
  weekly_report: z.boolean().optional(),
});

async function requireAuthUserPB() {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');
  const pb = await getUserAuthPB();
  if (!pb) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');
  return { user, pb };
}

export async function updateAvatarAction(formData: FormData) {
  const { user, pb } = await requireAuthUserPB();

  const userId = user.id as string;
  const updated = await pb.collection('users').update(userId, formData);
  const url = pb.files.getURL(updated, updated.avatar, { thumb: '256x256' });

  revalidatePath('/profile');
  return { success: true, url };
}

export async function removeAvatarAction() {
  const { user, pb } = await requireAuthUserPB();

  const userId = user.id as string;
  await pb.collection('users').update(userId, { avatar: null });

  revalidatePath('/profile');
  return { success: true };
}

export async function updatePasswordAction(data: {
  oldPassword: string;
  password: string;
  passwordConfirm: string;
}) {
  const { user, pb } = await requireAuthUserPB();

  const userId = user.id as string;

  try {
    await pb.collection('users').update(userId, {
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
  const { user, pb } = await requireAuthUserPB();

  const parsed = NotificationSettingsSchema.parse(settings);
  const sanitized: Record<string, boolean> = {};
  if (parsed.notify_on_assignment !== undefined) sanitized.notify_on_assignment = parsed.notify_on_assignment;
  if (parsed.notify_on_mention !== undefined) sanitized.notify_on_mention = parsed.notify_on_mention;
  if (parsed.notify_on_due !== undefined) sanitized.notify_on_due = parsed.notify_on_due;
  if (parsed.weekly_report !== undefined) sanitized.weekly_report = parsed.weekly_report;

  if (Object.keys(sanitized).length === 0) {
    throw new Error('Keine gültigen Benachrichtigungseinstellungen angegeben.');
  }

  const userId = user.id as string;
  await pb.collection('users').update(userId, sanitized);

  revalidatePath('/profile');
  return { success: true };
}

export async function updateUserPreferencesAction(preferences: Record<string, any>) {
  const { user, pb } = await requireAuthUserPB();

  const userId = user.id as string;

  try {
    const existing = await pb.collection('users').getOne(userId);
    const merged = { ...((existing as any).preferences || {}), ...preferences };
    await pb.collection('users').update(userId, { preferences: merged });
    revalidatePath('/profile');
    return { success: true, preferences: merged };
  } catch (error: any) {
    console.error('Failed to update user preferences in action:', error);
    return { success: false, error: error?.message || 'Fehler beim Speichern der Präferenzen' };
  }
}

