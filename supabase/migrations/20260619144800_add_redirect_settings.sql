-- Drop previous flat settings if they were added, and add redirect_buttons as jsonb
ALTER TABLE public.forms
  DROP COLUMN IF EXISTS redirect_url,
  DROP COLUMN IF EXISTS redirect_button_text,
  ADD COLUMN IF NOT EXISTS redirect_buttons jsonb;

-- Flush the PostgREST schema cache so the new column is immediately writable.
NOTIFY pgrst, 'reload schema';
