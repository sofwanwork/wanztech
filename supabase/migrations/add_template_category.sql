-- Add category column to certificate_templates table
ALTER TABLE certificate_templates 
ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('school', 'corporate', 'training', 'event', 'other'));

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_certificate_templates_category ON certificate_templates(category);
