'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';

export async function updateUserRoleAction(userId: string, role: string) {
  try {
    const sessionUser = await verifyUserSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return { error: 'Zugriff verweigert. Nur Administratoren dürfen Rollen ändern.' };
    }

    if (userId === sessionUser.id && role !== 'admin') {
      return { error: 'Du kannst dir selbst nicht die Admin-Rolle entziehen.' };
    }

    const pb = await getAdminPB();
    await pb.collection('users').update(userId, { role });
    revalidatePath('/admin/users');
    revalidatePath('/team');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unbekannter Fehler' };
  }
}

export async function toggleUserActiveAction(userId: string, targetActiveState: boolean) {
  try {
    const sessionUser = await verifyUserSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return { error: 'Zugriff verweigert. Nur Administratoren dürfen Benutzer aktivieren/deaktivieren.' };
    }

    if (userId === sessionUser.id) {
      return { error: 'Du kannst dich nicht selbst deaktivieren.' };
    }

    const pb = await getAdminPB();
    // PocketBase active state is stored in the 'deactivated' boolean field
    await pb.collection('users').update(userId, { deactivated: !targetActiveState });
    revalidatePath('/admin/users');
    revalidatePath('/team');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unbekannter Fehler' };
  }
}

export async function deleteUserAdminAction(userId: string) {
  try {
    const sessionUser = await verifyUserSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return { error: 'Zugriff verweigert. Nur Administratoren dürfen Benutzer löschen.' };
    }

    if (userId === sessionUser.id) {
      return { error: 'Du kannst dich nicht selbst löschen.' };
    }

    const pb = await getAdminPB();
    await pb.collection('users').delete(userId);
    revalidatePath('/admin/users');
    revalidatePath('/team');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unbekannter Fehler' };
  }
}

export async function createUserAction(data: Record<string, any>) {
  try {
    const sessionUser = await verifyUserSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return { error: 'Zugriff verweigert. Nur Administratoren dürfen Benutzer anlegen.' };
    }

    const pb = await getAdminPB();
    const payload = {
      ...data,
      deactivated: false,
    };
    const record = await pb.collection('users').create(payload);
    let smtpFailed = false;
    try {
      await pb.collection('users').requestPasswordReset(data.email);
    } catch (err) {
      console.warn('Failed to send password reset email:', err);
      smtpFailed = true;
    }
    revalidatePath('/admin/users');
    revalidatePath('/team');
    return { success: true, smtpFailed, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: any) {
    return { error: err.message || 'Unbekannter Fehler' };
  }
}

export async function resetUserPasswordAction(userId: string, data: Record<string, any>) {
  try {
    const sessionUser = await verifyUserSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return { error: 'Zugriff verweigert. Nur Administratoren dürfen Passwörter zurücksetzen.' };
    }

    const pb = await getAdminPB();
    await pb.collection('users').update(userId, {
      password: data.password,
      passwordConfirm: data.passwordConfirm,
    });
    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unbekannter Fehler' };
  }
}

export async function updateUserSupervisorAction(userId: string, supervisorId: string | null) {
  try {
    const sessionUser = await verifyUserSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return { error: 'Zugriff verweigert. Nur Administratoren dürfen Vorgesetzte zuweisen.' };
    }

    const pb = await getAdminPB();
    await pb.collection('users').update(userId, {
      supervisor: supervisorId || null,
    });
    revalidatePath('/admin/users');
    revalidatePath('/team');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Unbekannter Fehler' };
  }
}

export async function updateUserProfileAdminAction(
  userId: string,
  data: {
    name?: string;
    weekly_hours_target?: number;
    expertise?: string[];
    role?: string;
    supervisor?: string | null;
  }
) {
  try {
    const sessionUser = await verifyUserSession();
    if (!sessionUser) {
      return { error: '403 - Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const isAdmin = sessionUser.role === 'admin';
    const isSelf = sessionUser.id === userId;

    if (!isAdmin && !isSelf) {
      return { error: '403 - Zugriff verweigert. Nur Administratoren dürfen andere Profile bearbeiten.' };
    }

    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.weekly_hours_target !== undefined) payload.weekly_hours_target = data.weekly_hours_target;
    if (data.expertise !== undefined) payload.expertise = data.expertise;

    if (data.role !== undefined) {
      if (!isAdmin) {
        return { error: '403 - Zugriff verweigert. Nur Administratoren dürfen Rollen ändern.' };
      }
      if (isSelf && data.role !== 'admin') {
        return { error: 'Du kannst dir selbst nicht die Admin-Rolle entziehen.' };
      }
      payload.role = data.role;
    }

    if (data.supervisor !== undefined) {
      if (!isAdmin) {
        return { error: '403 - Zugriff verweigert. Nur Administratoren dürfen Vorgesetzte zuweisen.' };
      }
      payload.supervisor = data.supervisor || null;
    }

    const pb = await getAdminPB();
    const updated = await pb.collection('users').update(userId, payload);
    revalidatePath('/team');
    revalidatePath('/admin/users');
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (err: any) {
    return { error: err.message || 'Unbekannter Fehler beim Aktualisieren des Profils' };
  }
}
