'use server';

import { revalidatePath } from 'next/cache';
import { getUserAuthPB, verifyUserSession } from '@/lib/pocketbase-server';
import { z } from 'zod';

export interface CraftTimeEntryDTO {
  id: string;
  task: string;
  user: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  is_billable: boolean;
  description?: string;
  project_id?: string;
  project_key?: string;
  project_name?: string;
  created?: string;
}

const ClockInSchema = z.object({
  projectId: z.string().optional(),
  projectKey: z.string().optional(),
  activityType: z.string().default('site_assembly'),
  activityLabel: z.string().default('Baustelle & Montage'),
  gpsVerified: z.boolean().optional().default(false),
});

const ClockOutSchema = z.object({
  entryId: z.string().optional(),
  startTimeIso: z.string().optional(),
  endTimeIso: z.string().min(1),
  durationSeconds: z.number().min(0),
  projectId: z.string().optional(),
  projectKey: z.string().optional(),
  activityType: z.string().default('site_assembly'),
  activityLabel: z.string().default('Baustelle & Montage'),
  gpsVerified: z.boolean().optional().default(false),
});

async function resolveTaskForProject(pb: any, projectId?: string, userId?: string): Promise<string> {
  if (projectId && !projectId.startsWith('proj_') && projectId !== 'sample_craft_project') {
    try {
      const existing = await pb.collection('tasks').getList(1, 1, {
        filter: pb.filter('project = {:pid}', { pid: projectId }),
      });
      if (existing.items.length > 0) {
        return existing.items[0].id;
      }
      const createdTask = await pb.collection('tasks').create({
        project: projectId,
        title: 'Baustellen-Zeiterfassung',
        status: 'in_progress',
        priority: 'medium',
        ...(userId ? { assignees: [userId] } : {}),
      });
      return createdTask.id;
    } catch (err) {
      console.warn('[time-clock] resolveTaskForProject project lookup failed:', err);
    }
  }

  try {
    const anyTask = await pb.collection('tasks').getList(1, 1, { sort: '-created' });
    if (anyTask.items.length > 0) {
      return anyTask.items[0].id;
    }
  } catch (err) {
    console.warn('[time-clock] resolveTaskForProject fallback failed:', err);
  }

  throw new Error('Keine Aufgabe für die Zeiterfassung gefunden.');
}

function buildDescription(projectKey: string, activityType: string, activityLabel: string, gpsVerified?: boolean): string {
  return `[${projectKey}|${activityType}] ${activityLabel}${gpsVerified ? ' (GPS verifiziert)' : ''}`;
}

export async function getTodayTimeEntriesAction(): Promise<CraftTimeEntryDTO[]> {
  const user = await verifyUserSession();
  const pb = await getUserAuthPB();
  if (!user || !pb) return [];

  const userId = String(user.id);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

  let items: any[] = [];
  try {
    items = await pb.collection('time_entries').getFullList({
      filter: pb.filter('user = {:uid} && start_time >= {:start} && start_time <= {:end}', {
        uid: userId,
        start: todayStart,
        end: todayEnd,
      }),
      sort: 'start_time',
      expand: 'task,task.project',
    });
  } catch {
    try {
      const allUserEntries = await pb.collection('time_entries').getList(1, 100, {
        filter: pb.filter('user = {:uid}', { uid: userId }),
        sort: '-start_time',
        expand: 'task,task.project',
      });
      const todayPrefix = now.toISOString().slice(0, 10);
      items = allUserEntries.items.filter((e: any) => {
        const st = String(e.start_time || e.created || '');
        return st.slice(0, 10) === todayPrefix;
      });
      items.sort((a: any, b: any) =>
        String(a.start_time || a.created).localeCompare(String(b.start_time || b.created))
      );
    } catch (err) {
      console.warn('[getTodayTimeEntriesAction] Failed:', err);
      return [];
    }
  }

  return items.map((e: any) => ({
    id: e.id,
    task: e.task,
    user: e.user,
    start_time: e.start_time || e.created,
    end_time: e.end_time || undefined,
    duration_minutes: Number(e.duration_minutes) || 0,
    is_billable: e.is_billable !== false,
    description: e.description || '',
    project_id: e.expand?.task?.project || e.expand?.task?.expand?.project?.id,
    project_key: e.expand?.task?.expand?.project?.key,
    project_name: e.expand?.task?.expand?.project?.name,
    created: e.created,
  }));
}

export async function clockInAction(input: z.input<typeof ClockInSchema>): Promise<CraftTimeEntryDTO> {
  const user = await verifyUserSession();
  const pb = await getUserAuthPB();
  if (!user || !pb) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = ClockInSchema.parse(input);
  const userId = String(user.id);
  const nowIso = new Date().toISOString();

  const taskId = await resolveTaskForProject(pb, validated.projectId, userId);
  const description = buildDescription(
    validated.projectKey || 'CRAFT',
    validated.activityType,
    validated.activityLabel,
    validated.gpsVerified
  );

  const record = await pb.collection('time_entries').create({
    task: taskId,
    user: userId,
    start_time: nowIso,
    duration_minutes: 0,
    is_billable: true,
    description,
  });

  revalidatePath('/craft/time');
  revalidatePath('/craft');
  revalidatePath('/time');

  return {
    id: record.id,
    task: record.task,
    user: record.user,
    start_time: record.start_time || nowIso,
    end_time: record.end_time || undefined,
    duration_minutes: Number(record.duration_minutes) || 0,
    is_billable: record.is_billable !== false,
    description: record.description || description,
    created: record.created,
  };
}

export async function clockOutAction(input: z.input<typeof ClockOutSchema>): Promise<CraftTimeEntryDTO> {
  const user = await verifyUserSession();
  const pb = await getUserAuthPB();
  if (!user || !pb) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = ClockOutSchema.parse(input);
  const userId = String(user.id);
  const minutes = Math.max(1, Math.round(validated.durationSeconds / 60));
  const description = buildDescription(
    validated.projectKey || 'CRAFT',
    validated.activityType,
    validated.activityLabel,
    validated.gpsVerified
  );

  let record: any;

  if (validated.entryId && !validated.entryId.startsWith('seg_')) {
    try {
      const existing = await pb.collection('time_entries').getOne(validated.entryId);
      if (existing.user === userId || user.role === 'admin') {
        record = await pb.collection('time_entries').update(validated.entryId, {
          end_time: validated.endTimeIso,
          duration_minutes: minutes,
          description,
        });
      }
    } catch (err) {
      console.warn('[time-clock] Update existing entry failed, creating completed entry:', err);
    }
  }

  if (!record) {
    const taskId = await resolveTaskForProject(pb, validated.projectId, userId);
    record = await pb.collection('time_entries').create({
      task: taskId,
      user: userId,
      start_time: validated.startTimeIso || validated.endTimeIso,
      end_time: validated.endTimeIso,
      duration_minutes: minutes,
      is_billable: true,
      description,
    });
  }

  revalidatePath('/craft/time');
  revalidatePath('/craft');
  revalidatePath('/time');

  return {
    id: record.id,
    task: record.task,
    user: record.user,
    start_time: record.start_time,
    end_time: record.end_time,
    duration_minutes: Number(record.duration_minutes) || minutes,
    is_billable: record.is_billable !== false,
    description: record.description || description,
    created: record.created,
  };
}
