-- Add qr_settings column to forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS qr_settings JSONB DEFAULT NULL;
