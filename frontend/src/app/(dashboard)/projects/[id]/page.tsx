import { getUserAuthPB, requireAuth, verifyUserSession } from '@/lib/pocketbase-server';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ProjectDetailsClient } from './ProjectDetailsClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const isCraft = process.env.NEXT_PUBLIC_APP_MODE === 'craft';
  try {
    const user = await verifyUserSession();
    const pb = user ? await getUserAuthPB() : null;
    if (!pb) {
      return { title: `${isCraft ? 'Baustelle' : 'Projekt'} | ${isCraft ? 'Vibeforce Craft OS' : 'Vibeforce Flow OS'}` };
    }
    const project = await pb.collection('projects').getOne(id);
    return { title: `${isCraft ? 'Baustelle' : 'Projekt'}: ${project.name} | ${isCraft ? 'Vibeforce Craft OS' : 'Vibeforce Flow OS'}` };
  } catch {
    return { title: `${isCraft ? 'Baustelle' : 'Projekt'} nicht gefunden` };
  }
}

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const pb = await getUserAuthPB();
  if (!pb) {
    redirect('/login');
  }

  const { id } = await params;

  let project: Record<string, unknown>;
  let tasks: Record<string, unknown>[] = [];
  let timeEntries: Record<string, unknown>[] = [];
  let expenses: Record<string, unknown>[] = [];
  let siteReports: Record<string, unknown>[] = [];

  try {

    try {
      project = await pb.collection('projects').getOne(id);
    } catch {
      notFound();
    }

    try {
      const tasksResult = await pb.collection('tasks').getList(1, 50, {
        filter: pb.filter('project = {:id}', { id }),
        sort: '-created',
        expand: 'assignees',
      });
      tasks = tasksResult.items;
    } catch (err) {
      console.warn('[ProjectDetailsPage] Failed to fetch tasks:', err);
    }

    const taskIds = tasks.map((t: Record<string, unknown>) => t.id as string);
    if (taskIds.length > 0) {
      try {
        const timeResult = await pb.collection('time_entries').getList(1, 200, {
          filter: taskIds.map((tid: string) => pb.filter('task = {:id}', { id: tid })).join(' || '),
          sort: '-created',
        });
        timeEntries = timeResult.items;
      } catch (err) {
        console.warn('[ProjectDetailsPage] Failed to fetch time entries:', err);
      }
    }

    try {
      const expensesResult = await pb.collection('external_expenses').getList(1, 100, {
        filter: pb.filter('project = {:id}', { id }),
        sort: '-created',
      });
      expenses = expensesResult.items;
    } catch {
      // external_expenses collection might not exist yet
    }

    try {
      const reportsResult = await pb.collection('site_reports').getList(1, 100, {
        filter: pb.filter('project = {:id}', { id }),
        sort: '-report_date',
        expand: 'author',
      });
      siteReports = reportsResult.items;
    } catch (err) {
      console.warn('[ProjectDetailsPage] Failed to fetch site reports:', err);
    }
  } catch (outerErr) {
    console.error('[ProjectDetailsPage] Critical error initializing project page:', outerErr);
    notFound();
  }

  return (
    <ProjectDetailsClient
      id={id}
      initialProject={JSON.parse(JSON.stringify(project))}
      initialTasks={JSON.parse(JSON.stringify(tasks))}
      initialTimeEntries={JSON.parse(JSON.stringify(timeEntries))}
      initialExpenses={JSON.parse(JSON.stringify(expenses))}
      initialSiteReports={JSON.parse(JSON.stringify(siteReports))}
    />
  );
}
