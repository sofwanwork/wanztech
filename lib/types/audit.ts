/**
 * Audit log type definitions. Records security/ownership-relevant actions a
 * user takes (create/delete form, settings change, etc.) for accountability.
 */

export type AuditAction =
  | 'form.create'
  | 'form.delete'
  | 'form.update'
  | 'settings.update'
  | 'webhook.create'
  | 'webhook.delete';

export interface AuditLog {
  id: string;
  userId: string;
  /** Stored as free text so older/unknown actions still render. */
  action: AuditAction | string;
  entityType: string;
  entityId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
