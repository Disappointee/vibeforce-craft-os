import { getAdminPB } from '@/lib/pocketbase-server';
import { ProjectsPageClient } from './ProjectsPageClient';
import type { ClientRecord } from '@/lib/pocketbase-types';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const pb = await getAdminPB();
  let clients: ClientRecord[] = [];
  try {
    const result = await pb.collection('clients').getList(1, 50, { sort: 'name' });
    clients = result.items as ClientRecord[];
  } catch {
    // Clients filter gracefully hidden when empty
  }

  return <ProjectsPageClient initialClients={clients} />;
}
