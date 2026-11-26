'use server';

import { revalidatePath } from 'next/cache';
import { getUserAuthPB, verifyUserSession } from '@/lib/pocketbase-server';
import { z } from 'zod';

async function requireProjectAuth() {
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

export async function revalidateProjectsPath() {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');
  revalidatePath('/projects');
  revalidatePath('/craft');
  revalidatePath('/dashboard/projects');
}

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
  const { user, pb } = await requireProjectAuth();

  const validated = CreateProjectSchema.parse(data);
  const record = await pb.collection('projects').create({
    name: validated.name,
    key: validated.key,
    status: validated.status,
    budget_hours: validated.budget_hours ?? null,
    hourly_rate: validated.hourly_rate ?? null,
    client: validated.client || null,
    start_date: validated.start_date || null,
    due_date: validated.due_date || null,
    members: [user.id],
  });

  revalidatePath('/projects');
  revalidatePath('/craft');
  revalidatePath('/dashboard/projects');
  return JSON.parse(JSON.stringify(record));
}

export async function updateProjectAction(projectId: string, data: Record<string, unknown>) {
  const { user, pb, role } = await requireProjectAuth();

  const existing = await pb.collection('projects').getOne(projectId);
  const isPrivileged = ['admin', 'meister', 'manager', 'bauleiter', 'vorarbeiter'].includes(role);
  const isSiteManager = existing.site_manager === user.id;
  const isMember = Array.isArray(existing.members) && existing.members.includes(user.id);
  if (!isPrivileged && !isSiteManager && !isMember) {
    throw new Error('Zugriff verweigert: Keine Berechtigung für dieses Projekt.');
  }

  const validated = UpdateProjectSchema.parse(data);
  const record = await pb.collection('projects').update(projectId, validated);

  revalidatePath('/projects');
  revalidatePath('/craft');
  revalidatePath('/projects/' + projectId);
  revalidatePath('/dashboard/projects');
  revalidatePath('/dashboard/projects/' + projectId);
  return JSON.parse(JSON.stringify(record));
}

export async function deleteProjectAction(id: string) {
  const { user, pb, role } = await requireProjectAuth();

  const existing = await pb.collection('projects').getOne(id);
  const isPrivileged = ['admin', 'meister', 'manager', 'bauleiter'].includes(role);
  const isSiteManager = existing.site_manager === user.id;
  if (!isPrivileged && !isSiteManager) {
    throw new Error('Zugriff verweigert: Nur Administratoren oder Projektleiter dürfen Projekte archivieren.');
  }

  // Soft-Delete für buchhalterische & historische Sicherheit
  await pb.collection('projects').update(id, {
    status: 'archived',
  });

  revalidatePath('/projects');
  revalidatePath('/craft');
  revalidatePath('/dashboard/projects');
}
