-- Add theme column to forms table for storing form theme settings (primary color, background color, etc.)
ALTER TABLE forms ADD COLUMN IF NOT EXISTS theme JSONB;
