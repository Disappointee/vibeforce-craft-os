'use server';

import { withAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import {
  calculateProjectCostSummary,
  type CostRates,
  type ProjectCostSummary,
} from '@/lib/cost-calculation';
import type { ProjectRecord, SiteReportRecord, TimeEntryRecord } from '@/lib/pocketbase-types';

export async function getProjectCostSummaryAction(
  projectId: string,
  customRates?: Partial<CostRates>
): Promise<ProjectCostSummary> {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  return withAdminPB(async (pb) => {
    // 1. Projekt laden
    const project = (await pb.collection('projects').getOne(projectId)) as unknown as ProjectRecord;
    if (!project) {
      throw new Error(`Projekt mit ID '${projectId}' wurde nicht gefunden.`);
    }

    // 2. Tasks für dieses Projekt laden
    let taskIds: string[] = [];
    try {
      const tasksRes = await pb.collection('tasks').getList(1, 200, {
        filter: pb.filter('project = {:pid}', { pid: projectId }),
        fields: 'id',
      });
      taskIds = tasksRes.items.map((t) => t.id);
    } catch (err) {
      console.warn('[CostCalculation] Failed to load tasks:', err);
    }

    // 3. Zeiteinträge laden (Monteurstempelungen)
    let timeEntries: TimeEntryRecord[] = [];
    if (taskIds.length > 0) {
      try {
        // Parameterisierter PocketBase Filter für Tasks
        const filterParams: Record<string, string> = {};
        const filterExpr = taskIds
          .map((id, idx) => {
            const key = `tid${idx}`;
            filterParams[key] = id;
            return `task = {:${key}}`;
          })
          .join(' || ');
        const entriesRes = await pb.collection('time_entries').getList(1, 500, {
          filter: pb.filter(filterExpr, filterParams),
          expand: 'user,task',
        });
        timeEntries = entriesRes.items as unknown as TimeEntryRecord[];
      } catch (err) {
        console.warn('[CostCalculation] Failed to load time_entries:', err);
      }
    }

    // 4. Bautagesberichte laden (Regiestunden nach Qualifikation)
    let siteReports: SiteReportRecord[] = [];
    try {
      const reportsRes = await pb.collection('site_reports').getList(1, 200, {
        filter: pb.filter('project = {:pid}', { pid: projectId }),
      });
      siteReports = reportsRes.items as unknown as SiteReportRecord[];
    } catch (err) {
      console.warn('[CostCalculation] Failed to load site_reports:', err);
    }

    // 5. Gestellte Rechnungen laden
    let invoices: Array<{ net_total?: number; gross_total?: number }> = [];
    try {
      const invRes = await pb.collection('invoices_zugferd').getList(1, 100, {
        filter: pb.filter('project = {:pid}', { pid: projectId }),
        fields: 'net_total,gross_total',
      });
      invoices = invRes.items as unknown as Array<{ net_total?: number; gross_total?: number }>;
    } catch (err) {
      console.warn('[CostCalculation] Failed to load invoices:', err);
    }

    // 6. Kaufmännische Berechnung durchführen
    const summary = calculateProjectCostSummary({
      project,
      timeEntries,
      siteReports,
      invoices,
      customCostRates: customRates,
    });

    return JSON.parse(JSON.stringify(summary));
  });
}
