-- Add is_active column to forms table to support closing forms
ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
