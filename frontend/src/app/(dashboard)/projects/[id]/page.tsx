import { getAdminPB } from '@/lib/pocketbase-server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ProjectDetailsClient } from './ProjectDetailsClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const pb = await getAdminPB();
    const project = await pb.collection('projects').getOne(id);
    return { title: `Projekt: ${project.name} | Vibeforce Flow OS` };
  } catch {
    return { title: 'Projekt nicht gefunden | Vibeforce Flow OS' };
  }
}

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pb = await getAdminPB();

  let project: Record<string, unknown>;
  try {
    project = await pb.collection('projects').getOne(id);
  } catch {
    notFound();
  }

  const tasksResult = await pb.collection('tasks').getList(1, 50, {
    filter: pb.filter('project = {:id}', { id }),
    sort: '-created',
    expand: 'assignees',
  });
  const tasks = tasksResult.items;

  const taskIds = tasks.map((t: Record<string, unknown>) => t.id as string);
  let timeEntries: Record<string, unknown>[] = [];
  if (taskIds.length > 0) {
    const timeResult = await pb.collection('time_entries').getList(1, 200, {
      filter: taskIds.map((tid: string) => pb.filter('task = {:id}', { id: tid })).join(' || '),
      sort: '-created',
    });
    timeEntries = timeResult.items;
  }

  let expenses: Record<string, unknown>[] = [];
  try {
    const expensesResult = await pb.collection('external_expenses').getList(1, 100, {
      filter: pb.filter('project = {:id}', { id }),
      sort: '-created',
    });
    expenses = expensesResult.items;
  } catch {
    // external_expenses collection might not exist yet
  }

  return (
    <ProjectDetailsClient
      id={id}
      initialProject={JSON.parse(JSON.stringify(project))}
      initialTasks={JSON.parse(JSON.stringify(tasks))}
      initialTimeEntries={JSON.parse(JSON.stringify(timeEntries))}
      initialExpenses={JSON.parse(JSON.stringify(expenses))}
    />
  );
}
