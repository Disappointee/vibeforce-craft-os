import { redirect } from 'next/navigation';
import { getUserAuthPB, requireAuth } from '@/lib/pocketbase-server';
import { ProjectsPageClient } from './ProjectsPageClient';
import type { ClientRecord } from '@/lib/pocketbase-types';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  await requireAuth();
  const pb = await getUserAuthPB();
  if (!pb) {
    redirect('/login');
  }

  let clients: ClientRecord[] = [];
  try {
    const result = await pb.collection('clients').getList(1, 50, { sort: 'name' });
    clients = result.items as ClientRecord[];
  } catch (error) {
    console.warn('[ProjectsPage] Failed to prefetch clients:', error);
  }

  return <ProjectsPageClient initialClients={clients} />;
}
