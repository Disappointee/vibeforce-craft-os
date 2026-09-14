'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import { z } from 'zod';
import type { ProjectRecord } from '@/lib/pocketbase-types';

export const CreateBaustelleSchema = z.object({
  name: z.string().min(1, 'Bezeichnung des Bauvorhabens ist erforderlich'),
  key: z.string().min(1, 'Baustellen-Kürzel ist erforderlich').transform((val) => val.toUpperCase()),
  client: z.string().nullable().optional(),
  trade: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  site_manager: z.string().nullable().optional(),
  budget_hours: z.number().nullable().optional(),
  budget_money: z.number().nullable().optional(),
  vob_compliant: z.boolean().default(true),
  reverse_charge_13b: z.boolean().default(true),
  geofence_lat: z.number().nullable().optional(),
  geofence_lng: z.number().nullable().optional(),
  geofence_radius: z.number().default(150),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
});

export async function createBaustelleAction(data: z.infer<typeof CreateBaustelleSchema>): Promise<ProjectRecord> {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = CreateBaustelleSchema.parse(data);
  const pb = await getAdminPB();

  const siteAddress = (validated.street || validated.zip || validated.city) ? {
    street: validated.street || '',
    zip: validated.zip || '',
    city: validated.city || '',
    country: 'DE',
  } : null;

  const record = await pb.collection('projects').create({
    name: validated.name,
    key: validated.key,
    project_type: 'craft',
    status: validated.status,
    client: validated.client || null,
    trade: validated.trade || null,
    site_address: siteAddress,
    site_manager: validated.site_manager || user.id,
    budget_hours: validated.budget_hours ?? null,
    budget_money: validated.budget_money ?? null,
    vob_compliant: validated.vob_compliant,
    reverse_charge_13b: validated.reverse_charge_13b,
    geofence_type: (validated.geofence_lat && validated.geofence_lng) ? 'circle' : 'none',
    geofence_lat: validated.geofence_lat ?? null,
    geofence_lng: validated.geofence_lng ?? null,
    geofence_radius: validated.geofence_radius || 150,
    geofence_data: (validated.geofence_lat && validated.geofence_lng) ? {
      center: [validated.geofence_lat, validated.geofence_lng],
      radius: validated.geofence_radius || 150,
    } : null,
  });

  revalidatePath('/craft');
  revalidatePath('/dashboard/projects');
  revalidatePath('/projects');

  return JSON.parse(JSON.stringify(record));
}

export async function getBaustellenAction(): Promise<ProjectRecord[]> {
  try {
    const pb = await getAdminPB();
    // Inclusive filter: craft type or BAU/CRAFT keys or projects with site reports
    const res = await pb.collection('projects').getList(1, 100, {
      sort: '-created',
      filter: 'project_type = "craft" || key ~ "BAU" || key ~ "CRAFT"',
      expand: 'client,site_manager',
    });
    return JSON.parse(JSON.stringify(res.items)) as ProjectRecord[];
  } catch (err) {
    console.warn('[getBaustellenAction] Failed to fetch:', err);
    return [];
  }
}
