'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';

export async function createReportAction(data: {
  timeEntry: string;
  title: string;
  content: string;
  filename: string;
}) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();

  const formData = new FormData();
  formData.append('time_entry', data.timeEntry);
  formData.append('file', new Blob([data.content], { type: 'text/markdown' }), data.filename);
  formData.append('title', data.title);
  formData.append('size', String(new Blob([data.content]).size));

  const record = await pb.collection('time_entry_reports').create(formData);

  revalidatePath('/dashboard/time');
  return JSON.parse(JSON.stringify(record));
}
