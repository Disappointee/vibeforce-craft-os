'use server';

import { revalidatePath } from 'next/cache';
import { withAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import { z } from 'zod';
import type { SiteReportRecord } from '@/lib/pocketbase-types';
import { createHash } from 'node:crypto';

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
  signature_manifest: z.string().optional(),
  signature_strokes: z.array(z.array(z.array(z.number()))).optional(),
  gps_lat: z.number().optional(),
  gps_lon: z.number().optional(),
  gps_accuracy: z.number().optional(),
  is_regie_extra: z.boolean().optional(),
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

function buildAddendumPayload(
  existing: any,
  validated: z.infer<typeof UpdateSiteReportSchema>,
  userId: string,
  type: 'invoiced' | 'signed'
) {
  const prefix =
    type === 'invoiced'
      ? `[NACHTRAG zu abgerechnetem Bericht #${existing.id}]:`
      : `[NACHTRAG zu signiertem Bericht #${existing.id}]:`;
  return {
    project: existing.project,
    report_date: existing.report_date,
    status: 'draft' as const,
    weather: validated.weather || existing.weather,
    temperature: validated.temperature ?? existing.temperature,
    work_performed: `${prefix}\n${validated.work_performed || ''}`,
    special_events: validated.special_events ?? existing.special_events,
    qualification_hours: validated.qualification_hours ?? existing.qualification_hours,
    client_name: validated.client_name || existing.client_name,
    author: userId,
  };
}

export async function updateSiteReportAction(reportId: string, data: UpdateSiteReportInput) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = UpdateSiteReportSchema.parse(data);

  return withAdminPB(async (pb) => {
    const existing = await pb.collection('site_reports').getOne(reportId) as SiteReportRecord;
    if (existing.status === 'invoiced' || existing.status === 'signed') {
      const addendumRecord = await pb.collection('site_reports').create(
        buildAddendumPayload(existing, validated, String(user.id), existing.status)
      );

      if (existing.project) {
        revalidatePath(`/projects/${existing.project}/site-reports`);
      }
      revalidatePath('/craft');
      return JSON.parse(JSON.stringify(addendumRecord)) as SiteReportRecord;
    }

    const record = await pb.collection('site_reports').update(reportId, validated);
    if (record.project) {
      revalidatePath(`/projects/${record.project}/site-reports`);
    }
    revalidatePath('/craft');
    return JSON.parse(JSON.stringify(record)) as SiteReportRecord;
  });
}

export async function createReportRevisionAction(reportId: string, reason: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');
  if (!reason.trim()) throw new Error('Ein Begründungstext für die GoBD-Revision ist erforderlich.');

  return withAdminPB(async (pb) => {
    const existing = await pb.collection('site_reports').getOne(reportId) as SiteReportRecord;

    // GoBD-Klon: Neuer Entwurf mit Verweis auf den Ursprungsbericht
    const revision = await pb.collection('site_reports').create({
      project: existing.project,
      report_date: existing.report_date,
      status: 'draft',
      weather: existing.weather,
      temperature: existing.temperature,
      work_performed: existing.work_performed,
      special_events: `[REVISION zu Bericht #${reportId} | Grund: ${reason.trim()}]:\n${existing.special_events || ''}`,
      qualification_hours: existing.qualification_hours,
      client_name: existing.client_name,
      author: user.id,
    });

    if (existing.project) {
      revalidatePath(`/projects/${existing.project}/site-reports`);
    }
    revalidatePath('/craft');
    return JSON.parse(JSON.stringify(revision)) as SiteReportRecord;
  });
}

export async function signSiteReportAction(
  reportId: string,
  clientName: string,
  clientSignatureDataUrl: string,
  telemetry?: { strokes?: number[][][]; gpsLat?: number; gpsLon?: number; gpsAccuracy?: number }
) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  return withAdminPB(async (pb) => {
    const existing = await pb.collection('site_reports').getOne(reportId) as SiteReportRecord;
    if (existing.status === 'invoiced') {
      throw new Error('Dieser Bautagesbericht wurde bereits abgerechnet und ist schreibgeschützt (GoBD-Sperre).');
    }
    if (existing.status === 'signed') {
      throw new Error('Dieser Bautagesbericht wurde bereits signiert und ist schreibgeschützt (GoBD-Sperre / VOB/B § 15). Ein Nachtrag muss als neuer Bericht angelegt werden.');
    }

    const signedAt = new Date().toISOString();
    const strokes = telemetry?.strokes ?? [];
    const gpsLat = telemetry?.gpsLat ?? null;
    const gpsLon = telemetry?.gpsLon ?? null;
    const gpsAccuracy = telemetry?.gpsAccuracy ?? null;

    // Cryptographic sealing of report content (GoBD tamper evidence)
    const contentPayload = JSON.stringify({
      reportDate: existing.report_date,
      workPerformed: existing.work_performed || '',
      specialEvents: existing.special_events || '',
      qualificationHours: existing.qualification_hours || {},
      temperature: existing.temperature ?? null,
      weather: existing.weather || '',
    });
    const contentHash = createHash('sha256').update(contentPayload).digest('hex');

    const manifestPayload = JSON.stringify({
      reportId,
      contentHash,
      clientName,
      clientSignatureDataUrl,
      strokes,
      signedAt,
      gpsLat,
      gpsLon,
      gpsAccuracy,
    });
    const hash = createHash('sha256').update(manifestPayload).digest('hex');

    const signature_manifest = JSON.stringify({
      algorithm: 'SHA-256',
      hash,
      contentHash,
      signedAt,
      gpsLat,
      gpsLon,
      gpsAccuracy,
      strokesCount: strokes.length,
    });

    const updatePayload: Record<string, any> = {
      status: 'signed',
      client_name: clientName,
      client_signature: clientSignatureDataUrl,
      client_signed_at: signedAt,
      signature_manifest,
      gps_lat: gpsLat,
      gps_lon: gpsLon,
      gps_accuracy: gpsAccuracy,
    };

    if (strokes.length > 0) {
      updatePayload.signature_strokes = strokes;
    }

    const record = await pb.collection('site_reports').update(reportId, updatePayload);

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
