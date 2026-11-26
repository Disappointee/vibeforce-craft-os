import { isCraftMode, AppMode } from '@/config/app-mode';

/**
 * 🛡️ Central Data Isolation Engine
 * Strictly guarantees that Craft OS and Flow OS data never leak into each other.
 * Mode is determined by NEXT_PUBLIC_APP_MODE env variable only.
 */

export function isCraftProject(project: any): boolean {
  if (!project) return false;
  if (typeof project === 'string') return false;
  const type = (project.project_type || project.type || '').toLowerCase();
  return type === 'craft';
}

export function isCraftTask(task: any): boolean {
  if (!task) return false;
  const project = task.expand?.project || task.project;
  if (project && isCraftProject(project)) return true;
  return false;
}

export function isCraftClient(client: any): boolean {
  if (!client) return false;
  if (typeof client === 'string') return false;
  return Boolean(client.client_type === 'craft');
}

export function filterProjectsByMode<T extends { key?: string; name?: string; project_type?: string; id?: string }>(
  projects: T[],
  explicitMode?: AppMode
): T[] {
  const craft = explicitMode ? explicitMode === 'craft' : isCraftMode();
  return projects.filter((p) => (craft ? isCraftProject(p) : !isCraftProject(p)));
}

export function filterTasksByMode<T extends { id?: string; title?: string; expand?: any; project?: any }>(
  tasks: T[],
  explicitMode?: AppMode
): T[] {
  const craft = explicitMode ? explicitMode === 'craft' : isCraftMode();
  return tasks.filter((t) => (craft ? isCraftTask(t) : !isCraftTask(t)));
}

export function filterClientsByMode<T extends { id?: string; name?: string; company?: string; notes?: string }>(
  clients: T[],
  explicitMode?: AppMode
): T[] {
  const craft = explicitMode ? explicitMode === 'craft' : isCraftMode();
  return clients.filter((c) => (craft ? isCraftClient(c) : !isCraftClient(c)));
}

export function filterTimeEntriesByMode<T extends { expand?: any; task?: any }>(
  entries: T[],
  explicitMode?: AppMode
): T[] {
  const craft = explicitMode ? explicitMode === 'craft' : isCraftMode();
  return entries.filter((entry) => {
    const task = entry.expand?.task;
    const project = task?.expand?.project || entry.expand?.project;
    const isCraft = isCraftTask(task) || isCraftProject(project);
    return craft ? isCraft : !isCraft;
  });
}
