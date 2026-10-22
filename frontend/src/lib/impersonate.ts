/**
 * Impersonation (Client-Helfer)
 *
 * Konsolidiert auf die abgesicherte Next.js-Route `/api/custom/impersonate`
 * (Admin-Check + synchroner, unveränderlicher Audit-Log vor Token-Ausgabe).
 * Der frühere PocketBase-Hook (`backend/pb_hooks/impersonate.pb.js`) wurde in
 * Block 2 (2026-10-22) entfernt — er hatte keinen Audit-Zwang (P1-5).
 */

export async function impersonateUser(
  targetUserId: string,
  reason?: string,
): Promise<{ token: string; record: unknown }> {
  const res = await fetch('/api/custom/impersonate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUserId, reason }),
    credentials: 'same-origin',
  });

  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.error || '';
    } catch {
      // ignore
    }
    throw new Error(`Impersonation fehlgeschlagen (${res.status})${detail ? `: ${detail}` : ''}`);
  }

  return res.json();
}
