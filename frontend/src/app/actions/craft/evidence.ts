'use server';

import { revalidatePath } from 'next/cache';
import { withAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import type { EvidenceItemRecord } from '@/lib/pocketbase-types';

export interface CreateEvidenceItemInput {
  site_report: string;
  file?: File;
  caption?: string;
  sha256_hash?: string;
  taken_at?: string;
  gps_lat?: number;
  gps_lon?: number;
}

export async function createEvidenceItemAction(input: CreateEvidenceItemInput | FormData) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  return withAdminPB(async (pb) => {
    let siteReportId: string;
    let file: File | undefined;
    let caption: string | undefined;
    let sha256Hash: string | undefined;
    let takenAt: string | undefined;
    let gpsLat: number | undefined;
    let gpsLon: number | undefined;

    if (input instanceof FormData) {
      siteReportId = input.get('site_report') as string;
      file = input.get('image') as File;
      caption = (input.get('caption') as string) || undefined;
      sha256Hash = (input.get('sha256_hash') as string) || undefined;
      takenAt = (input.get('taken_at') as string) || undefined;
      const latStr = input.get('gps_lat') as string;
      const lonStr = input.get('gps_lon') as string;
      gpsLat = latStr ? parseFloat(latStr) : undefined;
      gpsLon = lonStr ? parseFloat(lonStr) : undefined;
    } else {
      siteReportId = input.site_report;
      file = input.file;
      caption = input.caption;
      sha256Hash = input.sha256_hash;
      takenAt = input.taken_at;
      gpsLat = input.gps_lat;
      gpsLon = input.gps_lon;
    }

    if (!siteReportId) {
      throw new Error('site_report ID ist erforderlich.');
    }

    // GoBD Status Check on parent site_report
    const parentReport = await pb.collection('site_reports').getOne(siteReportId);
    if (parentReport.status === 'invoiced') {
      throw new Error('Fotos können nicht zu einem bereits abgerechneten Bericht hinzugefügt werden (GoBD-Sperre).');
    }

    const payload = new FormData();
    payload.append('site_report', siteReportId);
    if (file) {
      payload.append('image', file);
    }
    if (caption) payload.append('caption', caption);
    if (sha256Hash) payload.append('sha256_hash', sha256Hash);
    if (takenAt) payload.append('taken_at', takenAt);
    if (gpsLat !== undefined && !isNaN(gpsLat)) payload.append('gps_lat', String(gpsLat));
    if (gpsLon !== undefined && !isNaN(gpsLon)) payload.append('gps_lon', String(gpsLon));

    const record = await pb.collection('evidence_items').create(payload);

    if (parentReport.project) {
      revalidatePath(`/projects/${parentReport.project}/site-reports`);
    }
    revalidatePath('/craft');

    return JSON.parse(JSON.stringify(record)) as EvidenceItemRecord;
  });
}

export async function getEvidenceItemsByReportAction(siteReportId: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  return withAdminPB(async (pb) => {
    const records = await pb.collection('evidence_items').getFullList({
      filter: pb.filter('site_report = {:siteReportId}', { siteReportId }),
      sort: '+created',
    });

    return JSON.parse(JSON.stringify(records)) as EvidenceItemRecord[];
  });
}
