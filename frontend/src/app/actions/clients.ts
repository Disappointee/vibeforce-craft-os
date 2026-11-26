'use server';

import { revalidatePath } from 'next/cache';
import { getUserAuthPB, verifyUserSession } from '@/lib/pocketbase-server';
import { z } from 'zod';

async function requireClientAuth() {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');
  const pb = await getUserAuthPB();
  if (!pb) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');
  const role = typeof user.role === 'string' ? user.role.toLowerCase() : '';
  if (role === 'client' || role === 'auftraggeber' || role.startsWith('guest_slot_')) {
    throw new Error('Zugriff verweigert.');
  }
  return { user, pb, role };
}

export async function revalidateClientsPath() {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');
  revalidatePath('/clients');
  revalidatePath('/craft');
  revalidatePath('/dashboard/clients');
}

export async function revalidateClientPath(clientId: string) {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');
  revalidatePath('/clients/' + clientId);
  revalidatePath('/dashboard/clients/' + clientId);
}

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
  billing_rounding: z.number().nullable().optional(),
  rounding_mode: z.string().nullable().optional(),
  betreuer: z.array(z.string()).optional(),
  beobachter: z.array(z.string()).optional(),
});

const UpdateClientSchema = CreateClientSchema.partial();

export async function createClientAction(data: z.infer<typeof CreateClientSchema>) {
  const { pb } = await requireClientAuth();

  const validated = CreateClientSchema.parse(data);
  const record = await pb.collection('clients').create(validated);

  revalidatePath('/clients');
  revalidatePath('/craft');
  revalidatePath('/dashboard/clients');
  return JSON.parse(JSON.stringify(record));
}

export async function updateClientAction(clientId: string, data: z.infer<typeof UpdateClientSchema>) {
  const { pb } = await requireClientAuth();

  const validated = UpdateClientSchema.parse(data);
  const record = await pb.collection('clients').update(clientId, validated);

  revalidatePath('/clients');
  revalidatePath('/craft');
  revalidatePath('/dashboard/clients');
  revalidatePath('/clients/' + clientId);
  revalidatePath('/dashboard/clients/' + clientId);
  return JSON.parse(JSON.stringify(record));
}

export async function deleteClientAction(id: string) {
  const { user, pb, role } = await requireClientAuth();
  const isPrivileged = ['admin', 'meister', 'manager', 'bauleiter', 'buero'].includes(role);
  if (!isPrivileged) {
    const existing = await pb.collection('clients').getOne(id);
    const isBetreuer = Array.isArray(existing.betreuer) && existing.betreuer.includes(user.id);
    if (!isBetreuer) {
      throw new Error('Zugriff verweigert: Nur Administratoren oder zuständige Betreuer dürfen Kunden archivieren.');
    }
  }

  // Soft-Delete für buchhalterische & historische Sicherheit
  await pb.collection('clients').update(id, {
    status: 'archived',
    kundenstatus: 'archived',
  });

  revalidatePath('/clients');
  revalidatePath('/craft');
  revalidatePath('/dashboard/clients');
}
