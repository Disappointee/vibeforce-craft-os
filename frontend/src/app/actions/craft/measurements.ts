'use server';

import { revalidatePath } from 'next/cache';
import { withAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import { z } from 'zod';
import type { MeasurementRecord } from '@/lib/pocketbase-types';

export const CreateMeasurementSchema = z.object({
  site_report: z.string().min(1, 'Berichts-ID ist erforderlich'),
  position_nr: z.string().optional().default('01'),
  title: z.string().min(1, 'Titel / Leistung ist erforderlich'),
  formula: z.string().optional(),
  quantity: z.number().min(0, 'Menge muss >= 0 sein').default(0),
  unit: z.enum(['m', 'm2', 'm3', 'h', 'stk', 'kg', 'psch']).default('m2'),
  unit_price: z.number().min(0).optional().default(0),
  total_price: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
});

export const UpdateMeasurementSchema = CreateMeasurementSchema.partial();

export type CreateMeasurementInput = z.infer<typeof CreateMeasurementSchema>;
export type UpdateMeasurementInput = z.infer<typeof UpdateMeasurementSchema>;

export async function createMeasurementAction(data: CreateMeasurementInput) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = CreateMeasurementSchema.parse(data);
  const calculatedTotal = validated.total_price || (validated.quantity * (validated.unit_price || 0));

  return withAdminPB(async (pb) => {
    const record = await pb.collection('measurements').create({
      ...validated,
      total_price: calculatedTotal,
    });

    return JSON.parse(JSON.stringify(record)) as MeasurementRecord;
  });
}

export async function updateMeasurementAction(measurementId: string, data: UpdateMeasurementInput) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = UpdateMeasurementSchema.parse(data);

  return withAdminPB(async (pb) => {
    let updateData = { ...validated };
    if (validated.quantity !== undefined || validated.unit_price !== undefined) {
      const existing = await pb.collection('measurements').getOne(measurementId);
      const qty = validated.quantity ?? existing.quantity ?? 0;
      const price = validated.unit_price ?? existing.unit_price ?? 0;
      updateData.total_price = qty * price;
    }

    const record = await pb.collection('measurements').update(measurementId, updateData);
    return JSON.parse(JSON.stringify(record)) as MeasurementRecord;
  });
}

export async function deleteMeasurementAction(measurementId: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  return withAdminPB(async (pb) => {
    await pb.collection('measurements').delete(measurementId);
    return { success: true };
  });
}

export async function getMeasurementsByReportAction(siteReportId: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  return withAdminPB(async (pb) => {
    const records = await pb.collection('measurements').getFullList({
      filter: pb.filter('site_report = {:siteReportId}', { siteReportId }),
      sort: '+position_nr',
    });

    return JSON.parse(JSON.stringify(records)) as MeasurementRecord[];
  });
}
