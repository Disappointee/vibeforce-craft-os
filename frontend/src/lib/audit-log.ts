/**
 * Audit-Log-Service
 *
 * Zeichnet unveränderliche Log-Einträge für Report-Generierungen,
 * Rechnungsstellungen, Konfigurationsänderungen und administrative Aktionen auf.
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
  | 'export.pdf'
  | 'settings.updated'
  | 'user.created'
  | 'user.updated'
  | 'user.deactivated'
  | 'user.deleted'
  | 'task.created'
  | 'task.deleted'
  | 'project.created'
  | 'project.deleted'
  | 'client.created'
  | 'client.deleted';

export interface AuditLogEntry {
  action: AuditAction;
  entityType: string; // e.g. 'report', 'invoice', 'time_entry', 'system_settings', 'user'
  entityId?: string; // related record ID
  summary: string; // human-readable description
  metadata?: Record<string, unknown>; // additional context
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const currentUserId = pb.authStore.record?.id || (pb.authStore as any).model?.id || '';
    await pb.collection('audit_logs').create({
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || '',
      summary: entry.summary,
      metadata: entry.metadata || {},
      user: currentUserId,
    });
  } catch (err) {
    console.warn('[AuditLog] Failed to write (skipped gracefully):', err);
  }
}
