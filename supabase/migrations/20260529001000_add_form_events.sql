-- Migration: Form Analytics Events
--
-- Tracks form lifecycle events for analytics: views, starts, field-level
-- interactions, abandons, and submissions.
--
-- Privacy notes:
--  - We hash visitor IPs (SHA-256 with a per-day salt) so we can compute
--    unique-visitor counts WITHOUT storing raw PII. The hash naturally
--    rotates daily.
--  - User-agent stored as a coarse "family" string (mobile/desktop/bot),
--    NOT the full UA string.
--  - Only the form owner can read events for their own forms (RLS).
--  - Events are NEVER returned to public/anonymous clients.

CREATE TABLE IF NOT EXISTS public.form_events (
  id           bigserial PRIMARY KEY,
  form_id      uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL,                            -- denormalised for RLS
  event_type   text NOT NULL CHECK (event_type IN (
                  'view',         -- page render
                  'start',        -- first field interaction
                  'field_focus',  -- per-field engagement (heavy; sample-only)
                  'submit',       -- successful submit
                  'abandon'       -- left without submit (sent on beacon)
                )),
  field_id     text,                                    -- only set for field_focus
  visitor_hash text,                                    -- SHA-256(ip + daily salt)
  device       text CHECK (device IN ('mobile', 'tablet', 'desktop', 'bot', 'unknown')),
  session_id   text,                                    -- cookie/sessionStorage id, opaque
  duration_ms  integer,                                 -- only set for submit/abandon
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────────────────────────────
-- Most queries filter by form_id + time window.
CREATE INDEX IF NOT EXISTS form_events_form_id_created_at_idx
  ON public.form_events (form_id, created_at DESC);

-- For RLS owner-scoped queries.
CREATE INDEX IF NOT EXISTS form_events_user_id_idx
  ON public.form_events (user_id);

-- For unique visitor counts.
CREATE INDEX IF NOT EXISTS form_events_form_visitor_idx
  ON public.form_events (form_id, visitor_hash)
  WHERE visitor_hash IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────
-- RLS — Owner-only read; service role inserts via admin client.
-- ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.form_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can read their form events" ON public.form_events;
CREATE POLICY "Owners can read their form events"
  ON public.form_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT policy for authenticated/anon — inserts happen via service role
-- (createAdminClient()) inside `actions/analytics.ts` so visitors cannot
-- forge events for other users' forms.

-- ──────────────────────────────────────────────────────────────────────
-- Retention helper (optional — call from a Vercel Cron)
-- Delete events older than 180 days to keep the table compact.
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prune_form_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.form_events
  WHERE created_at < now() - interval '180 days';
END;
$$;

NOTIFY pgrst, 'reload schema';
