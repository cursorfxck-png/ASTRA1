-- Step 1: Create the astra-bucket (Run this in Supabase SQL Editor)

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'astra-bucket',
  'astra-bucket',
  true,
  52428800,
  NULL
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies for public access

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- Allow public SELECT (read/download)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'astra-bucket');

-- Allow public INSERT (upload)
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'astra-bucket');

-- Allow public UPDATE
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'astra-bucket');

-- Allow public DELETE
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'astra-bucket');

-- Verify the setup
SELECT * FROM storage.buckets WHERE id = 'astra-bucket';
