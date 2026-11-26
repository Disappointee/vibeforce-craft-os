'use server';

import { revalidatePath } from 'next/cache';
import { getUserAuthPB, verifyUserSession } from '@/lib/pocketbase-server';

async function requireExpenseAuth() {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');
  const pb = await getUserAuthPB();
  if (!pb) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');
  const role = typeof user.role === 'string' ? user.role.toLowerCase() : '';
  if (role === 'client' || role === 'auftraggeber' || role.startsWith('guest_slot_')) {
    throw new Error('Zugriff verweigert.');
  }
  return { user, pb, role };
}

export async function createExpenseAction(data: {
  project: string;
  amount: number;
  description?: string;
  category: string;
}) {
  const { pb } = await requireExpenseAuth();

  const record = await pb.collection('external_expenses').create({
    project: data.project,
    amount: data.amount,
    description: data.description || undefined,
    category: data.category,
  });

  revalidatePath('/projects');
  revalidatePath('/craft');
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
  const { pb } = await requireExpenseAuth();

  const record = await pb.collection('external_expenses').update(expenseId, {
    amount: data.amount,
    description: data.description || undefined,
    category: data.category,
  });

  revalidatePath('/projects');
  revalidatePath('/craft');
  revalidatePath('/dashboard/projects');
  return JSON.parse(JSON.stringify(record));
}

export async function deleteExpenseAction(expenseId: string) {
  const { user, pb, role } = await requireExpenseAuth();
  const isPrivileged = ['admin', 'meister', 'manager', 'bauleiter', 'buero'].includes(role);
  if (!isPrivileged) {
    const existing = await pb.collection('external_expenses').getOne(expenseId);
    if (existing.project) {
      const project = await pb.collection('projects').getOne(existing.project);
      if (project.site_manager !== user.id) {
        throw new Error('Zugriff verweigert: Nur Projektleitung darf Ausgaben löschen.');
      }
    }
  }

  await pb.collection('external_expenses').delete(expenseId);

  revalidatePath('/projects');
  revalidatePath('/craft');
  revalidatePath('/dashboard/projects');
  return { success: true };
}
