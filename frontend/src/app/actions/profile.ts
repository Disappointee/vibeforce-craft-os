'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import { pb } from '@/lib/pocketbase';
import type { UserRecord, UserPreferences } from '@/lib/pocketbase-types';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  url?: string;
  preferences?: UserPreferences;
}

export async function updateProfile(data: {
  name?: string;
  weekly_hours_target?: number;
  expertise?: string[];
  language?: 'de' | 'en';
  hourly_rate?: number;
}): Promise<ActionResult<UserRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const userId = user.id as string;
    const pbAdmin = await getAdminPB();

    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.weekly_hours_target !== undefined) payload.weekly_hours_target = data.weekly_hours_target;
    if (data.expertise !== undefined) payload.expertise = data.expertise;
    if (data.language !== undefined) payload.language = data.language;
    if (data.hourly_rate !== undefined) payload.hourly_rate = data.hourly_rate;

    const updated = await pbAdmin.collection('users').update<UserRecord>(userId, payload);

    revalidatePath('/profile');
    revalidatePath('/team');
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Profils';
    return { success: false, error: message };
  }
}

export async function changePassword(data: {
  oldPassword: string;
  password: string;
  passwordConfirm: string;
}): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    if (!data.oldPassword) {
      return { success: false, error: 'Bitte gib dein aktuelles Passwort ein.' };
    }

    if (!data.password || data.password.length < 8) {
      return { success: false, error: 'Das neue Passwort muss mindestens 8 Zeichen lang sein.' };
    }

    if (data.password !== data.passwordConfirm) {
      return { success: false, error: 'Die neuen Passwörter stimmen nicht überein.' };
    }

    const userId = user.id as string;
    const pbAdmin = await getAdminPB();

    await pbAdmin.collection('users').update(userId, {
      oldPassword: data.oldPassword,
      password: data.password,
      passwordConfirm: data.passwordConfirm,
    });

    return { success: true };
  } catch (err: any) {
    if (err?.status === 400) {
      return { success: false, error: 'Das aktuelle Passwort ist nicht korrekt.' };
    }
    const message = err instanceof Error ? err.message : 'Fehler beim Ändern des Passworts';
    return { success: false, error: message };
  }
}

export async function updateUserPreferences(
  preferences: Partial<UserPreferences>
): Promise<ActionResult<UserPreferences>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const userId = user.id as string;
    const pbAdmin = await getAdminPB();

    const existing = await pbAdmin.collection('users').getOne<UserRecord>(userId);
    const merged: UserPreferences = { ...(existing.preferences || {}), ...preferences };

    await pbAdmin.collection('users').update(userId, { preferences: merged });

    revalidatePath('/profile');
    return { success: true, preferences: merged, data: merged };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Speichern der Präferenzen';
    return { success: false, error: message };
  }
}

export async function updateNotificationSettings(
  settings: {
    notify_on_assignment?: boolean;
    notify_on_mention?: boolean;
    notify_on_due?: boolean;
    weekly_report?: boolean;
  }
): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const userId = user.id as string;
    const pbAdmin = await getAdminPB();

    await pbAdmin.collection('users').update(userId, settings);

    revalidatePath('/profile');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Benachrichtigungseinstellungen';
    return { success: false, error: message };
  }
}

export async function updateAvatar(formData: FormData): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const userId = user.id as string;
    const pbAdmin = await getAdminPB();

    const updated = await pbAdmin.collection('users').update<UserRecord>(userId, formData);
    const url = pb.files.getURL(updated, updated.avatar || '', { thumb: '256x256' });

    revalidatePath('/profile');
    return { success: true, url };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Hochladen des Profilbilds';
    return { success: false, error: message };
  }
}

export async function removeAvatar(): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const userId = user.id as string;
    const pbAdmin = await getAdminPB();

    await pbAdmin.collection('users').update(userId, { avatar: null });

    revalidatePath('/profile');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Entfernen des Profilbilds';
    return { success: false, error: message };
  }
}
