-- Add allow_multiple_submissions column to forms table
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS allow_multiple_submissions BOOLEAN DEFAULT TRUE;
