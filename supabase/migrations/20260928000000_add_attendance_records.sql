-- Migration: Add attendance_records table for Smart Attendance Check-In / Check-Out
-- Enables tracking duration (hours/minutes) per participant per event/form.

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL,
  identifier_value text NOT NULL,
  identifier_label text NOT NULL DEFAULT 'IC',
  participant_name text,
  check_in_at timestamptz NOT NULL DEFAULT now(),
  check_out_at timestamptz,
  duration_minutes integer,
  status text NOT NULL DEFAULT 'checked_in', -- 'checked_in' | 'completed'
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Fast lookup for checking status by form and participant identifier
CREATE INDEX IF NOT EXISTS attendance_records_form_identifier_idx
  ON public.attendance_records (form_id, identifier_value);

CREATE INDEX IF NOT EXISTS attendance_records_form_id_idx
  ON public.attendance_records (form_id, created_at DESC);

CREATE INDEX IF NOT EXISTS attendance_records_user_id_idx
  ON public.attendance_records (user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_records_select_own" ON public.attendance_records;
CREATE POLICY "attendance_records_select_own"
  ON public.attendance_records
  FOR SELECT
  USING (user_id = auth.uid());

-- Writes happen through service-role admin client (public respondents have no auth)
-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
