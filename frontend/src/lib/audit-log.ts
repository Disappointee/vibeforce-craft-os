/**
 * Audit-Log-Service
 *
 * Zeichnet unveränderliche Log-Einträge für Report-Generierungen,
 * Rechnungsstellungen und andere relevante Aktionen auf.
 *
 * Die `audit_logs`-Collection in PocketBase ist:
 *   - CREATE only (immutable)
 *   - Kein UPDATE, kein DELETE (weder via API noch UI)
 *   - Enthält Timestamp, Actor, Action, Entity-Typ, Entity-ID, Snapshot/Summary
 */

import { pb } from '@/lib/pocketbase';

export type AuditAction =
  | 'report.generated'
  | 'report.regenerated'
  | 'invoice.created'
  | 'invoice.printed'
  | 'service_record.printed'
  | 'timesheet.printed'
  | 'time_entries.billed'
  | 'template.saved'
  | 'template.loaded'
  | 'export.csv'
  | 'export.excel'
  | 'export.pdf';

export interface AuditLogEntry {
  action: AuditAction;
  entityType: string;      // e.g. 'report', 'invoice', 'time_entry'
  entityId?: string;       // related record ID
  summary: string;         // human-readable description
  metadata?: Record<string, unknown>;  // additional context (filter values, counts, etc.)
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await pb.collection('audit_logs').create({
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || '',
      summary: entry.summary,
      metadata: entry.metadata || {},
      user: pb.authStore.model?.id || '',
    });
  } catch (err) {
    console.warn('[AuditLog] Failed to write:', err);
  }
}
