'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import type { TaskCommentRecord, TaskRecord } from '@/lib/pocketbase-types';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createTaskComment(
  taskId: string,
  content: string,
  mentionedUserIds?: string[]
): Promise<ActionResult<TaskCommentRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    if (!content?.trim()) {
      return { success: false, error: 'Kommentartext darf nicht leer sein.' };
    }

    const pb = await getAdminPB();

    // 1. Collect target user IDs for mentions notifications
    const targetUserIdsSet = new Set<string>(mentionedUserIds || []);

    // Parse @mentions from content (matches @username, @email, etc.)
    const mentionTokens = content.match(/@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+|[a-zA-Z0-9._-]+)/g);
    if (mentionTokens && mentionTokens.length > 0) {
      try {
        const allUsers = await pb.collection('users').getFullList({ fields: 'id,name,email' });
        for (const rawToken of mentionTokens) {
          const query = rawToken.replace(/^@/, '').toLowerCase().trim();
          if (!query) continue;
          for (const u of allUsers) {
            const uName = (u.name || '').toLowerCase();
            const uEmail = (u.email || '').toLowerCase();
            if (uName.includes(query) || uEmail.includes(query) || u.id === query) {
              if (u.id !== user.id) {
                targetUserIdsSet.add(u.id);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Fehler beim Auflösen der Erwähnungen:', e);
      }
    }

    const finalMentionIds = Array.from(targetUserIdsSet);

    const record = await pb.collection('task_comments').create<TaskCommentRecord>({
      task: taskId,
      author: user.id as string,
      content: content.trim(),
      mentions: finalMentionIds.length ? finalMentionIds : undefined,
    });

    // Create notifications for mentioned users
    if (finalMentionIds.length > 0) {
      try {
        const task = await pb.collection('tasks').getOne<TaskRecord>(taskId, {
          expand: 'project',
        });
        const projectKey = (task.expand?.project as any)?.key || 'Aufgabe';
        const taskTitle = task.title || '';
        const authorName = (user as { name?: string; email?: string }).name || (user as { email?: string }).email || 'Ein Teammitglied';

        for (const targetUserId of finalMentionIds) {
          try {
            await pb.collection('notifications').create({
              user: targetUserId,
              type: 'task_mention',
              title: `Erwähnung in [${projectKey}] ${taskTitle}`,
              message: `${authorName} hat dich in einem Kommentar erwähnt: "${content.slice(0, 100)}${content.length > 100 ? '...' : ''}"`,
              read: false,
              link: `/tasks?task=${taskId}`,
            });
          } catch (notifErr) {
            console.warn('Erwähnungs-Benachrichtigung konnte nicht zugestellt werden:', notifErr);
          }
        }
      } catch (err) {
        console.warn('Aufgabendetails für Benachrichtigung konnten nicht geladen werden:', err);
      }
    }

    const expanded = await pb.collection('task_comments').getOne<TaskCommentRecord>(record.id, {
      expand: 'author',
    });

    revalidatePath('/tasks');
    revalidatePath('/dashboard/tasks');
    return { success: true, data: JSON.parse(JSON.stringify(expanded)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Erstellen des Kommentars';
    return { success: false, error: message };
  }
}

export async function updateTaskComment(
  id: string,
  content: string
): Promise<ActionResult<TaskCommentRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    if (!content?.trim()) {
      return { success: false, error: 'Kommentartext darf nicht leer sein.' };
    }

    const pb = await getAdminPB();
    const comment = await pb.collection('task_comments').getOne<TaskCommentRecord>(id);

    if (comment.author !== user.id && user.role !== 'admin') {
      return { success: false, error: 'Du kannst nur deine eigenen Kommentare bearbeiten.' };
    }

    const record = await pb.collection('task_comments').update<TaskCommentRecord>(id, {
      content: content.trim(),
    });

    revalidatePath('/tasks');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Bearbeiten des Kommentars';
    return { success: false, error: message };
  }
}

export async function deleteTaskComment(id: string): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    const comment = await pb.collection('task_comments').getOne<TaskCommentRecord>(id);

    if (comment.author !== user.id && user.role !== 'admin') {
      return { success: false, error: 'Du kannst nur deine eigenen Kommentare löschen.' };
    }

    await pb.collection('task_comments').delete(id);

    revalidatePath('/tasks');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Löschen des Kommentars';
    return { success: false, error: message };
  }
}
