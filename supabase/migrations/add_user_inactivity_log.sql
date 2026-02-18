-- Migration: Add user inactivity tracking
-- Created: 2026-02-18

CREATE TABLE IF NOT EXISTS public.user_inactivity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    inactivity_email_sent_at TIMESTAMPTZ,       -- 2-week inactivity email
    deletion_warning_sent_at TIMESTAMPTZ,        -- 3-day warning before delete
    scheduled_deletion_at TIMESTAMPTZ,           -- when account will be deleted
    deleted_at TIMESTAMPTZ,                      -- when account was deleted
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_inactivity_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access (cron job uses service role)
CREATE POLICY "Service role only" ON public.user_inactivity_log
    USING (false);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_inactivity_log_user_id ON public.user_inactivity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inactivity_log_scheduled_deletion ON public.user_inactivity_log(scheduled_deletion_at);
