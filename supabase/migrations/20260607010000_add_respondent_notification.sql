-- Respondent confirmation email settings.
-- When enabled, each submission sends an acknowledgement email to the
-- respondent (separate from the owner notification controlled by
-- receive_email_notifications). Stored as jsonb to avoid column proliferation,
-- mirroring edit_link_settings.
--
-- Shape: { "enabled": bool, "emailFieldId": text, "message": text, "includeSummary": bool }

ALTER TABLE public.forms
  ADD COLUMN IF NOT EXISTS respondent_notification jsonb;

-- Flush the PostgREST schema cache so the new column is immediately writable
-- via the API layer (otherwise upserts containing it fail with 42P01).
NOTIFY pgrst, 'reload schema';
