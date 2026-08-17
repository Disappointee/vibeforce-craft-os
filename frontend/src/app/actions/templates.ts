'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import type { ReportTemplateConfig, ReportTemplateRecord } from '@/lib/pocketbase-types';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function saveReportTemplate(data: {
  id?: string;
  name: string;
  config: ReportTemplateConfig;
}): Promise<ActionResult<ReportTemplateRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    if (!data.name?.trim()) {
      return { success: false, error: 'Vorlagenname ist erforderlich.' };
    }

    const pb = await getAdminPB();

    let record: ReportTemplateRecord;
    if (data.id) {
      record = await pb.collection('report_templates').update<ReportTemplateRecord>(data.id, {
        name: data.name.trim(),
        config: data.config,
      });
    } else {
      record = await pb.collection('report_templates').create<ReportTemplateRecord>({
        name: data.name.trim(),
        user: user.id as string,
        config: data.config,
      });
    }

    revalidatePath('/reports');
    revalidatePath('/dashboard/reports');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Speichern der Berichtsvorlage';
    return { success: false, error: message };
  }
}

export async function deleteReportTemplate(templateId: string): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    await pb.collection('report_templates').delete(templateId);

    revalidatePath('/reports');
    revalidatePath('/dashboard/reports');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Löschen der Berichtsvorlage';
    return { success: false, error: message };
  }
}
