'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import type { UserRecord } from '@/lib/pocketbase-types';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  smtpFailed?: boolean;
}

export async function fetchAdminUsers(): Promise<ActionResult<UserRecord[]>> {
  try {
    const sessionUser = await verifyUserSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return { success: false, error: 'Nicht autorisiert: Nur Administratoren dürfen Benutzerdaten abrufen.' };
    }

    const pb = await getAdminPB();
    const users = await pb.collection('users').getFullList<UserRecord>({
      sort: '-created',
      expand: 'supervisor',
    });

    return { success: true, data: JSON.parse(JSON.stringify(users)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden der Benutzer';
    return { success: false, error: message };
  }
}

export async function inviteUser(data: {
  email: string;
  name?: string;
  role?: string;
  supervisor?: string;
  hourly_rate?: number;
  weekly_hours_target?: number;
  expertise?: string[];
}): Promise<ActionResult<UserRecord>> {
  try {
    const sessionUser = await verifyUserSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return { success: false, error: 'Nicht autorisiert: Nur Administratoren dürfen Benutzer einladen.' };
    }

    if (!data.email) {
      return { success: false, error: 'E-Mail-Adresse ist erforderlich.' };
    }

    const pb = await getAdminPB();
    // Create random initial password, user will set it via reset link
    const randomPassword = Math.random().toString(36).slice(-10) + 'Aa1!';
    const payload: Record<string, unknown> = {
      email: data.email.trim().toLowerCase(),
      name: data.name?.trim() || '',
      role: data.role || 'employee',
      supervisor: data.supervisor || null,
      hourly_rate: data.hourly_rate ?? null,
      weekly_hours_target: data.weekly_hours_target ?? 40,
      expertise: data.expertise || [],
      password: randomPassword,
      passwordConfirm: randomPassword,
      emailVisibility: true,
      verified: true,
      deactivated: false,
    };

    const record = await pb.collection('users').create<UserRecord>(payload);
    let smtpFailed = false;

    try {
      await pb.collection('users').requestPasswordReset(data.email.trim());
    } catch (err) {
      console.warn('Passwort-Reset-Mail konnte nicht gesendet werden:', err);
      smtpFailed = true;
    }

    revalidatePath('/admin/users');
    revalidatePath('/team');
    return {
      success: true,
      smtpFailed,
      data: JSON.parse(JSON.stringify(record)),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Anlegen des Benutzers';
    return { success: false, error: message };
  }
}

export async function updateUserRole(userId: string, role: string): Promise<ActionResult> {
  try {
    const sessionUser = await verifyUserSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return { success: false, error: 'Nicht autorisiert: Nur Administratoren dürfen Rollen ändern.' };
    }

    if (userId === sessionUser.id && role !== 'admin') {
      return { success: false, error: 'Du kannst dir selbst nicht die Admin-Rolle entziehen.' };
    }

    const pb = await getAdminPB();
    await pb.collection('users').update(userId, { role });
    revalidatePath('/admin/users');
    revalidatePath('/team');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Rolle';
    return { success: false, error: message };
  }
}

export async function toggleUserDeactivation(
  userId: string,
  targetDeactivatedState: boolean
): Promise<ActionResult> {
  try {
    const sessionUser = await verifyUserSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return { success: false, error: 'Nicht autorisiert: Nur Administratoren dürfen Benutzer aktivieren/deaktivieren.' };
    }

    if (userId === sessionUser.id && targetDeactivatedState) {
      return { success: false, error: 'Du kannst dich nicht selbst deaktivieren.' };
    }

    const pb = await getAdminPB();
    await pb.collection('users').update(userId, {
      deactivated: targetDeactivatedState,
      verified: !targetDeactivatedState,
    });
    revalidatePath('/admin/users');
    revalidatePath('/team');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Ändern des Benutzerstatus';
    return { success: false, error: message };
  }
}

export async function updateUserSupervisor(
  userId: string,
  supervisorId: string | null
): Promise<ActionResult> {
  try {
    const sessionUser = await verifyUserSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return { success: false, error: 'Nicht autorisiert: Nur Administratoren dürfen Vorgesetzte zuweisen.' };
    }

    const pb = await getAdminPB();
    await pb.collection('users').update(userId, {
      supervisor: supervisorId || null,
    });
    revalidatePath('/admin/users');
    revalidatePath('/team');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Zuweisen des Vorgesetzten';
    return { success: false, error: message };
  }
}

export async function adminResetUserPassword(
  userId: string,
  data: { password: string; passwordConfirm: string }
): Promise<ActionResult> {
  try {
    const sessionUser = await verifyUserSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return { success: false, error: 'Nicht autorisiert: Nur Administratoren dürfen Passwörter zurücksetzen.' };
    }

    if (!data.password || data.password.length < 8) {
      return { success: false, error: 'Das Passwort muss mindestens 8 Zeichen lang sein.' };
    }

    if (data.password !== data.passwordConfirm) {
      return { success: false, error: 'Die Passwörter stimmen nicht überein.' };
    }

    const pb = await getAdminPB();
    await pb.collection('users').update(userId, {
      password: data.password,
      passwordConfirm: data.passwordConfirm,
    });
    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Zurücksetzen des Passworts';
    return { success: false, error: message };
  }
}

export async function deleteUserAdmin(userId: string): Promise<ActionResult> {
  try {
    const sessionUser = await verifyUserSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return { success: false, error: 'Nicht autorisiert: Nur Administratoren dürfen Benutzer löschen.' };
    }

    if (userId === sessionUser.id) {
      return { success: false, error: 'Du kannst dich nicht selbst löschen.' };
    }

    const pb = await getAdminPB();
    await pb.collection('users').delete(userId);
    revalidatePath('/admin/users');
    revalidatePath('/team');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Löschen des Benutzers';
    return { success: false, error: message };
  }
}
