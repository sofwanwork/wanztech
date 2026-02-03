-- Create the certificate_backgrounds bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificate_backgrounds', 'certificate_backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Certificate BG - Users upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificate_backgrounds' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Certificate BG - Users delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'certificate_backgrounds' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (certificates need to display backgrounds)
CREATE POLICY "Certificate BG - Public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'certificate_backgrounds');
