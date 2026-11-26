'use server';

import { revalidatePath } from 'next/cache';
import { getUserAuthPB, verifyUserSession } from '@/lib/pocketbase-server';
import { z } from 'zod';
import type { DefectPinRecord } from '@/lib/pocketbase-types';

const CreateDefectSchema = z.object({
  project: z.string().min(1),
  title: z.string().min(1, 'Bezeichnung des Mangels ist erforderlich'),
  description: z.string().optional().default(''),
  trade: z.string().min(1),
  location_note: z.string().optional().default('Baustelle allgemein'),
  pin_x: z.number().min(0).max(100).default(50),
  pin_y: z.number().min(0).max(100).default(50),
  severity: z.enum(['minor', 'major', 'critical']).default('major'),
  status: z.enum(['draft', 'notified', 'in_progress', 'resolved', 'accepted']).default('draft'),
  due_date: z.string().min(1),
  contractor_name: z.string().optional().default('Nachunternehmer N.N.'),
  evidence_photo_url: z.string().optional().default(''),
  evidence_sha256: z.string().optional().default(''),
  notice_text: z.string().optional(),
});

const UpdateDefectSchema = CreateDefectSchema.partial().extend({
  resolved_at: z.string().optional(),
  accepted_at: z.string().optional(),
});

export async function getDefectsByProjectAction(
  projectId: string,
  projectKey?: string
): Promise<DefectPinRecord[]> {
  const user = await verifyUserSession();
  const pb = await getUserAuthPB();
  if (!user || !pb) return [];

  const filter = projectKey && projectKey !== projectId
    ? pb.filter('project = {:pid} || project = {:pkey}', { pid: projectId, pkey: projectKey })
    : pb.filter('project = {:pid}', { pid: projectId });

  try {
    const records = await pb.collection('defect_pins').getFullList({ filter });
    records.sort((a: any, b: any) =>
      String(b.created || b.updated || '').localeCompare(String(a.created || a.updated || ''))
    );
    return JSON.parse(JSON.stringify(records)) as DefectPinRecord[];
  } catch (err) {
    console.warn('[getDefectsByProjectAction] Failed to load defect_pins:', err);
    return [];
  }
}

export async function createDefectAction(
  input: z.input<typeof CreateDefectSchema>
): Promise<DefectPinRecord> {
  const user = await verifyUserSession();
  const pb = await getUserAuthPB();
  if (!user || !pb) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = CreateDefectSchema.parse(input);
  const record = await pb.collection('defect_pins').create(validated);
  revalidatePath('/craft/defects');
  revalidatePath('/craft');
  if (validated.project) {
    revalidatePath(`/projects/${validated.project}`);
  }
  return JSON.parse(JSON.stringify(record)) as DefectPinRecord;
}

export async function updateDefectAction(
  defectId: string,
  input: z.input<typeof UpdateDefectSchema>
): Promise<DefectPinRecord> {
  const user = await verifyUserSession();
  const pb = await getUserAuthPB();
  if (!user || !pb) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = UpdateDefectSchema.parse(input);
  const record = await pb.collection('defect_pins').update(defectId, validated);
  revalidatePath('/craft/defects');
  revalidatePath('/craft');
  if (record.project) {
    revalidatePath(`/projects/${record.project}`);
  }
  return JSON.parse(JSON.stringify(record)) as DefectPinRecord;
}

export async function deleteDefectAction(defectId: string): Promise<{ success: boolean }> {
  const user = await verifyUserSession();
  const pb = await getUserAuthPB();
  if (!user || !pb) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  await pb.collection('defect_pins').delete(defectId);
  revalidatePath('/craft/defects');
  revalidatePath('/craft');
  return { success: true };
}
