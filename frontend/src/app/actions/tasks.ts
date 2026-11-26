'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, getUserAuthPB, verifyUserSession } from '@/lib/pocketbase-server';
import type { TaskRecord, ChecklistItemRecord, TaskLinkType } from '@/lib/pocketbase-types';

import { z } from 'zod';

const CreateTaskSchema = z.object({
  project: z.string().min(1, 'Projekt-ID ist erforderlich'),
  title: z.string().min(1, 'Aufgabentitel ist erforderlich'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  type: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  parent_task: z.string().optional(),
  estimated_hours: z.number().optional(),
});

const UpdateTaskSchema = CreateTaskSchema.partial();

async function requireTaskAuth() {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');
  const pb = await getUserAuthPB();
  if (!pb) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');
  const role = typeof user.role === 'string' ? user.role.toLowerCase() : '';
  if (role === 'client' || role === 'auftraggeber') {
    throw new Error('Zugriff verweigert.');
  }
  return { user, pb };
}

export async function createTaskAction(data: z.infer<typeof CreateTaskSchema>) {
  const { user, pb } = await requireTaskAuth();

  const validated = CreateTaskSchema.parse(data);
  const record = await pb.collection('tasks').create({
    project: validated.project,
    title: validated.title,
    description: validated.description || '',
    status: validated.status || 'todo',
    priority: validated.priority || 'medium',
    type: validated.type || 'other',
    assignees: validated.assignees?.length ? validated.assignees : [user.id],
    start_date: validated.start_date || undefined,
    due_date: validated.due_date || undefined,
    parent_task: validated.parent_task || undefined,
    estimated_hours: validated.estimated_hours ?? undefined,
  });

  if (validated.assignees?.length && !validated.parent_task) {
    const pbAdmin = await getAdminPB();
    for (const assigneeId of validated.assignees) {
      try {
        const assignee = await pbAdmin.collection('users').getOne(assigneeId);
        if (assignee.notify_on_assignment !== false) {
          await pbAdmin.collection('notifications').create({
            user: assigneeId,
            type: 'task_assigned',
            title: `Neue Aufgabe: ${validated.title}`,
            message: `${(user as { name?: string }).name || 'Jemand'} hat dir eine Aufgabe zugewiesen.`,
            link: `/tasks`,
          });
        }
      } catch {
        console.error('Fehler beim Erstellen der Benachrichtigung');
      }
    }
  }

  revalidatePath('/tasks');
  revalidatePath('/dashboard/tasks');
  return JSON.parse(JSON.stringify(record));
}

export async function updateTaskAction(id: string, data: z.infer<typeof UpdateTaskSchema>) {
  const { pb } = await requireTaskAuth();

  const validated = UpdateTaskSchema.parse(data);
  const record = await pb.collection('tasks').update(id, validated);

  revalidatePath('/tasks');
  revalidatePath('/dashboard/tasks');
  return JSON.parse(JSON.stringify(record));
}

export async function deleteTaskAction(id: string) {
  const { user, pb } = await requireTaskAuth();
  const role = typeof user.role === 'string' ? user.role.toLowerCase() : '';
  const existing = await pb.collection('tasks').getOne(id);
  const isPrivileged = ['admin', 'meister', 'manager', 'bauleiter', 'vorarbeiter'].includes(role);
  const isAssignee = Array.isArray(existing.assignees) && existing.assignees.includes(user.id);
  if (!isPrivileged && !isAssignee) {
    throw new Error('Zugriff verweigert: Nur Projektleitung oder zugewiesene Bearbeiter dürfen Aufgaben löschen.');
  }
  await pb.collection('tasks').delete(id);

  revalidatePath('/tasks');
  revalidatePath('/dashboard/tasks');
}

export async function createTaskLinkAction(sourceTask: string, targetTask: string, linkType: TaskLinkType) {
  const { pb } = await requireTaskAuth();

  const record = await pb.collection('task_links').create({
    source_task: sourceTask,
    target_task: targetTask,
    link_type: linkType,
  });

  revalidatePath('/tasks');
  revalidatePath('/dashboard/tasks');
  return JSON.parse(JSON.stringify(record));
}

export async function deleteTaskLinkAction(id: string) {
  const { pb } = await requireTaskAuth();

  await pb.collection('task_links').delete(id);

  revalidatePath('/tasks');
  revalidatePath('/dashboard/tasks');
}

export async function createChecklistItemAction(taskId: string, title: string, sortOrder?: number) {
  const { pb } = await requireTaskAuth();

  const record = await pb.collection('checklist_items').create({
    task: taskId,
    title,
    completed: false,
    sort_order: sortOrder ?? 0,
  });

  revalidatePath('/tasks');
  revalidatePath('/dashboard/tasks');
  return JSON.parse(JSON.stringify(record));
}

export async function updateChecklistItemAction(id: string, data: Partial<ChecklistItemRecord>) {
  const { pb } = await requireTaskAuth();

  const record = await pb.collection('checklist_items').update(id, data);

  revalidatePath('/tasks');
  revalidatePath('/dashboard/tasks');
  return JSON.parse(JSON.stringify(record));
}

export async function deleteChecklistItemAction(id: string) {
  const { pb } = await requireTaskAuth();

  await pb.collection('checklist_items').delete(id);

  revalidatePath('/tasks');
  revalidatePath('/dashboard/tasks');
}

export async function uploadTaskFileAction(formData: FormData) {
  const { pb } = await requireTaskAuth();

  const record = await pb.collection('task_files').create(formData);

  revalidatePath('/tasks');
  revalidatePath('/dashboard/tasks');
  return JSON.parse(JSON.stringify(record));
}

export async function deleteTaskFileAction(id: string) {
  const { pb } = await requireTaskAuth();

  await pb.collection('task_files').delete(id);

  revalidatePath('/tasks');
  revalidatePath('/dashboard/tasks');
}
