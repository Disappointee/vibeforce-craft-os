'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';

export async function revalidateClientsPath() {
  await verifyUserSession();
  revalidatePath('/clients');
  revalidatePath('/craft');
  revalidatePath('/dashboard/clients');
}

export async function revalidateClientPath(clientId: string) {
  await verifyUserSession();
  revalidatePath('/clients/' + clientId);
  revalidatePath('/dashboard/clients/' + clientId);
}

import { z } from 'zod';

const CreateClientSchema = z.object({
  name: z.string().min(1, 'Kundenname ist erforderlich'),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  auftragsvolumen: z.number().nullable().optional(),
  stundenhonorar: z.number().nullable().optional(),
  stundenzahl_monatlich: z.number().nullable().optional(),
  stundenzahl_gesamt: z.number().nullable().optional(),
  laufzeit_start: z.string().nullable().optional(),
  laufzeit_ende: z.string().nullable().optional(),
  abrechenbar: z.boolean().optional(),
  kundenstatus: z.string().optional(),
  betreuer: z.array(z.string()).optional(),
  beobachter: z.array(z.string()).optional(),
}).passthrough();

const UpdateClientSchema = CreateClientSchema.partial();

export async function createClientAction(data: z.infer<typeof CreateClientSchema>) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = CreateClientSchema.parse(data);
  const pb = await getAdminPB();
  const record = await pb.collection('clients').create(validated);

  revalidatePath('/clients');
  revalidatePath('/craft');
  revalidatePath('/dashboard/clients');
  return JSON.parse(JSON.stringify(record));
}

export async function updateClientAction(clientId: string, data: z.infer<typeof UpdateClientSchema>) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = UpdateClientSchema.parse(data);
  const pb = await getAdminPB();
  const record = await pb.collection('clients').update(clientId, validated);

  revalidatePath('/clients');
  revalidatePath('/craft');
  revalidatePath('/dashboard/clients');
  revalidatePath('/clients/' + clientId);
  revalidatePath('/dashboard/clients/' + clientId);
  return JSON.parse(JSON.stringify(record));
}

export async function deleteClientAction(id: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const pb = await getAdminPB();
  // Soft-Delete für buchhalterische & historische Sicherheit
  await pb.collection('clients').update(id, {
    status: 'archived',
    kundenstatus: 'archived',
  });

  revalidatePath('/clients');
  revalidatePath('/craft');
  revalidatePath('/dashboard/clients');
}
