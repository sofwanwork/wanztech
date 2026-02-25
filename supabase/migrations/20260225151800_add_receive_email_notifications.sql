-- Migration to add receive_email_notifications to the forms table
-- This allows users to opt-out of receiving an email notification for every form submission.

-- Add the column with a default value of TRUE so existing forms continue receiving emails by default.
ALTER TABLE public.forms
ADD COLUMN IF NOT EXISTS receive_email_notifications BOOLEAN NOT NULL DEFAULT true;

-- Add a comment explaining the column's purpose
COMMENT ON COLUMN public.forms.receive_email_notifications IS 'Whether the form owner should receive an email notification when a new response is submitted. Defaults to true.';
