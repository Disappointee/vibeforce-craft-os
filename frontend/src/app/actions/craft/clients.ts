'use server';

import { revalidatePath } from 'next/cache';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import { z } from 'zod';
import type { ClientRecord } from '@/lib/pocketbase-types';

const CreateCraftClientSchema = z.object({
  name: z.string().min(1, 'Name oder Firma des Auftraggebers ist erforderlich'),
  company: z.string().nullable().optional(),
  client_type: z.enum(['privat', 'gewerblich', 'bautraeger', 'gu', 'oeffentlich']).default('privat'),
  contact_person: z.string().nullable().optional(),
  email: z.string().email('Ungültige E-Mail-Adresse').nullable().optional().or(z.literal('')),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  vat_id: z.string().nullable().optional(), // USt-IdNr. für § 13b
  tax_number: z.string().nullable().optional(),
  has_48b_certificate: z.boolean().default(false), // Freistellungsbescheinigung Bauabzugsteuer
  notes: z.string().nullable().optional(),
});

export async function createCraftClientAction(data: z.infer<typeof CreateCraftClientSchema>): Promise<ClientRecord> {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  const validated = CreateCraftClientSchema.parse(data);
  const pb = await getAdminPB();

  const record = await pb.collection('clients').create({
    name: validated.name,
    company: validated.company || (validated.client_type !== 'privat' ? validated.name : null),
    email: validated.email || null,
    phone: validated.phone || null,
    address: validated.address || null,
    notes: [
      validated.notes || '',
      `Auftraggeber-Typ: ${validated.client_type.toUpperCase()}`,
      validated.contact_person ? `Ansprechpartner: ${validated.contact_person}` : null,
      validated.vat_id ? `USt-IdNr.: ${validated.vat_id}` : null,
      validated.has_48b_certificate ? '§ 48b EStG Freistellungsbescheinigung vorhanden' : null,
    ].filter(Boolean).join('\n'),
    status: 'active',
    abrechenbar: true,
  });

  revalidatePath('/craft');
  revalidatePath('/dashboard/clients');
  revalidatePath('/clients');

  return JSON.parse(JSON.stringify(record));
}
