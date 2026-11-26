import { redirect } from 'next/navigation';
import { getUserAuthPB, requireAuth, withAdminPB } from '@/lib/pocketbase-server';
import { CraftHubClient } from './CraftHubClient';
import type { ProjectRecord, SiteReportRecord, TimeEntryRecord } from '@/lib/pocketbase-types';

export const dynamic = 'force-dynamic';

export default async function CraftPage() {
  await requireAuth();
  const userPb = await getUserAuthPB();
  if (!userPb) {
    redirect('/login');
  }

  let projects: ProjectRecord[] = [];
  let reports: SiteReportRecord[] = [];
  let invoices: any[] = [];
  let timeEntries: TimeEntryRecord[] = [];

  try {
    const data = await withAdminPB(async (pb) => {
      let loadedProjects: ProjectRecord[] = [];
      let loadedReports: SiteReportRecord[] = [];
      let loadedInvoices: any[] = [];
      let loadedTimeEntries: TimeEntryRecord[] = [];

      // Fetch craft projects (Baustellen) exclusively
      try {
        const projRes = await pb.collection('projects').getList(1, 100, {
          sort: '-created',
          filter: 'project_type = "craft" || key ~ "BAU" || key ~ "CRAFT"',
          expand: 'client,site_manager',
        });
        loadedProjects = JSON.parse(JSON.stringify(projRes.items)) as ProjectRecord[];
      } catch {
        const projRes = await pb.collection('projects').getList(1, 50, {
          sort: '-created',
          expand: 'client',
        });
        loadedProjects = (JSON.parse(JSON.stringify(projRes.items)) as ProjectRecord[]).filter(
          (p) => p.project_type === 'craft' || p.key?.includes('BAU') || p.key?.includes('CRAFT')
        );
      }

      // Fetch site reports
      try {
        const repRes = await pb.collection('site_reports').getList(1, 100, {
          sort: '-report_date',
          expand: 'project,author',
        });
        loadedReports = JSON.parse(JSON.stringify(repRes.items)) as SiteReportRecord[];
      } catch {
        try {
          const repRes = await pb.collection('site_reports').getList(1, 100, {
            expand: 'project,author',
          });
          loadedReports = JSON.parse(JSON.stringify(repRes.items)) as SiteReportRecord[];
        } catch {
          loadedReports = [];
        }
      }

      // Fetch invoices
      try {
        const invRes = await pb.collection('invoices_zugferd').getList(1, 50, {
          sort: '-created',
          expand: 'project',
        });
        loadedInvoices = JSON.parse(JSON.stringify(invRes.items)) as any[];
      } catch {
        loadedInvoices = [];
      }

      // Fetch time entries
      try {
        const timeRes = await pb.collection('time_entries').getList(1, 100, {
          sort: '-start_time',
          expand: 'task,user',
        });
        loadedTimeEntries = JSON.parse(JSON.stringify(timeRes.items)) as TimeEntryRecord[];
      } catch {
        loadedTimeEntries = [];
      }

      return { loadedProjects, loadedReports, loadedInvoices, loadedTimeEntries };
    });

    projects = data.loadedProjects;
    reports = data.loadedReports;
    invoices = data.loadedInvoices;
    timeEntries = data.loadedTimeEntries;
  } catch (error) {
    console.warn('[CraftPage] Failed to fetch craft data:', error);
  }

  return (
    <CraftHubClient
      initialProjects={projects}
      initialReports={reports}
      initialInvoices={invoices}
      initialTimeEntries={timeEntries}
    />
  );
}
