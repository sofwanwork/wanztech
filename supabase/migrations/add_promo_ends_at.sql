-- Add promo_ends_at column to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS promo_ends_at TIMESTAMPTZ;
