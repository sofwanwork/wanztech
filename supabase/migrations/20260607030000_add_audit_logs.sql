-- Audit logs: records ownership/security-relevant actions per user for
-- accountability (form create/delete/update, settings & webhook changes).
-- Owner-only SELECT via RLS; INSERTs go through the service-role admin client.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_created_idx
  ON public.audit_logs (user_id, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Owner can read their own audit trail. No INSERT/UPDATE/DELETE policy: writes
-- happen exclusively via the service-role client, and the trail is immutable
-- from the client side.
DROP POLICY IF EXISTS "audit_logs_select_own" ON public.audit_logs;
CREATE POLICY "audit_logs_select_own"
  ON public.audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Retention helper: prune audit logs older than 365 days. Schema-qualified
-- with empty search_path per the Security Advisor lesson.
CREATE OR REPLACE FUNCTION public.prune_audit_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  DELETE FROM public.audit_logs
  WHERE created_at < (now() - interval '365 days');
$$;

NOTIFY pgrst, 'reload schema';
