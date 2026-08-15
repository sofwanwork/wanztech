-- Fasa D: form_responses — local DB copy of every submission.
--
-- Problem: responses previously lived ONLY in Google Sheets. If appendToSheet
-- failed, the response was lost forever and the respondent saw an error even
-- though nothing was saved. This table becomes the durable source of truth:
-- submitFormAction writes here FIRST, then syncs to Sheets async (after()).
-- Also enables backup/export and future local analytics without re-reading
-- the whole Sheet on every request.
--
-- Writes go through the service-role admin client (public respondents have
-- no auth). RLS: owner-only SELECT.

CREATE TABLE IF NOT EXISTS public.form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL UNIQUE,
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- 'pending' = written locally, not yet in Sheets
  -- 'synced'  = appended to Google Sheets
  -- 'failed'  = Sheets append failed (retryable by cron)
  sheet_sync_status text NOT NULL DEFAULT 'pending',
  sheet_sync_error text,
  sheet_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS form_responses_form_id_idx
  ON public.form_responses (form_id, created_at DESC);

CREATE INDEX IF NOT EXISTS form_responses_user_id_idx
  ON public.form_responses (user_id, created_at DESC);

-- Partial index: the retry cron only scans rows that still need syncing.
CREATE INDEX IF NOT EXISTS form_responses_pending_sync_idx
  ON public.form_responses (created_at)
  WHERE sheet_sync_status = 'pending';

-- Retention: keep local copies for 400 days (> 1 year) so owners have a
-- safety net without unbounded growth. Owners who need older data have it
-- in their own Google Sheet.
CREATE OR REPLACE FUNCTION public.prune_form_responses()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  DELETE FROM public.form_responses
  WHERE created_at < (now() - interval '400 days');
$$;

ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "form_responses_select_own" ON public.form_responses;
CREATE POLICY "form_responses_select_own"
  ON public.form_responses
  FOR SELECT
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies: writes happen exclusively via the
-- service-role client (submitFormAction / sync cron), same pattern as
-- audit_logs.

NOTIFY pgrst, 'reload schema';
