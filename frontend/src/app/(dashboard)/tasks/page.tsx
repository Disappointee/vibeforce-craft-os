import { getAdminPB } from '@/lib/pocketbase-server';
import { TasksPageClient } from './TasksPageClient';
import type { ProjectRecord, UserRecord, ClientRecord } from '@/lib/pocketbase-types';
import { filterProjectsByMode, filterClientsByMode } from '@/lib/data-isolation';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  let projects: ProjectRecord[] = [];
  let users: UserRecord[] = [];
  let clients: ClientRecord[] = [];

  try {
    const pb = await getAdminPB();
    const [projResult, usersResult, clientsResult] = await Promise.all([
      pb.collection('projects').getList(1, 50, { sort: 'name' }),
      pb.collection('users').getList(1, 50, { sort: 'name' }),
      pb.collection('clients').getList(1, 50, { sort: 'name' }),
    ]);
    projects = filterProjectsByMode(projResult.items as ProjectRecord[]);
    users = usersResult.items as UserRecord[];
    clients = filterClientsByMode(clientsResult.items as ClientRecord[]);
  } catch (error) {
    console.warn('[TasksPage] Failed to prefetch filter options:', error);
  }

  return <TasksPageClient initialProjects={projects} initialUsers={users} initialClients={clients} />;
}
