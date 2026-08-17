'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import type { TimeEntryReportRecord } from '@/lib/pocketbase-types';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function saveTimeEntryReport(data: {
  timeEntry: string;
  title: string;
  content: string;
  filename: string;
}): Promise<ActionResult<TimeEntryReportRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();

    const formData = new FormData();
    formData.append('time_entry', data.timeEntry);
    formData.append('file', new Blob([data.content], { type: 'text/markdown' }), data.filename);
    formData.append('title', data.title);
    formData.append('size', String(new Blob([data.content]).size));

    const record = await pb.collection('time_entry_reports').create<TimeEntryReportRecord>(formData);

    revalidatePath('/time');
    revalidatePath('/dashboard/time');
    revalidatePath('/reports');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Speichern des Zeiteintragsberichts';
    return { success: false, error: message };
  }
}

export async function deleteTimeEntryReport(id: string): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    await pb.collection('time_entry_reports').delete(id);

    revalidatePath('/time');
    revalidatePath('/dashboard/time');
    revalidatePath('/reports');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Löschen des Zeiteintragsberichts';
    return { success: false, error: message };
  }
}
