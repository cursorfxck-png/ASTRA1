-- Create the astra-bucket storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'astra-bucket',
  'astra-bucket',
  true,
  52428800, -- 50MB limit
  ARRAY['image/*', 'video/*', 'application/json', 'text/*']
)
ON CONFLICT (id) DO NOTHING;

-- Enable public access for the bucket
CREATE POLICY "Public Access for astra-bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'astra-bucket');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to astra-bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'astra-bucket');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update in astra-bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'astra-bucket');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete from astra-bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'astra-bucket');

-- Allow public (anonymous) users to upload as well (if needed)
CREATE POLICY "Public can upload to astra-bucket"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'astra-bucket');

-- Allow public users to update
CREATE POLICY "Public can update in astra-bucket"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'astra-bucket');

-- Allow public users to delete
CREATE POLICY "Public can delete from astra-bucket"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'astra-bucket');
