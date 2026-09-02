'use server';

import { revalidatePath } from 'next/cache';
import { withAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import { z } from 'zod';
import type { SiteReportRecord } from '@/lib/pocketbase-types';

const CreateSiteReportSchema = z.object({
  project: z.string().min(1, 'Projekt-ID ist erforderlich'),
  report_date: z.string().min(1, 'Berichtsdatum ist erforderlich'),
  status: z.enum(['draft', 'signed', 'invoiced']).optional().default('draft'),
  weather: z.string().optional(),
  temperature: z.number().optional(),
  work_performed: z.string().optional(),
  special_events: z.string().optional(),
  qualification_hours: z.record(z.string(), z.number()).optional(),
  client_name: z.string().optional(),
  client_signature: z.string().optional(),
  client_signed_at: z.string().optional(),
  contractor_signature: z.string().optional(),
  contractor_signed_at: z.string().optional(),
});

const UpdateSiteReportSchema = CreateSiteReportSchema.partial();

export type CreateSiteReportInput = z.infer<typeof CreateSiteReportSchema>;
export type UpdateSiteReportInput = z.infer<typeof UpdateSiteReportSchema>;

export async function createSiteReportAction(data: CreateSiteReportInput) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = CreateSiteReportSchema.parse(data);

  return withAdminPB(async (pb) => {
    const record = await pb.collection('site_reports').create({
      ...validated,
      author: user.id,
    });

    revalidatePath(`/projects/${validated.project}/site-reports`);
    revalidatePath('/craft');
    return JSON.parse(JSON.stringify(record)) as SiteReportRecord;
  });
}

export async function updateSiteReportAction(reportId: string, data: UpdateSiteReportInput) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = UpdateSiteReportSchema.parse(data);

  return withAdminPB(async (pb) => {
    const existing = await pb.collection('site_reports').getOne(reportId);
    if (existing.status === 'invoiced') {
      throw new Error('Dieser Bautagesbericht wurde bereits abgerechnet und ist schreibgeschützt (GoBD-Sperre).');
    }

    const record = await pb.collection('site_reports').update(reportId, validated);
    if (record.project) {
      revalidatePath(`/projects/${record.project}/site-reports`);
    }
    revalidatePath('/craft');
    return JSON.parse(JSON.stringify(record)) as SiteReportRecord;
  });
}

export async function signSiteReportAction(
  reportId: string,
  clientName: string,
  clientSignatureDataUrl: string
) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  return withAdminPB(async (pb) => {
    const record = await pb.collection('site_reports').update(reportId, {
      status: 'signed',
      client_name: clientName,
      client_signature: clientSignatureDataUrl,
      client_signed_at: new Date().toISOString(),
    });

    if (record.project) {
      revalidatePath(`/projects/${record.project}/site-reports`);
    }
    return JSON.parse(JSON.stringify(record)) as SiteReportRecord;
  });
}

export async function getSiteReportsByProjectAction(projectId: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  return withAdminPB(async (pb) => {
    const records = await pb.collection('site_reports').getFullList({
      filter: pb.filter('project = {:projectId}', { projectId }),
      sort: '-report_date',
      expand: 'author,measurements(site_report),evidence_items(site_report)',
    });

    return JSON.parse(JSON.stringify(records)) as SiteReportRecord[];
  });
}
