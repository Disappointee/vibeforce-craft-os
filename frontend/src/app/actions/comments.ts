'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';

export async function createCommentAction(
  taskId: string,
  content: string,
  mentionedUserIds?: string[]
) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();

  // 1. Collect target user IDs for notifications (from explicit array + auto-parse)
  const targetUserIdsSet = new Set<string>(mentionedUserIds || []);

  // Parse @mentions from text (matches @word, @first.last, @user@domain.com)
  const mentionTokens = content.match(/@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+|[a-zA-Z0-9._-]+)/g);
  if (mentionTokens && mentionTokens.length > 0) {
    const allUsers = await pb.collection('users').getFullList({ fields: 'id,name,email' });
    for (const rawToken of mentionTokens) {
      const query = rawToken.replace(/^@/, '').toLowerCase().trim();
      if (!query) continue;
      for (const u of allUsers) {
        const uName = (u.name || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        if (uName.includes(query) || uEmail.includes(query) || u.id === query) {
          targetUserIdsSet.add(u.id);
        }
      }
    }
  }

  const finalMentionIds = Array.from(targetUserIdsSet);

  const record = await pb.collection('task_comments').create({
    task: taskId,
    author: user.id,
    content,
    mentions: finalMentionIds.length ? finalMentionIds : null,
  });

  if (finalMentionIds.length > 0) {
    const task = await pb.collection('tasks').getOne(taskId, {
      expand: 'project',
    });
    const projectKey = (task as any).expand?.project?.key || '—';
    const taskRef = `${projectKey}-${taskId.substring(0, 4).toUpperCase()}`;
    const authorName = (user as any).name || (user as any).email || 'Jemand';

    for (const targetUserId of finalMentionIds) {
      try {
        await pb.collection('notifications').create({
          user: targetUserId,
          type: 'task_mention',
          title: `Erwähnung in ${taskRef}`,
          message: `${authorName} hat dich in einem Kommentar zu "${(task as any).title}" erwähnt`,
          read: false,
          link: `/tasks?task=${taskId}`,
        });
      } catch (err) {
        console.error('Failed to create mention notification:', err);
      }
    }
  }

  const expanded = await pb.collection('task_comments').getOne(record.id, {
    expand: 'author',
  });

  revalidatePath('/dashboard/tasks');
  return JSON.parse(JSON.stringify(expanded));
}

export async function updateCommentAction(id: string, content: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  await pb.collection('task_comments').update(id, { content });

  revalidatePath('/dashboard/tasks');
}

export async function deleteCommentAction(id: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  await pb.collection('task_comments').delete(id);

  revalidatePath('/dashboard/tasks');
}
