import { getAdminPB } from '@/lib/pocketbase-server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ClientDetailsClient } from './ClientDetailsClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const pb = await getAdminPB();
    const client = await pb.collection('clients').getOne(id);
    return { title: `Kunde: ${client.name} | Vibeforce Flow OS` };
  } catch {
    return { title: 'Kunde nicht gefunden | Vibeforce Flow OS' };
  }
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pb = await getAdminPB();

  let client: Record<string, unknown>;
  try {
    client = await pb.collection('clients').getOne(id, {
      expand: 'betreuer,beobachter',
    });
  } catch {
    notFound();
  }

  const [usersResult, projectsResult] = await Promise.all([
    pb.collection('users').getList(1, 200, { sort: 'name' }),
    pb.collection('projects').getList(1, 50, {
      filter: pb.filter('client = {:id}', { id }),
      sort: 'name',
    }),
  ]);

  const users = usersResult.items;
  const projectsData = projectsResult.items;
  const projectIds = projectsData.map((p: Record<string, unknown>) => p.id as string);

  let allTasks: Record<string, unknown>[] = [];
  let allTimeEntries: Record<string, unknown>[] = [];

  if (projectIds.length > 0) {
    const allTasksFilter = projectIds.map((pid: string) => pb.filter('project = {:pid}', { pid })).join(' || ');
    const allTasksResult = await pb.collection('tasks').getList(1, 500, {
      filter: allTasksFilter,
      sort: 'title',
    });
    allTasks = allTasksResult.items;

    const allTaskIds = allTasks.map((t: Record<string, unknown>) => t.id as string);
    if (allTaskIds.length > 0) {
      const timeFilter = allTaskIds.map((tid: string) => pb.filter('task = {:tid}', { tid })).join(' || ');
      const timeResult = await pb.collection('time_entries').getList(1, 500, {
        filter: timeFilter,
      });
      allTimeEntries = timeResult.items;
    }
  }

  // Fetch all files in parallel
  const allFiles: Record<string, unknown>[] = [];

  try {
    const clientFilesResult = await pb.collection('client_files').getList(1, 50, {
      filter: pb.filter('client = {:id}', { id }),
      sort: '-created',
    });
    for (const f of clientFilesResult.items as Record<string, unknown>[]) {
      allFiles.push({
        ...f,
        _source: 'client',
        _sourceName: 'Kundendateien',
      });
    }
  } catch {
    // client_files collection might not exist
  }

  const fileQueries: Promise<{ items: Record<string, unknown>[] }>[] = [];

  if (projectIds.length > 0) {
    const projFilter = projectIds.map((pid: string) => pb.filter('project = {:pid}', { pid })).join(' || ');
    fileQueries.push(
      pb.collection('project_files').getList(1, 50, { filter: projFilter, sort: '-created' })
        .catch(() => ({ items: [] }))
    );
  }

  const allTaskIds2 = allTasks.map((t: Record<string, unknown>) => t.id as string);
  if (allTaskIds2.length > 0) {
    const taskFilter = allTaskIds2.map((tid: string) => pb.filter('task = {:tid}', { tid })).join(' || ');
    fileQueries.push(
      pb.collection('task_files').getList(1, 50, { filter: taskFilter, sort: '-created' })
        .catch(() => ({ items: [] }))
    );
  }

  if (fileQueries.length > 0) {
    const results = await Promise.all(fileQueries);

    const projIdx = projectIds.length > 0 ? 0 : -1;
    const taskIdx = projectIds.length > 0 ? 1 : 0;

    if (projIdx >= 0 && results[projIdx]?.items) {
      for (const f of results[projIdx].items) {
        const pName = projectsData.find((p: Record<string, unknown>) => p.id === f.project)?.name || 'Projekt';
        allFiles.push({ ...f, _source: 'project', _sourceName: pName });
      }
    }

    if (results[taskIdx]?.items) {
      for (const f of results[taskIdx].items) {
        const parentTask = allTasks.find((t: Record<string, unknown>) => t.id === f.task);
        const parentProject = parentTask
          ? projectsData.find((p: Record<string, unknown>) => p.id === (parentTask as any).project)
          : undefined;
        const sourceName = parentProject && parentTask
          ? `${(parentProject as any).name} / ${(parentTask as any).title}`
          : 'Task-Datei';
        allFiles.push({ ...f, _source: 'task', _sourceName: sourceName });
      }
    }
  }

  allFiles.sort((a, b) => new Date((b as any).created).getTime() - new Date((a as any).created).getTime());

  return (
    <ClientDetailsClient
      id={id}
      initialClient={JSON.parse(JSON.stringify(client))}
      initialUsers={JSON.parse(JSON.stringify(users))}
      initialProjects={JSON.parse(JSON.stringify(projectsData))}
      initialTasks={JSON.parse(JSON.stringify(allTasks))}
      initialTimeEntries={JSON.parse(JSON.stringify(allTimeEntries))}
      initialFiles={JSON.parse(JSON.stringify(allFiles))}
    />
  );
}
