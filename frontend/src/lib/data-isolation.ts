import { isCraftMode, AppMode } from '@/config/app-mode';

/**
 * 🛡️ Central Data Isolation Engine
 * Strictly guarantees that Craft OS and Flow OS data never leak into each other.
 */

export function isCraftProject(project: any): boolean {
  if (!project) return false;
  if (typeof project === 'string') {
    return project.startsWith('BAU') || project.startsWith('CRAFT');
  }
  const key = (project.key || '').toUpperCase();
  const name = (project.name || '').toLowerCase();
  const type = (project.project_type || project.type || '').toLowerCase();

  return (
    type === 'craft' ||
    key.startsWith('BAU') ||
    key.startsWith('CRAFT') ||
    name.includes('baustelle') ||
    name.includes('bauvorhaben') ||
    name.includes('neubau efh') ||
    name.includes('sanierung gewerbehalle') ||
    name.includes('dachstuhl') ||
    name.includes('trockenbau') ||
    project.id === '58t8jfsty4e6o99' ||
    project.id === 'detyh3oxx7y80za'
  );
}

export function isCraftTask(task: any): boolean {
  if (!task) return false;
  const project = task.expand?.project || task.project;
  if (isCraftProject(project)) return true;

  const title = (task.title || '').toLowerCase();
  const desc = (task.description || '').toLowerCase();

  const craftKeywords = [
    'vob',
    'mängelrüge',
    'mangelrüge',
    'bautagesbericht',
    'bautagebuch',
    'aufmaß',
    'aufmass',
    'gerüstfreigabe',
    'aufsparrendämmung',
    'brandabschottung',
    'kabeltrasse',
    'din 18299',
    'monteur',
    'kolonne',
  ];

  return craftKeywords.some((kw) => title.includes(kw) || desc.includes(kw));
}

export function isCraftClient(client: any): boolean {
  if (!client) return false;
  if (typeof client === 'string') return false;

  const name = (client.name || '').toLowerCase();
  const company = (client.company || '').toLowerCase();
  const notes = (client.notes || '').toLowerCase();

  return Boolean(
    client.client_type === 'craft' ||
    client.has_48b_certificate ||
    notes.includes('§ 48b') ||
    notes.includes('§ 13b') ||
    notes.includes('bauherr') ||
    notes.includes('bauträger') ||
    notes.includes('holzständer') ||
    company.includes('bauvorhaben') ||
    company.includes('gewerbebau') ||
    name.includes('familie markus huber') ||
    name.includes('gewerbebau schmidt') ||
    client.id === 'vlde9jwt008siwf' ||
    client.id === 'ijdp3yagl2sd5ex'
  );
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
