-- PDPA (Personal Data Protection Act) consent settings.
-- When enabled, the public form requires a consent checkbox before submission.
-- Stored as jsonb, mirroring edit_link_settings / respondent_notification.
--
-- Shape: { "enabled": bool, "consentText": text, "policyUrl": text }

ALTER TABLE public.forms
  ADD COLUMN IF NOT EXISTS pdpa_settings jsonb;

-- Flush the PostgREST schema cache so the new column is immediately writable.
NOTIFY pgrst, 'reload schema';
