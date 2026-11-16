'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';

export async function revalidateProjectsPath() {
  await verifyUserSession();
  revalidatePath('/projects');
  revalidatePath('/craft');
  revalidatePath('/dashboard/projects');
}


import { z } from 'zod';

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Projektname ist erforderlich'),
  key: z.string().min(1, 'Projektschlüssel ist erforderlich').transform((val) => val.toUpperCase()),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  budget_hours: z.number().nullable().optional(),
  hourly_rate: z.number().nullable().optional(),
  client: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
});

const UpdateProjectSchema = CreateProjectSchema.partial();

export async function createProjectAction(data: z.infer<typeof CreateProjectSchema>) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = CreateProjectSchema.parse(data);
  const pb = await getAdminPB();
  const record = await pb.collection('projects').create({
    name: validated.name,
    key: validated.key,
    status: validated.status,
    budget_hours: validated.budget_hours ?? null,
    hourly_rate: validated.hourly_rate ?? null,
    client: validated.client || null,
    start_date: validated.start_date || null,
    due_date: validated.due_date || null,
  });

  revalidatePath('/projects');
  revalidatePath('/craft');
  revalidatePath('/dashboard/projects');
  return JSON.parse(JSON.stringify(record));
}

export async function updateProjectAction(projectId: string, data: Record<string, unknown>) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = UpdateProjectSchema.parse(data);
  const pb = await getAdminPB();
  const record = await pb.collection('projects').update(projectId, validated);

  revalidatePath('/projects');
  revalidatePath('/craft');
  revalidatePath('/projects/' + projectId);
  revalidatePath('/dashboard/projects');
  revalidatePath('/dashboard/projects/' + projectId);
  return JSON.parse(JSON.stringify(record));
}

export async function deleteProjectAction(id: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  // Soft-Delete für buchhalterische & historische Sicherheit
  await pb.collection('projects').update(id, {
    status: 'archived',
  });

  revalidatePath('/projects');
  revalidatePath('/craft');
  revalidatePath('/dashboard/projects');
}
