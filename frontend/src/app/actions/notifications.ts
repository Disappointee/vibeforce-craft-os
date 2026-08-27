'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';

export async function markNotificationAsReadAction(id: string, read: boolean = true) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Unauthorized');

  const pb = await getAdminPB();
  await pb.collection('notifications').update(id, { read });

  revalidatePath('/notifications');
  revalidatePath('/');
}

export async function markAllNotificationsAsReadAction(userId: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Unauthorized');

  const pb = await getAdminPB();
  const unread = await pb.collection('notifications').getList(1, 200, {
    filter: pb.filter('user = {:userId} && read = false', { userId }),
  });
  await Promise.all(
    unread.items.map((n) => pb.collection('notifications').update(n.id, { read: true }))
  );

  revalidatePath('/notifications');
  revalidatePath('/');
}

export async function deleteNotificationAction(id: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Unauthorized');

  const pb = await getAdminPB();
  await pb.collection('notifications').delete(id);

  revalidatePath('/notifications');
  revalidatePath('/');
}
