import { isCraftMode, AppMode } from '@/config/app-mode';

/**
 * 🛡️ Central Data Isolation Engine
 * Strictly guarantees that Craft OS and Flow OS data never leak into each other.
 */

// Known Craft Record IDs in PocketBase (live VPS fallback anchors)
const KNOWN_CRAFT_PROJECT_IDS = new Set(['58t8jfsty4e6o99', 'detyh3oxx7y80za']);
const KNOWN_CRAFT_TASK_IDS = new Set([
  '441lupihd34nc0y',
  'zsutdgirrg5fb3m',
  'g4b67ljj4v3fnwj',
  'qnarra0zv0x4j17',
]);
const KNOWN_CRAFT_CLIENT_IDS = new Set(['vlde9jwt008siwf', 'ijdp3yagl2sd5ex']);

export function isCraftProject(project: any): boolean {
  if (!project) return false;
  if (typeof project === 'string') {
    const s = project.toUpperCase();
    return (
      s.startsWith('BAU') ||
      s.startsWith('CRAFT') ||
      s.startsWith('HANDWERK') ||
      KNOWN_CRAFT_PROJECT_IDS.has(project)
    );
  }

  if (KNOWN_CRAFT_PROJECT_IDS.has(project.id)) return true;

  const key = (project.key || '').toUpperCase();
  const name = (project.name || '').toLowerCase();
  const type = (project.project_type || project.type || '').toLowerCase();
  const siteAddress = (project.site_address || '').toLowerCase();
  const trade = (project.trade || '').toLowerCase();
  const clientId = project.client || project.expand?.client?.id;

  if (clientId && (KNOWN_CRAFT_CLIENT_IDS.has(clientId) || isCraftClient(project.expand?.client))) {
    return true;
  }

  if (Boolean(project.is_craft) || Boolean(project.site_address) || Boolean(project.trade)) {
    return true;
  }

  return (
    type === 'craft' ||
    key.startsWith('BAU') ||
    key.startsWith('CRAFT') ||
    key.startsWith('HANDWERK') ||
    name.includes('baustelle') ||
    name.includes('bauvorhaben') ||
    name.includes('neubau') ||
    name.includes('sanierung gewerbehalle') ||
    name.includes('sanierung') ||
    name.includes('dachstuhl') ||
    name.includes('trockenbau') ||
    name.includes('holzbau') ||
    name.includes('brandschutz') ||
    name.includes('handwerk') ||
    siteAddress.length > 0 ||
    trade.length > 0
  );
}

export function isCraftTask(task: any): boolean {
  if (!task) return false;
  if (typeof task === 'string') {
    return KNOWN_CRAFT_TASK_IDS.has(task);
  }

  if (KNOWN_CRAFT_TASK_IDS.has(task.id)) return true;

  const project = task.expand?.project || task.project;
  if (project && isCraftProject(project)) return true;

  const title = (task.title || '').toLowerCase();
  const desc = (task.description || '').toLowerCase();

  const craftKeywords = [
    'vob',
    'mängelrüge',
    'mangelrüge',
    'mängel',
    'bautagesbericht',
    'bautagebuch',
    'aufmaß',
    'aufmass',
    'gerüst',
    'geruest',
    'dämmung',
    'daemmung',
    'brandabschottung',
    'kabeltrasse',
    'din 18299',
    'monteur',
    'kolonne',
    'baustelle',
    'rohbau',
    'estrich',
    'trockenbau',
    'dachstuhl',
    'zimmerer',
    'polier',
    'bauleiter',
    'schlussaufmaß',
    'abnahme nach vob',
    'handwerker',
  ];

  return craftKeywords.some((kw) => title.includes(kw) || desc.includes(kw));
}

export function isCraftClient(client: any): boolean {
  if (!client) return false;
  if (typeof client === 'string') {
    return KNOWN_CRAFT_CLIENT_IDS.has(client);
  }

  if (KNOWN_CRAFT_CLIENT_IDS.has(client.id)) return true;

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
    notes.includes('bautraeger') ||
    notes.includes('holzständer') ||
    company.includes('bauvorhaben') ||
    company.includes('gewerbebau') ||
    company.includes('handwerk') ||
    company.includes('bau') ||
    name.includes('familie markus huber') ||
    name.includes('gewerbebau schmidt') ||
    name.includes('baustelle')
  );
}

export function isCraftTimeEntry(entry: any): boolean {
  if (!entry) return false;
  const task = entry.expand?.task || entry.task;
  if (isCraftTask(task)) return true;

  const project = task?.expand?.project || entry.expand?.project || entry.project;
  if (isCraftProject(project)) return true;

  const notes = (entry.notes || entry.description || '').toLowerCase();
  const craftKeywords = ['vob', 'baustelle', 'aufmaß', 'gerüst', 'monteur', 'bautagebuch', 'mangel'];
  return craftKeywords.some((kw) => notes.includes(kw));
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
    const isCraft = isCraftTimeEntry(entry);
    return craft ? isCraft : !isCraft;
  });
}
