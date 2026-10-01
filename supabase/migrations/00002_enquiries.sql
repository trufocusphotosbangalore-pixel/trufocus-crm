-- ══════════════════════════════════════════════════════════════════════════════
-- Trufocus Photography CRM — Enquiries Module
-- Migration: 00002_enquiries
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── Enquiry Number Sequence ──────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS enquiry_number_seq START 1;

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE enquiry_status AS ENUM (
  'new',
  'contacted',
  'quotation_sent',
  'customer_reviewing',
  'negotiation',
  'follow_up',
  'booked',
  'completed',
  'rejected',
  'lost'
);

CREATE TYPE enquiry_source AS ENUM (
  'website',
  'whatsapp',
  'instagram',
  'facebook',
  'google',
  'google_business_profile',
  'referral',
  'walk_in',
  'phone_call',
  'manual_entry',
  'other'
);

CREATE TYPE event_type AS ENUM (
  'wedding',
  'reception',
  'engagement',
  'haldi',
  'mehendi',
  'sangeet',
  'birthday',
  'baby_shower',
  'naming_ceremony',
  'housewarming',
  'corporate_event',
  'studio_shoot',
  'other'
);

CREATE TYPE contact_method AS ENUM (
  'whatsapp',
  'phone',
  'email'
);

-- ─── Enquiries Table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.enquiries (
  id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  enquiry_number          TEXT            NOT NULL UNIQUE DEFAULT 'ENQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('enquiry_number_seq')::TEXT, 4, '0'),
  customer_name           TEXT            NOT NULL,
  mobile                  TEXT            NOT NULL,
  alternate_mobile        TEXT,
  email                   TEXT,
  event_type              event_type      NOT NULL,
  event_date              DATE,
  event_time              TIME,
  venue                   TEXT,
  location                TEXT,
  budget                  NUMERIC(12, 2),
  source                  enquiry_source  NOT NULL DEFAULT 'manual_entry',
  status                  enquiry_status  NOT NULL DEFAULT 'new',
  assigned_to             UUID            REFERENCES public.profiles(id),
  notes                   TEXT,
  preferred_contact_method contact_method DEFAULT 'whatsapp',
  -- Audit
  created_by              UUID            REFERENCES auth.users(id),
  created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

-- ─── Updated At Trigger ───────────────────────────────────────────────────────

CREATE TRIGGER set_enquiries_updated_at
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Admin and sales can do everything
CREATE POLICY "Staff can manage enquiries"
  ON public.enquiries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'sales', 'photographer', 'videographer', 'editor', 'finance')
        AND deleted_at IS NULL
    )
  );

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_enquiries_status      ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_source      ON public.enquiries(source);
CREATE INDEX IF NOT EXISTS idx_enquiries_event_type  ON public.enquiries(event_type);
CREATE INDEX IF NOT EXISTS idx_enquiries_mobile      ON public.enquiries(mobile);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at  ON public.enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_event_date  ON public.enquiries(event_date);
CREATE INDEX IF NOT EXISTS idx_enquiries_deleted_at  ON public.enquiries(deleted_at);
CREATE INDEX IF NOT EXISTS idx_enquiries_assigned_to ON public.enquiries(assigned_to);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_enquiries_search ON public.enquiries
  USING gin(to_tsvector('english', customer_name || ' ' || mobile || ' ' || COALESCE(email, '') || ' ' || COALESCE(location, '')));
