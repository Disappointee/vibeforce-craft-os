import { getAdminPB } from '@/lib/pocketbase-server';
import { TasksPageClient } from './TasksPageClient';
import type { ProjectRecord, UserRecord, ClientRecord } from '@/lib/pocketbase-types';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const pb = await getAdminPB();
  let projects: ProjectRecord[] = [];
  let users: UserRecord[] = [];
  let clients: ClientRecord[] = [];

  try {
    const [projResult, usersResult, clientsResult] = await Promise.all([
      pb.collection('projects').getList(1, 50, { sort: 'name' }),
      pb.collection('users').getList(1, 50, { sort: 'name' }),
      pb.collection('clients').getList(1, 50, { sort: 'name' }),
    ]);
    projects = projResult.items as ProjectRecord[];
    users = usersResult.items as UserRecord[];
    clients = clientsResult.items as ClientRecord[];
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
  }

  return <TasksPageClient initialProjects={projects} initialUsers={users} initialClients={clients} />;
}
