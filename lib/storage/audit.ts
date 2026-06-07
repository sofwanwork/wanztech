import 'server-only';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import type { AuditAction, AuditLog } from '@/lib/types/audit';

interface AuditRow {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function rowToAuditLog(row: AuditRow): AuditLog {
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

/**
 * Append an entry to the current user's audit trail. Resolves the caller from
 * the auth session, then inserts via the service-role client (the table has no
 * client INSERT policy — the trail is immutable from the client side).
 *
 * Fire-and-forget by design: a failure here must never break the action being
 * audited, so all errors are swallowed with a warning.
 */
export async function logAudit(entry: {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const admin = createAdminClient();
    await admin.from('audit_logs').insert({
      user_id: user.id,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (e) {
    console.warn('Audit log write failed:', e);
  }
}

/** Owner-only list of recent audit entries (RLS-enforced). */
export async function listAuditLogs(limit = 50): Promise<AuditLog[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(200, limit)));

  if (error || !data) return [];
  return (data as AuditRow[]).map(rowToAuditLog);
}
