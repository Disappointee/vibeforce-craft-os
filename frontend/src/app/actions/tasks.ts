'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
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
}).passthrough();

const UpdateTaskSchema = CreateTaskSchema.partial();

export async function createTaskAction(data: z.infer<typeof CreateTaskSchema>) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = CreateTaskSchema.parse(data);
  const pb = await getAdminPB();
  const record = await pb.collection('tasks').create({
    project: validated.project,
    title: validated.title,
    description: validated.description || '',
    status: validated.status || 'todo',
    priority: validated.priority || 'medium',
    type: validated.type || 'other',
    assignees: validated.assignees?.length ? validated.assignees : [user.id],
    due_date: validated.due_date || undefined,
    parent_task: validated.parent_task || undefined,
  });

  if (validated.assignees?.length && !validated.parent_task) {
    for (const assigneeId of validated.assignees) {
      try {
        const assignee = await pb.collection('users').getOne(assigneeId);
        if (assignee.notify_on_assignment !== false) {
          await pb.collection('notifications').create({
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

  revalidatePath('/dashboard/tasks');
  return JSON.parse(JSON.stringify(record));
}

export async function updateTaskAction(id: string, data: z.infer<typeof UpdateTaskSchema>) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = UpdateTaskSchema.parse(data);
  const pb = await getAdminPB();
  const record = await pb.collection('tasks').update(id, validated);

  revalidatePath('/dashboard/tasks');
  return JSON.parse(JSON.stringify(record));
}

export async function deleteTaskAction(id: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  await pb.collection('tasks').delete(id);

  revalidatePath('/dashboard/tasks');
}

export async function createTaskLinkAction(sourceTask: string, targetTask: string, linkType: TaskLinkType) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  const record = await pb.collection('task_links').create({
    source_task: sourceTask,
    target_task: targetTask,
    link_type: linkType,
  });

  revalidatePath('/dashboard/tasks');
  return JSON.parse(JSON.stringify(record));
}

export async function deleteTaskLinkAction(id: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  await pb.collection('task_links').delete(id);

  revalidatePath('/dashboard/tasks');
}

export async function createChecklistItemAction(taskId: string, title: string, sortOrder?: number) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  const record = await pb.collection('checklist_items').create({
    task: taskId,
    title,
    completed: false,
    sort_order: sortOrder ?? 0,
  });

  revalidatePath('/dashboard/tasks');
  return JSON.parse(JSON.stringify(record));
}

export async function updateChecklistItemAction(id: string, data: Partial<ChecklistItemRecord>) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  const record = await pb.collection('checklist_items').update(id, data);

  revalidatePath('/dashboard/tasks');
  return JSON.parse(JSON.stringify(record));
}

export async function deleteChecklistItemAction(id: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  await pb.collection('checklist_items').delete(id);

  revalidatePath('/dashboard/tasks');
}

export async function uploadTaskFileAction(formData: FormData) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  const record = await pb.collection('task_files').create(formData);

  revalidatePath('/dashboard/tasks');
  return JSON.parse(JSON.stringify(record));
}

export async function deleteTaskFileAction(id: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  await pb.collection('task_files').delete(id);

  revalidatePath('/dashboard/tasks');
}
