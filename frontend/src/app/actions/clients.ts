'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import type { ClientRecord } from '@/lib/pocketbase-types';
import { z } from 'zod';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

const CreateClientSchema = z.object({
  name: z.string().min(1, 'Kundenname ist erforderlich'),
  company: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  auftragsvolumen: z.number().nullable().optional(),
  stundenhonorar: z.number().nullable().optional(),
  stundenzahl_monatlich: z.number().nullable().optional(),
  stundenzahl_gesamt: z.number().nullable().optional(),
  laufzeit_start: z.string().nullable().optional(),
  laufzeit_ende: z.string().nullable().optional(),
  abrechenbar: z.boolean().optional(),
  kundenstatus: z.enum(['noch_nicht_gestartet', 'aktiv', 'beendet']).optional(),
  billing_rounding: z.union([z.literal(0), z.literal(5), z.literal(6), z.literal(10), z.literal(15), z.literal(30)]).optional(),
  rounding_mode: z.enum(['ceil', 'round']).optional(),
  betreuer: z.array(z.string()).optional(),
  beobachter: z.array(z.string()).optional(),
}).passthrough();

const UpdateClientSchema = CreateClientSchema.partial();

export async function createClient(data: z.infer<typeof CreateClientSchema>): Promise<ActionResult<ClientRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const validated = CreateClientSchema.parse(data);
    const pb = await getAdminPB();
    const record = await pb.collection('clients').create<ClientRecord>(validated);

    revalidatePath('/clients');
    revalidatePath('/dashboard/clients');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Anlegen des Kunden';
    return { success: false, error: message };
  }
}

export async function updateClient(
  clientId: string,
  data: z.infer<typeof UpdateClientSchema>
): Promise<ActionResult<ClientRecord>> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const validated = UpdateClientSchema.parse(data);
    const pb = await getAdminPB();
    const record = await pb.collection('clients').update<ClientRecord>(clientId, validated);

    revalidatePath('/clients');
    revalidatePath('/clients/' + clientId);
    revalidatePath('/dashboard/clients');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Kunden';
    return { success: false, error: message };
  }
}

export async function deleteClient(id: string): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    // Soft-Delete für buchhalterische & historische Sicherheit
    await pb.collection('clients').update(id, {
      status: 'inactive',
      kundenstatus: 'beendet',
    });

    revalidatePath('/clients');
    revalidatePath('/dashboard/clients');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Deaktivieren des Kunden';
    return { success: false, error: message };
  }
}

export async function toggleClientStatus(
  id: string,
  status: 'active' | 'inactive'
): Promise<ActionResult> {
  try {
    const user = await verifyUserSession();
    if (!user) {
      return { success: false, error: 'Nicht autorisiert. Bitte erneut anmelden.' };
    }

    const pb = await getAdminPB();
    await pb.collection('clients').update(id, {
      status,
      kundenstatus: status === 'active' ? 'aktiv' : 'beendet',
    });

    revalidatePath('/clients');
    revalidatePath('/dashboard/clients');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler beim Ändern des Kundenstatus';
    return { success: false, error: message };
  }
}
