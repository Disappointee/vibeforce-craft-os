'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import type { TaskRecord, ChecklistItemRecord, TaskLinkRecord, TaskFileRecord, TaskLinkType } from '@/lib/pocketbase-types';
import { z } from 'zod';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

const CreateTaskSchema = z.object({
  project: z.string().min(1, 'Projekt-ID ist erforderlich'),
  title: z.string().min(1, 'Aufgabentitel ist erforderlich'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(['acute', 'high', 'medium', 'low']).optional(),
  type: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  parent_task: z.string().optional(),
  estimated_hours: z.number().optional(),
  is_recurring: z.boolean().optional(),
  recurring_interval: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']).optional(),
  recurring_custom_days: z.number().optional(),
  recurring_end_date: z.string().optional(),
  recurring_next_date: z.string().optional(),
}).passthrough();

const UpdateTaskSchema = CreateTaskSchema.partial();

export async function createTask(data: z.infer<typeof CreateTaskSchema>): Promise<ActionResult<TaskRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const validated = CreateTaskSchema.parse(data);
    const pb = await getAdminPB();

    const record = await pb.collection('tasks').create<TaskRecord>({
      project: validated.project,
      title: validated.title,
      description: validated.description || '',
      status: validated.status || 'todo',
      priority: validated.priority || 'medium',
      type: validated.type || 'other',
      assignees: validated.assignees?.length ? validated.assignees : [user.id as string],
      start_date: validated.start_date || undefined,
      due_date: validated.due_date || undefined,
      parent_task: validated.parent_task || undefined,
      estimated_hours: validated.estimated_hours ?? undefined,
      is_recurring: validated.is_recurring ?? false,
      recurring_interval: validated.recurring_interval ?? undefined,
      recurring_custom_days: validated.recurring_custom_days ?? undefined,
      recurring_end_date: validated.recurring_end_date ?? undefined,
      recurring_next_date: validated.recurring_next_date ?? undefined,
    });

    // Notify assignees (except creator)
    if (validated.assignees?.length) {
      for (const assigneeId of validated.assignees) {
        if (assigneeId === user.id) continue;
        try {
          const assignee = await pb.collection('users').getOne(assigneeId);
          if (assignee.notify_on_assignment !== false) {
            await pb.collection('notifications').create({
              user: assigneeId,
              type: 'task_assigned',
              title: `Neue Aufgabe: ${validated.title}`,
              message: `${(user as { name?: string }).name || 'Ein Teammitglied'} hat dir eine Aufgabe zugewiesen.`,
              link: `/tasks?task=${record.id}`,
            });
          }
        } catch {
          console.warn('Benachrichtigung an Zugewiesenen konnte nicht erstellt werden');
        }
      }
    }

    revalidatePath('/tasks');
    revalidatePath('/dashboard/tasks');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Erstellen der Aufgabe';
    return { success: false, error: message };
  }
}

export async function updateTask(
  id: string,
  data: z.infer<typeof UpdateTaskSchema>
): Promise<ActionResult<TaskRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const validated = UpdateTaskSchema.parse(data);
    const pb = await getAdminPB();
    const record = await pb.collection('tasks').update<TaskRecord>(id, validated);

    revalidatePath('/tasks');
    revalidatePath('/dashboard/tasks');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Aufgabe';
    return { success: false, error: message };
  }
}

export async function deleteTask(id: string): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    await pb.collection('tasks').delete(id);

    revalidatePath('/tasks');
    revalidatePath('/dashboard/tasks');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Löschen der Aufgabe';
    return { success: false, error: message };
  }
}

export async function reorderTasks(
  tasks: { id: string; status?: string }[]
): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    await Promise.all(
      tasks.map((t) => {
        const payload: Record<string, unknown> = {};
        if (t.status) payload.status = t.status;
        return pb.collection('tasks').update(t.id, payload);
      })
    );

    revalidatePath('/tasks');
    revalidatePath('/dashboard/tasks');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Neuanordnen der Aufgaben';
    return { success: false, error: message };
  }
}

export async function batchUpdateTaskStatus(
  taskIds: string[],
  status: string
): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    await Promise.all(
      taskIds.map((id) => pb.collection('tasks').update(id, { status }))
    );

    revalidatePath('/tasks');
    revalidatePath('/dashboard/tasks');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler bei der Sammelaktualisierung der Aufgaben';
    return { success: false, error: message };
  }
}

export async function duplicateTask(taskId: string): Promise<ActionResult<TaskRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    const original = await pb.collection('tasks').getOne<TaskRecord>(taskId);

    const cloned = await pb.collection('tasks').create<TaskRecord>({
      project: original.project,
      title: `${original.title} (Kopie)`,
      description: original.description || '',
      status: 'todo',
      priority: original.priority,
      type: original.type,
      assignees: original.assignees || [user.id as string],
      estimated_hours: original.estimated_hours,
      due_date: original.due_date,
    });

    // Clone checklist items if any
    try {
      const checklistItems = await pb.collection('checklist_items').getFullList<ChecklistItemRecord>({
        filter: pb.filter('task = {:taskId}', { taskId }),
      });
      for (const item of checklistItems) {
        await pb.collection('checklist_items').create({
          task: cloned.id,
          title: item.title,
          completed: false,
          sort_order: item.sort_order,
        });
      }
    } catch {
      console.warn('Checklisten-Einträge konnten nicht dupliziert werden');
    }

    revalidatePath('/tasks');
    revalidatePath('/dashboard/tasks');
    return { success: true, data: JSON.parse(JSON.stringify(cloned)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Duplizieren der Aufgabe';
    return { success: false, error: message };
  }
}

// Checklist Helpers
export async function createChecklistItem(
  taskId: string,
  title: string,
  sortOrder?: number
): Promise<ActionResult<ChecklistItemRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    const record = await pb.collection('checklist_items').create<ChecklistItemRecord>({
      task: taskId,
      title,
      completed: false,
      sort_order: sortOrder ?? 0,
    });

    revalidatePath('/tasks');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Erstellen des Checklisteneintrags';
    return { success: false, error: message };
  }
}

export async function updateChecklistItem(
  id: string,
  data: Partial<ChecklistItemRecord>
): Promise<ActionResult<ChecklistItemRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    const record = await pb.collection('checklist_items').update<ChecklistItemRecord>(id, data);

    revalidatePath('/tasks');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Checklisteneintrags';
    return { success: false, error: message };
  }
}

export async function deleteChecklistItem(id: string): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    await pb.collection('checklist_items').delete(id);

    revalidatePath('/tasks');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Löschen des Checklisteneintrags';
    return { success: false, error: message };
  }
}

// Task Links Helpers
export async function createTaskLink(
  sourceTask: string,
  targetTask: string,
  linkType: TaskLinkType
): Promise<ActionResult<TaskLinkRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    const record = await pb.collection('task_links').create<TaskLinkRecord>({
      source_task: sourceTask,
      target_task: targetTask,
      link_type: linkType,
    });

    revalidatePath('/tasks');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Verknüpfen der Aufgaben';
    return { success: false, error: message };
  }
}

export async function deleteTaskLink(id: string): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    await pb.collection('task_links').delete(id);

    revalidatePath('/tasks');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Löschen der Aufgabenverknüpfung';
    return { success: false, error: message };
  }
}

// Task Files Helpers
export async function uploadTaskFile(formData: FormData): Promise<ActionResult<TaskFileRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    const record = await pb.collection('task_files').create<TaskFileRecord>(formData);

    revalidatePath('/tasks');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Hochladen der Datei';
    return { success: false, error: message };
  }
}

export async function deleteTaskFile(id: string): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    await pb.collection('task_files').delete(id);

    revalidatePath('/tasks');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Löschen der Dateianlage';
    return { success: false, error: message };
  }
}
