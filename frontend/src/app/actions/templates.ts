'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import type { ReportTemplateConfig } from '@/lib/pocketbase-types';

export async function createTemplateAction(data: {
  name: string;
  config: ReportTemplateConfig;
}) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  const record = await pb.collection('report_templates').create({
    name: data.name,
    user: user.id,
    config: data.config,
  });

  revalidatePath('/dashboard/reports');
  return JSON.parse(JSON.stringify(record));
}

export async function deleteTemplateAction(templateId: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  await pb.collection('report_templates').delete(templateId);

  revalidatePath('/dashboard/reports');
  return { success: true };
}
