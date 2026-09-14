'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';

export async function createExpenseAction(data: {
  project: string;
  amount: number;
  description?: string;
  category: string;
}) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  const record = await pb.collection('external_expenses').create({
    project: data.project,
    amount: data.amount,
    description: data.description || undefined,
    category: data.category,
  });

  revalidatePath('/dashboard/projects');
  return JSON.parse(JSON.stringify(record));
}

export async function updateExpenseAction(
  expenseId: string,
  data: {
    amount: number;
    description?: string;
    category: string;
  }
) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  const record = await pb.collection('external_expenses').update(expenseId, {
    amount: data.amount,
    description: data.description || undefined,
    category: data.category,
  });

  revalidatePath('/dashboard/projects');
  return JSON.parse(JSON.stringify(record));
}

export async function deleteExpenseAction(expenseId: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  await pb.collection('external_expenses').delete(expenseId);

  revalidatePath('/dashboard/projects');
  return { success: true };
}
