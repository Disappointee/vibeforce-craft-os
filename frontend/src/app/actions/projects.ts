'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import type { ProjectRecord } from '@/lib/pocketbase-types';
import { z } from 'zod';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Projektname ist erforderlich'),
  key: z.string().min(1, 'Projektschlüssel ist erforderlich').transform((val) => val.toUpperCase().trim()),
  description: z.string().optional(),
  status: z.string().default('active'),
  budget_hours: z.number().nullable().optional(),
  budget_money: z.number().nullable().optional(),
  budget_fixed: z.number().nullable().optional(),
  budget_type: z.enum(['fixed', 'hourly', 'retainer']).optional(),
  client: z.string().nullable().optional(),
  members: z.array(z.string()).optional(),
  start_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  billing_rounding: z.union([z.literal(0), z.literal(5), z.literal(6), z.literal(10), z.literal(15), z.literal(30), z.literal('inherit')]).optional(),
  rounding_mode: z.union([z.literal('ceil'), z.literal('round'), z.literal('inherit')]).optional(),
}).passthrough();

const UpdateProjectSchema = CreateProjectSchema.partial();

export async function createProject(data: z.infer<typeof CreateProjectSchema>): Promise<ActionResult<ProjectRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const validated = CreateProjectSchema.parse(data);
    const pb = await getAdminPB();

    const record = await pb.collection('projects').create<ProjectRecord>({
      name: validated.name,
      key: validated.key,
      description: validated.description || undefined,
      status: validated.status || 'active',
      budget_hours: validated.budget_hours ?? undefined,
      budget_money: validated.budget_money ?? undefined,
      budget_fixed: validated.budget_fixed ?? undefined,
      budget_type: validated.budget_type ?? 'hourly',
      client: validated.client || undefined,
      members: validated.members || [user.id as string],
      start_date: validated.start_date || undefined,
      due_date: validated.due_date || undefined,
      billing_rounding: validated.billing_rounding ?? 'inherit',
      rounding_mode: validated.rounding_mode ?? 'inherit',
    });

    revalidatePath('/projects');
    revalidatePath('/dashboard/projects');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Erstellen des Projekts';
    return { success: false, error: message };
  }
}

export async function updateProject(
  projectId: string,
  data: z.infer<typeof UpdateProjectSchema>
): Promise<ActionResult<ProjectRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const validated = UpdateProjectSchema.parse(data);
    const pb = await getAdminPB();
    const record = await pb.collection('projects').update<ProjectRecord>(projectId, validated);

    revalidatePath('/projects');
    revalidatePath('/projects/' + projectId);
    revalidatePath('/dashboard/projects');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Projekts';
    return { success: false, error: message };
  }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    // Soft-Delete für buchhalterische & historische Sicherheit
    await pb.collection('projects').update(id, {
      status: 'archived',
    });

    revalidatePath('/projects');
    revalidatePath('/dashboard/projects');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Löschen des Projekts';
    return { success: false, error: message };
  }
}

export async function archiveProject(id: string): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    await pb.collection('projects').update(id, {
      status: 'archived',
    });

    revalidatePath('/projects');
    revalidatePath('/dashboard/projects');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Archivieren des Projekts';
    return { success: false, error: message };
  }
}
