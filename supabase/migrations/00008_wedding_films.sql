-- ══════════════════════════════════════════════════════════════════════════════
-- Trufocus Photography CRM — Wedding Films Module
-- Migration: 00008_wedding_films
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.wedding_films (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT          NOT NULL,
  location        TEXT          NOT NULL DEFAULT '',
  category        TEXT          NOT NULL DEFAULT 'Cinematic Film',
  video_url       TEXT          NOT NULL DEFAULT '',
  cover_image_url TEXT          NOT NULL DEFAULT '',
  published       BOOLEAN       NOT NULL DEFAULT TRUE,
  featured        BOOLEAN       NOT NULL DEFAULT FALSE,
  display_order   INTEGER       NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Updated at trigger
CREATE TRIGGER set_wedding_films_updated_at
  BEFORE UPDATE ON public.wedding_films
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.wedding_films ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published films
CREATE POLICY "Public read published wedding films"
  ON public.wedding_films FOR SELECT
  USING (published = TRUE OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'sales', 'photographer', 'videographer', 'editor', 'finance')
      AND deleted_at IS NULL
  ));

-- Allow staff to manage all wedding films
CREATE POLICY "Staff can manage wedding films"
  ON public.wedding_films FOR ALL
  USING (TRUE);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wedding_films_published ON public.wedding_films(published);
CREATE INDEX IF NOT EXISTS idx_wedding_films_featured ON public.wedding_films(featured);
CREATE INDEX IF NOT EXISTS idx_wedding_films_display_order ON public.wedding_films(display_order ASC);
