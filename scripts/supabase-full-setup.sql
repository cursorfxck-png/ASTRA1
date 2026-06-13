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
    "heroSlides": [
      {
        "id": "slide-1781293648873",
        "mediaType": "image",
        "mediaUrl": "https://bfgynclddehatuwfxehr.supabase.co/storage/v1/object/public/astra-bucket/uploads/1781293647514-1000133310.jpg",
        "buttonText": "",
        "buttonUrl": ""
      },
      {
        "id": "slide-1781325604060",
        "mediaType": "image",
        "mediaUrl": "https://bfgynclddehatuwfxehr.supabase.co/storage/v1/object/public/astra-bucket/uploads/1781325605732-img-20260314-wa0002.jpg",
        "buttonText": "Shop now",
        "buttonUrl": ""
      },
      {
        "id": "slide-1781325641435",
        "mediaType": "image",
        "mediaUrl": "https://bfgynclddehatuwfxehr.supabase.co/storage/v1/object/public/astra-bucket/uploads/1781325643770-img-20260309-wa0003.jpg",
        "buttonText": "",
        "buttonUrl": ""
      },
      {
        "id": "slide-1781333073754",
        "mediaType": "image",
        "mediaUrl": "https://bfgynclddehatuwfxehr.supabase.co/storage/v1/object/public/astra-bucket/uploads/1781333046264-gcfu6wyphw1waroijpngnmolyk.avif",
        "buttonText": "",
        "buttonUrl": ""
      }
    ],
    "richText": {
      "title": "Every detail carries a story.",
      "subtitle": "ASTRA BUILD DIFFERENT",
      "buttonText": "Shop Now",
      "buttonUrl": "#collections"
    },
    "collectionsHeading": "Shop by Collections!",
    "collections": [
      {
        "id": "collection-harry-potter",
        "title": "Harry Potter",
        "imageUrl": "https://sneakcares.site/cdn/shop/collections/Koleksi_Harry_potter.jpg?v=1751966891&width=750",
        "linkUrl": "#"
      },
      {
        "id": "collection-adventure-time",
        "title": "Adventure Time",
        "imageUrl": "https://sneakcares.site/cdn/shop/collections/Koleksi_Adventure_Time.jpg?v=1776070538&width=750",
        "linkUrl": "#"
      },
      {
        "id": "collection-doraemon",
        "title": "Doraemon",
        "imageUrl": "https://sneakcares.site/cdn/shop/collections/Koleksi_DORAEMON_c2ddf074-6afc-421b-98c6-39f4b2688695.jpg?v=1778024661&width=750",
        "linkUrl": "#"
      },
      {
        "id": "collection-one-piece",
        "title": "One Piece",
        "imageUrl": "https://sneakcares.site/cdn/shop/collections/Koleksi_One_Piece_73c68969-ea32-4331-8853-513c40c39383.jpg?v=1773815178&width=750",
        "linkUrl": "#"
      }
    ],
    "collageOne": {
      "title": "Time to space with Snoopy!",
      "largeCard": {
        "title": "Snoopy Poster",
        "imageUrl": "https://sneakcares.site/cdn/shop/files/Lu_ada_fotografer_yang_sudah_202605071840.jpg?v=1778154183&width=1500",
        "linkUrl": "#",
        "imageRatio": "133.9%"
      },
      "stackedCards": [
        {
          "title": "CUSTOM PAINT SNEAKERS SNOOPY WITH AIR FORCE",
          "imageUrl": "https://sneakcares.site/cdn/shop/files/SnoopySnoopy.jpg?v=1777630113&width=1080",
          "price": "Rp 5.400.000,00 IDR",
          "linkUrl": "#",
          "imageRatio": "108.2%"
        },
        {
          "title": "New Drop!",
          "imageUrl": "https://sneakcares.site/cdn/shop/collections/Koleksi_ND.jpg?v=1761524015&width=1080",
          "linkUrl": "#",
          "imageRatio": "125%"
        }
      ]
    },
    "featuredSection": {
      "title": "New Drop from Westeros!",
      "items": [
        {
          "title": "CUSTOM SNEAKERS GAME OF THRONE HOUSE OF STARK",
          "imageUrl": "https://sneakcares.site/cdn/shop/files/Game_Of_ThronesStark.jpg?v=1776148022&width=1080",
          "price": "Rp 5.300.000,00 IDR",
          "linkUrl": "#",
          "imageRatio": "100%"
        },
        {
          "title": "CUSTOM SNEAKERS GAME OF THRONE HOUSE OF GREYJOY",
          "imageUrl": "https://sneakcares.site/cdn/shop/files/GameOfThronesGreyjoy.jpg?v=1779201726&width=1080",
          "price": "Rp 5.300.000,00 IDR",
          "linkUrl": "#",
          "imageRatio": "100%"
        },
        {
          "title": "CUSTOM SNEAKERS GAME OF THRONE HOUSE OF LANNISTER",
          "imageUrl": "https://sneakcares.site/cdn/shop/files/Game_Of_ThronesLannister.jpg?v=1776148023&width=1080",
          "price": "Rp 5.300.000,00 IDR",
          "linkUrl": "#",
          "imageRatio": "100%"
        }
      ],
      "buttonText": "View all",
      "buttonUrl": "#"
    },
    "collageTwo": {
      "title": "Coming from Mordor!",
      "reverse": true,
      "largeCard": {
        "title": "LOTR Poster",
        "imageUrl": "https://sneakcares.site/cdn/shop/files/Ganti_sepatu_pada_202604131912.jpg?v=1776993991&width=1500",
        "linkUrl": "#",
        "imageRatio": "133.9%"
      },
      "stackedCards": [
        {
          "title": "CUSTOM SNEAKERS LORD OF THE RINGS UNOFFICIAL",
          "imageUrl": "https://sneakcares.site/cdn/shop/files/Lord_Of_TheRings.jpg?v=1776618732&width=1080",
          "price": "From Rp 6.600.000,00 IDR",
          "linkUrl": "#",
          "imageRatio": "100%"
        }
      ]
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
ON CONFLICT (slug) DO UPDATE SET
  content = EXCLUDED.content,
  updated_by = EXCLUDED.updated_by;

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
