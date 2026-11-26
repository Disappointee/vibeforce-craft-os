import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminPB } from '@/lib/pocketbase-server';

const SlotActionSchema = z.object({
  slot: z.enum(['slot_a', 'slot_b']),
  action: z.enum(['claim', 'release', 'heartbeat']).default('claim'),
  label: z.string().max(80).optional(),
});

const SLOT_TTL_MS = 30 * 60 * 1000; // 30 minutes

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
};

function withCors(res: NextResponse) {
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function sanitizeSessionRecord(record: Record<string, any>) {
  const pbSlot = record.assigned_slot; // "Slot_A" | "Slot_B"
  return {
    id: record.id,
    slot: pbSlot === 'Slot_A' ? 'slot_a' : 'slot_b',
    active: Boolean(record.is_active),
    label: typeof record.label === 'string' ? record.label : undefined,
    expires_at: record.expires_at || null,
    updated: record.updated || null,
  };
}

function toPbSlot(slot: 'slot_a' | 'slot_b'): 'Slot_A' | 'Slot_B' {
  return slot === 'slot_a' ? 'Slot_A' : 'Slot_B';
}

/**
 * Server-side proxy for `demo_sessions` (collection is admin-only in PocketBase).
 * Prevents direct client-side reads/writes to `demo_sessions`.
 */
export async function GET(request: NextRequest) {
  try {
    const slotParam = request.nextUrl.searchParams.get('slot');
    if (slotParam && slotParam !== 'slot_a' && slotParam !== 'slot_b') {
      return withCors(NextResponse.json({ error: 'Ungültiger Demo-Slot.' }, { status: 400 }));
    }

    const validatedSlot: 'slot_a' | 'slot_b' | undefined = slotParam === 'slot_a' || slotParam === 'slot_b' ? slotParam : undefined;

    const sessions = await withAdminPB(async (pb) => {
      const filter = validatedSlot ? pb.filter('assigned_slot = {:slot}', { slot: toPbSlot(validatedSlot) }) : undefined;
      const list = await pb.collection('demo_sessions').getFullList({
        filter,
        sort: '-last_heartbeat',
        requestKey: null,
      });
      return list.map((rec) => sanitizeSessionRecord(rec as Record<string, any>));
    });

    return withCors(NextResponse.json({ sessions }, { headers: { 'Cache-Control': 'no-store' } }));
  } catch (err) {
    console.warn('[api/demo/slot GET] Error:', err);
    return withCors(NextResponse.json({ error: 'Demo-Slots derzeit nicht verfügbar.' }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = SlotActionSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(NextResponse.json({ error: 'Ungültige Anfrageparameter.' }, { status: 400 }));
    }

    const { slot, action, label } = parsed.data;
    const now = Date.now();
    const expiresAtIso = new Date(now + SLOT_TTL_MS).toISOString();

    const updated = await withAdminPB(async (pb) => {
      const pbSlot = toPbSlot(slot);
      const existing = await pb
        .collection('demo_sessions')
        .getList(1, 1, { filter: pb.filter('assigned_slot = {:slot}', { slot: pbSlot }) });

      const payload = {
        assigned_slot: pbSlot,
        is_active: action !== 'release',
        label: label || (slot === 'slot_a' ? 'Demo-Slot A' : 'Demo-Slot B'),
        expires_at: action === 'release' ? null : expiresAtIso,
      };

      if (existing.items.length > 0) {
        const rec = await pb.collection('demo_sessions').update(existing.items[0].id, payload);
        return sanitizeSessionRecord(rec as Record<string, any>);
      }
      const rec = await pb.collection('demo_sessions').create(payload);
      return sanitizeSessionRecord(rec as Record<string, any>);
    });

    return withCors(NextResponse.json({ session: updated }, { headers: { 'Cache-Control': 'no-store' } }));
  } catch (err) {
    console.warn('[api/demo/slot POST] Error:', err);
    return withCors(NextResponse.json({ error: 'Demo-Slot konnte nicht aktualisiert werden.' }, { status: 500 }));
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const slotParam = request.nextUrl.searchParams.get('slot');
    if (slotParam !== 'slot_a' && slotParam !== 'slot_b') {
      return withCors(NextResponse.json({ error: 'Ungültiger Demo-Slot.' }, { status: 400 }));
    }

    await withAdminPB(async (pb) => {
      const pbSlot = toPbSlot(slotParam);
      const existing = await pb
        .collection('demo_sessions')
        .getList(1, 1, { filter: pb.filter('assigned_slot = {:slot}', { slot: pbSlot }) });
      if (existing.items.length > 0) {
        await pb.collection('demo_sessions').update(existing.items[0].id, {
          is_active: false,
          expires_at: null,
        });
      }
    });

    return withCors(NextResponse.json({ released: true, slot: slotParam }, { headers: { 'Cache-Control': 'no-store' } }));
  } catch (err) {
    console.warn('[api/demo/slot DELETE] Error:', err);
    return withCors(NextResponse.json({ error: 'Demo-Slot konnte nicht freigegeben werden.' }, { status: 500 }));
  }
}