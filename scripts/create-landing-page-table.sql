-- =====================================================
-- ASTRA CMS - Landing Page Table
-- =====================================================
-- Replaces the old site_content table.
-- Run this in the Supabase SQL Editor.

-- Create landing_page table
CREATE TABLE IF NOT EXISTS landing_page (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE DEFAULT 'main',
  content JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- Migrate data from legacy site_content table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'site_content') THEN
    INSERT INTO landing_page (slug, content, version, created_at, updated_at, updated_by)
    SELECT
      COALESCE(NULLIF(key, ''), 'main'),
      content,
      COALESCE(version, 1),
      COALESCE(created_at, NOW()),
      COALESCE(updated_at, NOW()),
      updated_by
    FROM site_content
    WHERE key = 'main'
    ON CONFLICT (slug) DO UPDATE SET
      content = EXCLUDED.content,
      version = EXCLUDED.version,
      updated_at = EXCLUDED.updated_at,
      updated_by = EXCLUDED.updated_by;

    DROP TABLE site_content CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_landing_page_slug ON landing_page(slug);
CREATE INDEX IF NOT EXISTS idx_landing_page_updated_at ON landing_page(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_page_content_gin ON landing_page USING GIN (content);

-- Row Level Security
ALTER TABLE landing_page ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON landing_page;
CREATE POLICY "Allow public read access"
  ON landing_page
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON landing_page;
CREATE POLICY "Allow public insert access"
  ON landing_page
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access" ON landing_page;
CREATE POLICY "Allow public update access"
  ON landing_page
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Auto-update timestamp and version
CREATE OR REPLACE FUNCTION update_landing_page_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_landing_page_updated_at ON landing_page;
CREATE TRIGGER update_landing_page_updated_at
  BEFORE UPDATE ON landing_page
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_page_updated_at();

-- Seed default row (minimal valid structure — app will upsert full content on first load)
INSERT INTO landing_page (slug, content, updated_by) VALUES (
  'main',
  '{
    "navigation": [
      {"label": "Home", "href": "#", "active": true},
      {"label": "Catalog", "href": "#"},
      {"label": "Contact", "href": "#"}
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

-- Helper view
CREATE OR REPLACE VIEW current_landing_page AS
SELECT slug, content, version, updated_at
FROM landing_page
WHERE slug = 'main';

-- Permissions (anon key is used by the Next.js server for CMS reads/writes)
GRANT SELECT, INSERT, UPDATE ON landing_page TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON landing_page TO authenticated;
GRANT USAGE ON SEQUENCE landing_page_id_seq TO anon, authenticated;

-- Helper functions
CREATE OR REPLACE FUNCTION get_landing_page(page_slug TEXT DEFAULT 'main')
RETURNS JSONB AS $$
BEGIN
  RETURN (SELECT content FROM landing_page WHERE slug = page_slug);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_landing_page(
  page_slug TEXT,
  new_content JSONB,
  user_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
  INSERT INTO landing_page (slug, content, updated_by)
  VALUES (page_slug, new_content, user_id)
  ON CONFLICT (slug)
  DO UPDATE SET
    content = new_content,
    updated_by = user_id,
    updated_at = NOW();

  RETURN (SELECT content FROM landing_page WHERE slug = page_slug);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_landing_page TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_landing_page TO anon, authenticated;
