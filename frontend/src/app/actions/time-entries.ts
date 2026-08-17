'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import type { TimeEntryRecord } from '@/lib/pocketbase-types';
import { calculateBillableMinutes } from '@/lib/billing-calculator';
import { z } from 'zod';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

const CreateTimeEntrySchema = z.object({
  task: z.string().min(1, 'Aufgaben-ID ist erforderlich'),
  start_time: z.string().min(1, 'Startzeit ist erforderlich'),
  end_time: z.string().min(1, 'Endzeit ist erforderlich'),
  duration_minutes: z.number().min(0, 'Dauer muss positiv sein'),
  billable_minutes: z.number().min(0).optional(),
  description: z.string().optional(),
  is_billable: z.boolean().optional(),
  date: z.string().optional(),
  is_billed: z.boolean().optional(),
  billing_reference: z.string().optional(),
});

const UpdateTimeEntrySchema = CreateTimeEntrySchema.partial();

export async function createTimeEntry(
  data: z.infer<typeof CreateTimeEntrySchema>
): Promise<ActionResult<TimeEntryRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const validated = CreateTimeEntrySchema.parse(data);
    const pb = await getAdminPB();

    // Check for overlapping time entries
    const existing = await pb.collection('time_entries').getList(1, 1, {
      filter: pb.filter(
        'user = {:uid} && start_time < {:end} && (end_time = "" || end_time = null || end_time > {:start})',
        {
          uid: user.id,
          start: validated.start_time,
          end: validated.end_time,
        }
      ),
    });

    if (existing.totalItems > 0) {
      return {
        success: false,
        error: 'Der gewählte Zeitblock überschneidet sich mit einem bestehenden Zeiteintrag.',
      };
    }

    // Determine billable minutes
    let finalBillableMinutes = validated.billable_minutes;
    if (finalBillableMinutes === undefined) {
      if (!validated.is_billable) {
        finalBillableMinutes = 0;
      } else {
        // Try to fetch task project and client rounding settings
        try {
          const task = await pb.collection('tasks').getOne(validated.task, {
            expand: 'project,project.client',
          });
          const project = (task as any).expand?.project;
          const client = project?.expand?.client;

          let interval = client?.billing_rounding ?? 6;
          let mode = client?.rounding_mode ?? 'ceil';

          if (project?.billing_rounding && project.billing_rounding !== 'inherit') {
            interval = project.billing_rounding;
          }
          if (project?.rounding_mode && project.rounding_mode !== 'inherit') {
            mode = project.rounding_mode;
          }

          finalBillableMinutes = calculateBillableMinutes({
            rawMinutes: validated.duration_minutes,
            interval: interval,
            mode: mode,
            isBillable: validated.is_billable,
          });
        } catch {
          finalBillableMinutes = calculateBillableMinutes({
            rawMinutes: validated.duration_minutes,
            interval: 6,
            mode: 'ceil',
            isBillable: validated.is_billable,
          });
        }
      }
    }

    const durationSeconds = validated.duration_minutes * 60;

    const record = await pb.collection('time_entries').create<TimeEntryRecord>({
      task: validated.task,
      user: user.id as string,
      start_time: validated.start_time,
      end_time: validated.end_time,
      duration: durationSeconds,
      duration_minutes: validated.duration_minutes,
      billable_minutes: finalBillableMinutes,
      description: validated.description || '',
      is_billable: validated.is_billable !== false,
      is_billed: validated.is_billed || false,
      billing_reference: validated.billing_reference || undefined,
      date: validated.date || validated.start_time.split('T')[0],
    });

    revalidatePath('/time');
    revalidatePath('/dashboard/time');
    revalidatePath('/reports');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Erstellen des Zeiteintrags';
    return { success: false, error: message };
  }
}

export async function updateTimeEntry(
  entryId: string,
  data: z.infer<typeof UpdateTimeEntrySchema>
): Promise<ActionResult<TimeEntryRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const validated = UpdateTimeEntrySchema.parse(data);
    const pb = await getAdminPB();

    // Check overlap if timing is changed
    if (validated.start_time && validated.end_time) {
      const existing = await pb.collection('time_entries').getList(1, 1, {
        filter: pb.filter(
          'user = {:uid} && id != {:eid} && start_time < {:end} && (end_time = "" || end_time = null || end_time > {:start})',
          {
            uid: user.id,
            eid: entryId,
            start: validated.start_time,
            end: validated.end_time,
          }
        ),
      });

      if (existing.totalItems > 0) {
        return {
          success: false,
          error: 'Der gewählte Zeitblock überschneidet sich mit einem bestehenden Zeiteintrag.',
        };
      }
    }

    const payload: Record<string, unknown> = { ...validated };
    if (validated.duration_minutes !== undefined) {
      payload.duration = validated.duration_minutes * 60;
    }

    const record = await pb.collection('time_entries').update<TimeEntryRecord>(entryId, payload);

    revalidatePath('/time');
    revalidatePath('/dashboard/time');
    revalidatePath('/reports');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Zeiteintrags';
    return { success: false, error: message };
  }
}

export async function deleteTimeEntry(entryId: string): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    await pb.collection('time_entries').delete(entryId);

    revalidatePath('/time');
    revalidatePath('/dashboard/time');
    revalidatePath('/reports');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Löschen des Zeiteintrags';
    return { success: false, error: message };
  }
}

export async function toggleTimeEntryBilled(
  entryId: string,
  isBilled: boolean,
  billingReference?: string
): Promise<ActionResult<TimeEntryRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    const record = await pb.collection('time_entries').update<TimeEntryRecord>(entryId, {
      is_billed: isBilled,
      billing_reference: isBilled ? (billingReference || `RE-${new Date().toISOString().slice(0, 10)}`) : null,
    });

    revalidatePath('/time');
    revalidatePath('/dashboard/time');
    revalidatePath('/reports');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Ändern des Abrechnungsstatus';
    return { success: false, error: message };
  }
}
