-- ================================================================
-- PNTC Website — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Posts ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL DEFAULT 'Untitled Post',
  slug          TEXT        UNIQUE NOT NULL,
  excerpt       TEXT        DEFAULT '',
  content       TEXT        DEFAULT '',
  "featuredImage" TEXT      DEFAULT '',
  sites         JSONB       DEFAULT '[]',
  status        TEXT        DEFAULT 'draft',
  category      TEXT        DEFAULT '',
  tags          JSONB       DEFAULT '[]',
  author        TEXT        DEFAULT 'PNTC Communications',
  "createdAt"   TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ DEFAULT NOW(),
  "publishedAt" TIMESTAMPTZ
);

-- ── Careers ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS careers (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        DEFAULT '',
  department    TEXT        DEFAULT '',
  location      TEXT        DEFAULT 'Dasmariñas, Cavite',
  description   TEXT        DEFAULT '',
  "badgeType"   TEXT        DEFAULT 'Full-Time',
  "createdAt"   TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Research ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS research (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        DEFAULT '',
  body          TEXT        DEFAULT '',
  icon          TEXT        DEFAULT '🏅',
  year          TEXT        DEFAULT '',
  "createdAt"   TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Directory ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS directory (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        DEFAULT '',
  description   TEXT        DEFAULT '',
  icon          TEXT        DEFAULT '📋',
  contacts      JSONB       DEFAULT '[]',
  "createdAt"   TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Merchandise ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchandise (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        DEFAULT '',
  category      TEXT        DEFAULT '',
  note          TEXT        DEFAULT '',
  price         TEXT        DEFAULT '',
  icon          TEXT        DEFAULT '🛍️',
  "imgClass"    TEXT        DEFAULT 'mi-navy',
  "createdAt"   TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security (allow service role full access) ───────
ALTER TABLE posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE research    ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory   ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically, so no policies needed.
-- If you want to allow public reads (for a future public API), add:
-- CREATE POLICY "Public read posts" ON posts FOR SELECT USING (status = 'published');

-- ── Storage bucket ────────────────────────────────────────────
-- Create manually in Supabase Dashboard → Storage → New Bucket
-- Name: site-images
-- Public: YES (so uploaded images have public URLs)
--
-- Or run via SQL (Supabase Storage SQL API):
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

-- ── Migrate existing posts from posts.json ────────────────────
-- After running this schema, paste your posts.json data here
-- or use the import script described in the deployment guide.
