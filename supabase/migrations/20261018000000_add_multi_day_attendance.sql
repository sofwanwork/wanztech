-- Migration: Add multi-day attendance support to attendance_records
-- Adds day_number column and optimizes index for multi-day queries

ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS day_number integer NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS attendance_records_form_identifier_day_idx
  ON public.attendance_records (form_id, identifier_value, day_number);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
