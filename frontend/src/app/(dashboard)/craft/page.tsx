import { getAdminPB } from '@/lib/pocketbase-server';
import { CraftHubClient } from './CraftHubClient';
import type { ProjectRecord, SiteReportRecord, TimeEntryRecord } from '@/lib/pocketbase-types';

export const dynamic = 'force-dynamic';

export default async function CraftPage() {
  let projects: ProjectRecord[] = [];
  let reports: SiteReportRecord[] = [];
  let invoices: any[] = [];
  let timeEntries: TimeEntryRecord[] = [];

  try {
    const pb = await getAdminPB();
    
    // Fetch craft projects (Baustellen) exclusively
    try {
      const projRes = await pb.collection('projects').getList(1, 100, {
        sort: '-created',
        filter: 'project_type = "craft" || key ~ "BAU" || key ~ "CRAFT"',
        expand: 'client,site_manager',
      });
      projects = projRes.items as unknown as ProjectRecord[];
    } catch {
      const projRes = await pb.collection('projects').getList(1, 50, {
        sort: '-created',
        expand: 'client',
      });
      projects = (projRes.items as unknown as ProjectRecord[]).filter(
        (p) => p.project_type === 'craft' || p.key?.includes('BAU') || p.key?.includes('CRAFT')
      );
    }

    // Fetch site reports
    try {
      const repRes = await pb.collection('site_reports').getList(1, 50, {
        sort: '-report_date',
        expand: 'project,author',
      });
      reports = repRes.items as unknown as SiteReportRecord[];
    } catch {
      reports = [];
    }

    // Fetch invoices
    try {
      const invRes = await pb.collection('invoices_zugferd').getList(1, 50, {
        sort: '-created',
        expand: 'project',
      });
      invoices = invRes.items as unknown as any[];
    } catch {
      invoices = [];
    }

    // Fetch time entries
    try {
      const timeRes = await pb.collection('time_entries').getList(1, 100, {
        sort: '-start_time',
        expand: 'task,user',
      });
      timeEntries = timeRes.items as unknown as TimeEntryRecord[];
    } catch {
      timeEntries = [];
    }
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
