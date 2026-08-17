'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import type { NotificationRecord } from '@/lib/pocketbase-types';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function markNotificationAsRead(
  id: string,
  read: boolean = true
): Promise<ActionResult<NotificationRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    const record = await pb.collection('notifications').update<NotificationRecord>(id, { read });

    revalidatePath('/notifications');
    revalidatePath('/tasks');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Benachrichtigung';
    return { success: false, error: message };
  }
}

export async function markAllNotificationsAsRead(
  targetUserId?: string
): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const userId = targetUserId || (user.id as string);
    const pb = await getAdminPB();
    const unread = await pb.collection('notifications').getList<NotificationRecord>(1, 200, {
      filter: pb.filter('user = {:userId} && read = false', { userId }),
    });

    await Promise.all(
      unread.items.map((n) => pb.collection('notifications').update(n.id, { read: true }))
    );

    revalidatePath('/notifications');
    revalidatePath('/tasks');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Markieren aller Benachrichtigungen';
    return { success: false, error: message };
  }
}

export async function deleteNotification(id: string): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    await pb.collection('notifications').delete(id);

    revalidatePath('/notifications');
    revalidatePath('/tasks');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Löschen der Benachrichtigung';
    return { success: false, error: message };
  }
}

export async function createSystemNotification(data: {
  userId: string;
  type: 'task_assigned' | 'task_due' | 'task_comment' | 'task_mention' | 'status_change' | 'project_update' | 'budget_warning' | 'system';
  title: string;
  message: string;
  link?: string;
}): Promise<ActionResult<NotificationRecord>> {
  try {
    const pb = await getAdminPB();
    const record = await pb.collection('notifications').create<NotificationRecord>({
      user: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
      read: false,
    });

    revalidatePath('/notifications');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Erstellen der Benachrichtigung';
    return { success: false, error: message };
  }
}

