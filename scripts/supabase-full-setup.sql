-- =====================================================
-- ASTRA CMS — Complete Supabase Setup (run once)
-- =====================================================
-- Paste this entire file into Supabase → SQL Editor → Run
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT / DROP IF EXISTS

-- -----------------------------------------------------
-- 1. Landing page CMS table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.landing_page (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE DEFAULT 'main',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_landing_page_slug ON public.landing_page(slug);
CREATE INDEX IF NOT EXISTS idx_landing_page_updated_at ON public.landing_page(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_page_content_gin ON public.landing_page USING GIN (content);

ALTER TABLE public.landing_page ENABLE ROW SECURITY;

DROP POLICY IF EXISTS "landing_page_public_read" ON public.landing_page;
CREATE POLICY "landing_page_public_read"
  ON public.landing_page
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "landing_page_public_insert" ON public.landing_page;
CREATE POLICY "landing_page_public_insert"
  ON public.landing_page
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "landing_page_public_update" ON public.landing_page;
CREATE POLICY "landing_page_public_update"
  ON public.landing_page
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.landing_page TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.landing_page_id_seq TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_landing_page_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_landing_page_updated_at ON public.landing_page;
CREATE TRIGGER trg_landing_page_updated_at
  BEFORE UPDATE ON public.landing_page
  FOR EACH ROW
  EXECUTE FUNCTION public.update_landing_page_updated_at();

INSERT INTO public.landing_page (slug, content, updated_by)
VALUES (
  'main',
  '{
    "navigation": [
      {"label": "Home", "href": "#", "active": true},
      {"label": "Catalog", "href": "#"},
      {"label": "Contact", "href": "#"},
      {"label": "Track Your Order", "href": "#"},
      {"label": "About Us", "href": "#"}
    ],
    "heroSlides": [],
    "richText": {
      "title": "Every detail carries a story.",
      "subtitle": "ASTRA BUILD DIFFERENT",
      "buttonText": "Shop Now",
      "buttonUrl": "#collections"
    },
    "collectionsHeading": "Shop by Collections!",
    "collections": [],
    "collageOne": {
      "title": "Featured Collection",
      "largeCard": {"title": "Featured", "imageUrl": "", "linkUrl": "#", "imageRatio": "100%"},
      "stackedCards": []
    },
    "featuredSection": {
      "title": "New Drops",
      "items": [],
      "buttonText": "View all",
      "buttonUrl": "#"
    },
    "collageTwo": {
      "title": "More to Explore",
      "reverse": true,
      "largeCard": {"title": "Explore", "imageUrl": "", "linkUrl": "#", "imageRatio": "100%"},
      "stackedCards": []
    },
    "newsletter": {
      "title": "Subscribe to our emails",
      "subtitle": "Be the first to know about new collections and exclusive offers."
    },
    "footer": {
      "marketLabel": "Ayodhya | India",
      "languageLabel": "English",
      "copyrightLine": "© 2026, ASTRA",
      "companyLine": "Ayodhya, Uttar Pradesh, India"
    }
  }'::jsonb,
  'system'
)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------
-- 2. Storage bucket for media uploads
-- -----------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'astra-bucket',
  'astra-bucket',
  true,
  52428800,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "astra_bucket_public_read" ON storage.objects;
CREATE POLICY "astra_bucket_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'astra-bucket');

DROP POLICY IF EXISTS "astra_bucket_public_insert" ON storage.objects;
CREATE POLICY "astra_bucket_public_insert"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'astra-bucket');

DROP POLICY IF EXISTS "astra_bucket_public_update" ON storage.objects;
CREATE POLICY "astra_bucket_public_update"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'astra-bucket');

DROP POLICY IF EXISTS "astra_bucket_public_delete" ON storage.objects;
CREATE POLICY "astra_bucket_public_delete"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'astra-bucket');

-- -----------------------------------------------------
-- 3. Verify setup
-- -----------------------------------------------------
SELECT 'landing_page rows' AS check_name, COUNT(*)::text AS result
FROM public.landing_page
UNION ALL
SELECT 'astra-bucket exists', CASE WHEN COUNT(*) > 0 THEN 'yes' ELSE 'no' END
FROM storage.buckets
WHERE id = 'astra-bucket';
