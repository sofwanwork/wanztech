-- Certificate Templates Table
-- Run this SQL in your Supabase SQL Editor to create the certificate_templates table

CREATE TABLE IF NOT EXISTS certificate_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Untitled Certificate',
    thumbnail TEXT,
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    background_color TEXT NOT NULL DEFAULT '#ffffff',
    background_image TEXT,
    width INTEGER NOT NULL DEFAULT 842,
    height INTEGER NOT NULL DEFAULT 595,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_certificate_templates_user_id ON certificate_templates(user_id);

-- Enable Row Level Security
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own templates
CREATE POLICY "Users can view their own certificate templates"
    ON certificate_templates
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can create their own templates
CREATE POLICY "Users can create their own certificate templates"
    ON certificate_templates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own templates
CREATE POLICY "Users can update their own certificate templates"
    ON certificate_templates
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own templates
CREATE POLICY "Users can delete their own certificate templates"
    ON certificate_templates
    FOR DELETE
    USING (auth.uid() = user_id);
