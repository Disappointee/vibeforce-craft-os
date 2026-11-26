'use server';

import { revalidatePath } from 'next/cache';
import { getUserAuthPB, verifyUserSession } from '@/lib/pocketbase-server';
import { z } from 'zod';
import type { MeasurementRecord } from '@/lib/pocketbase-types';

const CreateMeasurementSchema = z.object({
  site_report: z.string().min(1, 'Berichts-ID ist erforderlich'),
  position_nr: z.string().optional().default('01'),
  title: z.string().min(1, 'Titel / Leistung ist erforderlich'),
  formula: z.string().optional(),
  quantity: z.number().min(0, 'Menge muss >= 0 sein').default(0),
  unit: z.enum(['m', 'm2', 'm3', 'h', 'stk', 'kg', 'psch']).default('m2'),
  unit_price: z.number().min(0).optional().default(0),
  total_price: z.number().min(0).optional().default(0),
  tax_rate_type: z.enum(['standard_19', 'reverse_charge_13b', 'reduced_7', 'zero_0']).optional().default('reverse_charge_13b'),
  notes: z.string().optional(),
});

const UpdateMeasurementSchema = CreateMeasurementSchema.partial();

export type CreateMeasurementInput = z.input<typeof CreateMeasurementSchema>;
export type UpdateMeasurementInput = z.input<typeof UpdateMeasurementSchema>;

export async function createMeasurementAction(data: CreateMeasurementInput) {
  const user = await verifyUserSession();
  const pb = await getUserAuthPB();
  if (!user || !pb) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = CreateMeasurementSchema.parse(data);
  const qty = validated.quantity || 0;
  const price = validated.unit_price || 0;
  const calculatedTotal = Math.round(qty * price * 100) / 100;

  // GoBD Protection: Parent site_report must not be signed or invoiced
  const parentReport = await pb.collection('site_reports').getOne(validated.site_report);
  if (parentReport.status === 'signed' || parentReport.status === 'invoiced') {
    throw new Error('Mutation von Aufmaßzeilen auf signierten oder abgerechneten Bautagesberichten ist unzulässig (GoBD-Sperre).');
  }

  const record = await pb.collection('measurements').create({
    ...validated,
    total_price: calculatedTotal,
  });

  revalidatePath('/craft');
  return JSON.parse(JSON.stringify(record)) as MeasurementRecord;
}

export async function updateMeasurementAction(measurementId: string, data: UpdateMeasurementInput) {
  const user = await verifyUserSession();
  const pb = await getUserAuthPB();
  if (!user || !pb) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = UpdateMeasurementSchema.parse(data);

  const existing = await pb.collection('measurements').getOne(measurementId);
  if (existing.site_report) {
    const parentReport = await pb.collection('site_reports').getOne(existing.site_report);
    if (parentReport.status === 'signed' || parentReport.status === 'invoiced') {
      throw new Error('Mutation von Aufmaßzeilen auf signierten oder abgerechneten Bautagesberichten ist unzulässig (GoBD-Sperre).');
    }
  }

  let updateData = { ...validated };
  if (validated.quantity !== undefined || validated.unit_price !== undefined) {
    const qty = validated.quantity ?? existing.quantity ?? 0;
    const price = validated.unit_price ?? existing.unit_price ?? 0;
    updateData.total_price = Math.round(qty * price * 100) / 100;
  }

  const record = await pb.collection('measurements').update(measurementId, updateData);
  revalidatePath('/craft');
  return JSON.parse(JSON.stringify(record)) as MeasurementRecord;
}

export async function deleteMeasurementAction(measurementId: string) {
  const user = await verifyUserSession();
  const pb = await getUserAuthPB();
  if (!user || !pb) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const existing = await pb.collection('measurements').getOne(measurementId);
  if (existing.site_report) {
    const parentReport = await pb.collection('site_reports').getOne(existing.site_report);
    if (parentReport.status === 'signed' || parentReport.status === 'invoiced') {
      throw new Error('Löschen von Aufmaßzeilen auf signierten oder abgerechneten Bautagesberichten ist unzulässig (GoBD-Sperre).');
    }
  }

  await pb.collection('measurements').delete(measurementId);
  return { success: true };
}

export async function getMeasurementsByReportAction(siteReportId: string) {
  const user = await verifyUserSession();
  const pb = await getUserAuthPB();
  if (!user || !pb) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const records = await pb.collection('measurements').getFullList({
    filter: pb.filter('site_report = {:siteReportId}', { siteReportId }),
    sort: '+position_nr',
  });

  return JSON.parse(JSON.stringify(records)) as MeasurementRecord[];
}

export async function getMeasurementsByProjectAction(projectId: string) {
  const user = await verifyUserSession();
  const pb = await getUserAuthPB();
  if (!user || !pb) return [];

  try {
    const reports = await pb.collection('site_reports').getFullList({
      filter: pb.filter('project = {:projectId}', { projectId }),
    });
    if (reports.length === 0) return [];
    const reportFilter = reports
      .map((r: any) => pb.filter('site_report = {:rid}', { rid: r.id }))
      .join(' || ');
    const records = await pb.collection('measurements').getFullList({
      filter: reportFilter,
      sort: '+position_nr',
    });
    return JSON.parse(JSON.stringify(records)) as MeasurementRecord[];
  } catch (err) {
    console.warn('[getMeasurementsByProjectAction] Failed:', err);
    return [];
  }
}
