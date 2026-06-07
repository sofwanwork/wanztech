import type { AuditLog } from '@/lib/types/audit';

/**
 * Pure, deterministic, dependency-free formatters for audit log rendering.
 * Kept separate from storage so they can be unit-tested without Supabase.
 */

const ACTION_LABELS: Record<string, string> = {
  'form.create': 'Form created',
  'form.delete': 'Form deleted',
  'form.update': 'Form updated',
  'settings.update': 'Settings updated',
  'webhook.create': 'Webhook created',
  'webhook.delete': 'Webhook deleted',
};

/** Human-readable Malay label for an audit action code. */
export function describeAuditAction(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

/** One-line summary combining the action label with the entity name, if any. */
export function describeAuditLog(log: Pick<AuditLog, 'action' | 'metadata'>): string {
  const label = describeAuditAction(log.action);
  const name =
    typeof log.metadata?.title === 'string'
      ? log.metadata.title
      : typeof log.metadata?.name === 'string'
        ? log.metadata.name
        : undefined;
  return name ? `${label}: ${name}` : label;
}

/** Coarse category for icon/colour selection in the UI. */
export function auditActionKind(action: string): 'create' | 'delete' | 'update' | 'other' {
  if (action.endsWith('.create')) return 'create';
  if (action.endsWith('.delete')) return 'delete';
  if (action.endsWith('.update')) return 'update';
  return 'other';
}
