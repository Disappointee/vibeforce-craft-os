import { getUserAuthPB, requireAuth, verifyUserSession, withAdminPB } from '@/lib/pocketbase-server';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ProjectDetailsClient } from './ProjectDetailsClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const isCraft = process.env.NEXT_PUBLIC_APP_MODE === 'craft';
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { title: `${isCraft ? 'Baustelle' : 'Projekt'} | ${isCraft ? 'Vibeforce Craft OS' : 'Vibeforce Flow OS'}` };
    }
    const project = await withAdminPB((pb) => pb.collection('projects').getOne(id));
    return { title: `${isCraft ? 'Baustelle' : 'Projekt'}: ${project.name} | ${isCraft ? 'Vibeforce Craft OS' : 'Vibeforce Flow OS'}` };
  } catch {
    return { title: `${isCraft ? 'Baustelle' : 'Projekt'} nicht gefunden` };
  }
}

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const userPb = await getUserAuthPB();
  if (!userPb) {
    redirect('/login');
  }

  const { id } = await params;

  let project: Record<string, unknown>;
  let tasks: Record<string, unknown>[] = [];
  let timeEntries: Record<string, unknown>[] = [];
  let expenses: Record<string, unknown>[] = [];
  let siteReports: Record<string, unknown>[] = [];
  let measurements: Record<string, unknown>[] = [];

  try {
    const loaded = await withAdminPB(async (pb) => {
      const proj = await pb.collection('projects').getOne(id);

      let loadedTasks: Record<string, unknown>[] = [];
      try {
        const tasksResult = await pb.collection('tasks').getList(1, 50, {
          filter: pb.filter('project = {:id}', { id }),
          sort: '-created',
          expand: 'assignees',
        });
        loadedTasks = tasksResult.items;
      } catch (err) {
        console.warn('[ProjectDetailsPage] Failed to fetch tasks:', err);
      }

      let loadedTimeEntries: Record<string, unknown>[] = [];
      const taskIds = loadedTasks.map((t: Record<string, unknown>) => t.id as string);
      if (taskIds.length > 0) {
        try {
          const timeResult = await pb.collection('time_entries').getList(1, 200, {
            filter: taskIds.map((tid: string) => pb.filter('task = {:id}', { id: tid })).join(' || '),
            sort: '-created',
          });
          loadedTimeEntries = timeResult.items;
        } catch (err) {
          console.warn('[ProjectDetailsPage] Failed to fetch time entries:', err);
        }
      }

      let loadedExpenses: Record<string, unknown>[] = [];
      try {
        const expensesResult = await pb.collection('external_expenses').getList(1, 100, {
          filter: pb.filter('project = {:id}', { id }),
          sort: '-created',
        });
        loadedExpenses = expensesResult.items;
      } catch {
        // external_expenses collection might not exist yet
      }

      let loadedSiteReports: Record<string, unknown>[] = [];
      try {
        const reportsResult = await pb.collection('site_reports').getList(1, 100, {
          filter: pb.filter('project = {:id}', { id }),
          sort: '-report_date',
          expand: 'author',
        });
        loadedSiteReports = reportsResult.items;
      } catch (err) {
        console.warn('[ProjectDetailsPage] Failed to fetch site reports:', err);
      }

      let loadedMeasurements: Record<string, unknown>[] = [];
      if (loadedSiteReports.length > 0) {
        try {
          const reportFilter = loadedSiteReports
            .map((r: Record<string, unknown>) => pb.filter('site_report = {:rid}', { rid: r.id }))
            .join(' || ');
          const measResult = await pb.collection('measurements').getFullList({
            filter: reportFilter,
            sort: '+position_nr',
          });
          loadedMeasurements = measResult;
        } catch (err) {
          console.warn('[ProjectDetailsPage] Failed to fetch measurements:', err);
        }
      }

      return { proj, loadedTasks, loadedTimeEntries, loadedExpenses, loadedSiteReports, loadedMeasurements };
    });

    project = loaded.proj;
    tasks = loaded.loadedTasks;
    timeEntries = loaded.loadedTimeEntries;
    expenses = loaded.loadedExpenses;
    siteReports = loaded.loadedSiteReports;
    measurements = loaded.loadedMeasurements;
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
      initialMeasurements={JSON.parse(JSON.stringify(measurements))}
    />
  );
}
