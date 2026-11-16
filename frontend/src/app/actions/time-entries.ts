'use server';

import { revalidatePath } from 'next/cache';
import { withAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import { z } from 'zod';

const CreateTimeEntrySchema = z.object({
  task: z.string().min(1, 'Aufgaben-ID ist erforderlich'),
  start_time: z.string().min(1, 'Startzeit ist erforderlich'),
  end_time: z.string().min(1, 'Endzeit ist erforderlich'),
  duration_minutes: z.number().min(0, 'Dauer muss positiv sein'),
  description: z.string().optional(),
  is_billable: z.boolean().optional().default(true),
  date: z.string().optional(),
});

const UpdateTimeEntrySchema = CreateTimeEntrySchema.partial();

export async function createTimeEntryAction(data: z.infer<typeof CreateTimeEntrySchema>) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = CreateTimeEntrySchema.parse(data);

  return withAdminPB(async (pb) => {
    const existing = await pb.collection('time_entries').getList(1, 1, {
      filter: pb.filter('user = {:uid} && start_time < {:end} && (end_time = "" || end_time = null || end_time > {:start})', {
        uid: user.id,
        start: validated.start_time,
        end: validated.end_time,
      }),
    });
    if (existing.totalItems > 0) {
      throw new Error('Zeitblock überschneidet sich mit einem bestehenden Eintrag');
    }

    const record = await pb.collection('time_entries').create({
      task: validated.task,
      user: user.id,
      start_time: validated.start_time,
      end_time: validated.end_time,
      duration_minutes: validated.duration_minutes,
      description: validated.description || undefined,
      is_billable: validated.is_billable !== false,
      date: validated.date,
    });

    revalidatePath('/time');
    revalidatePath('/craft/time');
    revalidatePath('/dashboard/time');
    return JSON.parse(JSON.stringify(record));
  });
}

export async function updateTimeEntryAction(
  entryId: string,
  data: z.infer<typeof UpdateTimeEntrySchema>
) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = UpdateTimeEntrySchema.parse(data);

  return withAdminPB(async (pb) => {
    // 1. Target-Record laden für BOLA/IDOR-Schutz
    const targetRecord = await pb.collection('time_entries').getOne(entryId);

    // 2. BOLA/IDOR: Nur Owner oder Admin darf bearbeiten
    const isAdmin = user.role === 'admin';
    const isOwner = (targetRecord as any).user === user.id;
    if (!isAdmin && !isOwner) {
      throw new Error('Nicht autorisiert: Zugriff auf fremden Zeiteintrag verweigert.');
    }

    // 3. Overlap-Check gegen den Mitarbeiter (targetRecord.user), nicht gegen den Admin
    if (validated.start_time && validated.end_time) {
      const effectiveUserId = (targetRecord as any).user;
      const existing = await pb.collection('time_entries').getList(1, 1, {
        filter: pb.filter('user = {:uid} && id != {:eid} && start_time < {:end} && (end_time = "" || end_time = null || end_time > {:start})', {
          uid: effectiveUserId,
          eid: entryId,
          start: validated.start_time,
          end: validated.end_time,
        }),
      });
      if (existing.totalItems > 0) {
        throw new Error('Zeitblock überschneidet sich mit einem bestehenden Eintrag');
      }
    }

    const record = await pb.collection('time_entries').update(entryId, validated);

    revalidatePath('/time');
    revalidatePath('/craft/time');
    revalidatePath('/dashboard/time');
    return JSON.parse(JSON.stringify(record));
  });
}

export async function deleteTimeEntryAction(entryId: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  return withAdminPB(async (pb) => {
    // 1. Target-Record laden für BOLA/IDOR-Schutz
    const targetRecord = await pb.collection('time_entries').getOne(entryId);

    // 2. BOLA/IDOR: Nur Owner oder Admin darf löschen
    const isAdmin = user.role === 'admin';
    const isOwner = (targetRecord as any).user === user.id;
    if (!isAdmin && !isOwner) {
      throw new Error('Nicht autorisiert: Zugriff auf fremden Zeiteintrag verweigert.');
    }

    await pb.collection('time_entries').delete(entryId);

    revalidatePath('/time');
    revalidatePath('/craft/time');
    revalidatePath('/dashboard/time');
    return { success: true };
  });
}

