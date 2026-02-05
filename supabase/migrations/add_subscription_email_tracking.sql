-- Add columns for subscription email tracking
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grace_email_sent TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS blocked_email_sent TIMESTAMPTZ;

-- Add index for efficient queries on status and period_end
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_period 
ON subscriptions (status, current_period_end);
