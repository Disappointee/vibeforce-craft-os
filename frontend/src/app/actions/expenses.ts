'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import type { ExternalExpenseRecord } from '@/lib/pocketbase-types';
import { z } from 'zod';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

const CreateExpenseSchema = z.object({
  project: z.string().min(1, 'Projekt-ID ist erforderlich'),
  amount: z.number().min(0.01, 'Betrag muss größer als 0 sein'),
  description: z.string().optional(),
  category: z.string().default('general'),
});

const UpdateExpenseSchema = CreateExpenseSchema.partial();

export async function createExternalExpense(
  data: z.infer<typeof CreateExpenseSchema>
): Promise<ActionResult<ExternalExpenseRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const validated = CreateExpenseSchema.parse(data);
    const pb = await getAdminPB();

    const record = await pb.collection('external_expenses').create<ExternalExpenseRecord>({
      project: validated.project,
      amount: validated.amount,
      description: validated.description || undefined,
      category: validated.category,
    });

    revalidatePath('/projects');
    revalidatePath('/projects/' + validated.project);
    revalidatePath('/dashboard/projects');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Erfassen der Fremdkosten';
    return { success: false, error: message };
  }
}

export async function updateExternalExpense(
  expenseId: string,
  data: z.infer<typeof UpdateExpenseSchema>
): Promise<ActionResult<ExternalExpenseRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const validated = UpdateExpenseSchema.parse(data);
    const pb = await getAdminPB();

    const record = await pb.collection('external_expenses').update<ExternalExpenseRecord>(
      expenseId,
      validated
    );

    revalidatePath('/projects');
    revalidatePath('/dashboard/projects');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Fremdkosten';
    return { success: false, error: message };
  }
}

export async function deleteExternalExpense(expenseId: string): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    await pb.collection('external_expenses').delete(expenseId);

    revalidatePath('/projects');
    revalidatePath('/dashboard/projects');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Löschen der Fremdkosten';
    return { success: false, error: message };
  }
}
