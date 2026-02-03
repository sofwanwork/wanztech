-- Create a new storage bucket for QR logos
insert into storage.buckets (id, name, public)
values ('qr_logos', 'qr_logos', true)
on conflict (id) do nothing;

-- Set up security policies for the bucket

-- Allow public access to view logos
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'qr_logos' );

-- Allow authenticated users to upload logos
create policy "Authenticated users can upload logos"
  on storage.objects for insert
  with check (
    bucket_id = 'qr_logos'
    and auth.role() = 'authenticated'
  );

-- Allow users to update their own logos
create policy "Users can update own logos"
  on storage.objects for update
  using (
    bucket_id = 'qr_logos'
    and auth.uid() = owner
  );

-- Allow users to delete their own logos
create policy "Users can delete own logos"
  on storage.objects for delete
  using (
    bucket_id = 'qr_logos'
    and auth.uid() = owner
  );
