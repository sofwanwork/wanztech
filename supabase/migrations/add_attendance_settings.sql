-- Add attendance_settings column to forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS attendance_settings JSONB DEFAULT NULL;
