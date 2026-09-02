import { getAdminPB } from '@/lib/pocketbase-server';
import { CraftHubClient } from './CraftHubClient';
import type { ProjectRecord, SiteReportRecord } from '@/lib/pocketbase-types';

export const dynamic = 'force-dynamic';

export default async function CraftPage() {
  let projects: ProjectRecord[] = [];
  let reports: SiteReportRecord[] = [];
  let invoices: any[] = [];

  try {
    const pb = await getAdminPB();
    
    // Fetch projects
    const projRes = await pb.collection('projects').getList(1, 50, {
      sort: '-created',
      expand: 'client',
    });
    projects = projRes.items as unknown as ProjectRecord[];

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
  } catch (error) {
    console.warn('[CraftPage] Failed to fetch craft data:', error);
  }

  return (
    <CraftHubClient
      initialProjects={projects}
      initialReports={reports}
      initialInvoices={invoices}
    />
  );
}
