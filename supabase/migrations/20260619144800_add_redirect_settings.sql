-- Add custom thank you redirect button settings to the forms table
ALTER TABLE public.forms
  ADD COLUMN IF NOT EXISTS redirect_url text,
  ADD COLUMN IF NOT EXISTS redirect_button_text text;

-- Flush the PostgREST schema cache so the new columns are immediately writable.
NOTIFY pgrst, 'reload schema';
