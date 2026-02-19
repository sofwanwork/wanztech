-- Migration: Add Google OAuth tokens to settings
-- Created: 2026-02-19

ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expiry BIGINT; -- timestamp in ms

-- Optional: Add index if we query by expiry often (e.g. cron job to refresh tokens)
-- CREATE INDEX IF NOT EXISTS idx_settings_google_token_expiry ON public.settings(google_token_expiry);
