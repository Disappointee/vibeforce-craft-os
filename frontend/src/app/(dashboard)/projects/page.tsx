import { getAdminPB } from '@/lib/pocketbase-server';
import { ProjectsPageClient } from './ProjectsPageClient';
import type { ClientRecord } from '@/lib/pocketbase-types';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  let clients: ClientRecord[] = [];
  try {
    const pb = await getAdminPB();
    const result = await pb.collection('clients').getList(1, 50, { sort: 'name' });
    clients = result.items as ClientRecord[];
  } catch (error) {
    console.warn('[ProjectsPage] Failed to prefetch clients:', error);
  }

  return <ProjectsPageClient initialClients={clients} />;
}
