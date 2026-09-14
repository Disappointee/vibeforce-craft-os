'use server';

import { withAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import type { IdsCart } from '@/lib/ids-connect';

/**
 * Lädt einen via IDS-Connect 2.5 Webhook persistierten Warenkorb (ids_carts)
 * und liefert ihn an das Dashboard zurück.
 *
 * Sicherheitsmodell:
 * - Nur authentifizierte Nutzer (verifyUserSession).
 * - cart_id muss ein UUID-Format haben (gegen Filter-Injection / Trial-and-Error).
 * - Ist der Cart einem Projekt zugeordnet, muss der Nutzer Mitglied des Projekts sein.
 */
export async function getImportedIdsCartAction(
  cartId: string
): Promise<{ cart: IdsCart | null; error?: string }> {
  const user = await verifyUserSession();
  if (!user) throw new Error('Nicht autorisiert. Bitte erneut anmelden.');

  if (!cartId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cartId)) {
    return { cart: null, error: 'Ungültige Warenkorb-ID.' };
  }

  return withAdminPB(async (pb) => {
    let record: {
      id: string;
      cart_id: string;
      project: string;
      payload_json: string;
      wholesaler: string;
    };
    try {
      record = await pb
        .collection('ids_carts')
        .getFirstListItem(pb.filter('cart_id = {:cartId}', { cartId }));
    } catch {
      return { cart: null, error: 'Warenkorb nicht gefunden oder abgelaufen.' };
    }

    if (record.project) {
      const userId = typeof user.id === 'string' ? user.id : '';
      let project;
      try {
        project = await pb.collection('projects').getOne(record.project, { fields: 'id,members' });
      } catch {
        return { cart: null, error: 'Zugeordnetes Projekt nicht verfügbar.' };
      }
      const members: unknown = project.members;
      const isMember =
        userId !== '' &&
        Array.isArray(members) &&
        members.some((m) => typeof m === 'string' && m === userId);
      if (!isMember) {
        return { cart: null, error: 'Kein Zugriff: Sie sind kein Mitglied des zugeordneten Projekts.' };
      }
    }

    let cart: IdsCart;
    try {
      cart = JSON.parse(record.payload_json) as IdsCart;
    } catch {
      return { cart: null, error: 'Gespeicherter Warenkorb ist beschädigt (ungültiges JSON).' };
    }
    if (!cart || !Array.isArray(cart.items) || typeof cart.header !== 'object' || cart.header === null) {
      return { cart: null, error: 'Gespeicherter Warenkorb hat ein ungültiges Format.' };
    }

    return { cart };
  });
}
