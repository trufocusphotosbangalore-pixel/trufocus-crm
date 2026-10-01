-- ══════════════════════════════════════════════════════════════════════════════
-- Trufocus Photography CRM — Work Orders Module
-- Migration: 00003_work_orders
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── Sequences ────────────────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS work_order_number_seq START 1;

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE work_order_status AS ENUM (
  'upcoming', 'in_progress', 'editing', 'album_design',
  'ready_for_delivery', 'completed', 'cancelled'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'advance_received', 'partially_paid', 'fully_paid', 'refunded'
);

CREATE TYPE contract_status AS ENUM (
  'pending', 'accepted', 'signed', 'expired'
);

CREATE TYPE payment_mode AS ENUM (
  'cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other'
);

CREATE TYPE team_role AS ENUM (
  'lead_photographer', 'traditional_photographer', 'candid_photographer',
  'lead_videographer', 'traditional_videographer', 'cinematic_videographer',
  'drone_operator', 'photo_editor', 'video_editor',
  'album_designer', 'coordinator'
);

-- ─── Work Orders (Master) ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.work_orders (
  id                    UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_number     TEXT              NOT NULL UNIQUE DEFAULT 'WO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('work_order_number_seq')::TEXT, 4, '0'),
  project_name          TEXT              NOT NULL,
  customer_name         TEXT              NOT NULL,
  mobile                TEXT              NOT NULL,
  whatsapp_number       TEXT,
  alternate_mobile      TEXT,
  email                 TEXT,
  event_type            event_type        NOT NULL,
  booking_date          DATE,
  source                enquiry_source,
  enquiry_id            UUID              REFERENCES public.enquiries(id),
  venue                 TEXT,
  city                  TEXT,
  google_map_link       TEXT,
  notes                 TEXT,
  status                work_order_status NOT NULL DEFAULT 'upcoming',
  payment_status        payment_status    NOT NULL DEFAULT 'pending',
  contract_status       contract_status   NOT NULL DEFAULT 'pending',
  progress_percent      SMALLINT          NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  -- Moodboard
  pinterest_link        TEXT,
  special_instructions  TEXT,
  -- Contract
  contract_url          TEXT,
  contract_accepted_at  TIMESTAMPTZ,
  -- Dates
  final_delivery_date   DATE,
  album_delivery_date   DATE,
  is_draft              BOOLEAN           NOT NULL DEFAULT FALSE,
  -- Audit
  created_by            UUID              REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE TRIGGER set_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── Work Order Events ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.work_order_events (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id   UUID        NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  event_name      TEXT        NOT NULL,
  event_type      event_type  NOT NULL,
  event_date      DATE,
  event_time      TIME,
  venue           TEXT,
  location        TEXT,
  special_notes   TEXT,
  sort_order      SMALLINT    NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_wo_events_updated_at
  BEFORE UPDATE ON public.work_order_events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── Work Order Team ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.work_order_team (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id   UUID        NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  profile_id      UUID        NOT NULL REFERENCES public.profiles(id),
  role            team_role   NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (work_order_id, profile_id, role)
);

-- ─── Work Order Deliverables ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.work_order_deliverables (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id   UUID        NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  is_included     BOOLEAN     NOT NULL DEFAULT FALSE,
  is_delivered    BOOLEAN     NOT NULL DEFAULT FALSE,
  notes           TEXT,
  due_date        DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_wo_deliverables_updated_at
  BEFORE UPDATE ON public.work_order_deliverables
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── Work Order Payments ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.work_order_payments (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id     UUID          NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  total_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  advance_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_amount    NUMERIC(12,2) GENERATED ALWAYS AS (total_amount - advance_amount) STORED,
  gst_percent       NUMERIC(5,2)  NOT NULL DEFAULT 0,
  discount_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_mode      payment_mode  NOT NULL DEFAULT 'cash',
  transaction_ref   TEXT,
  payment_notes     TEXT,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_wo_payments_updated_at
  BEFORE UPDATE ON public.work_order_payments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── Work Order Documents ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.work_order_documents (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id   UUID        NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  file_url        TEXT        NOT NULL,
  file_type       TEXT,
  file_size       BIGINT,
  category        TEXT        NOT NULL DEFAULT 'general',
  uploaded_by     UUID        REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Work Order Timeline ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.work_order_timeline (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id   UUID        NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  description     TEXT,
  event_date      DATE        NOT NULL,
  event_type      TEXT        NOT NULL DEFAULT 'milestone',
  is_completed    BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order      SMALLINT    NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Work Order Notes ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.work_order_notes (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id   UUID        NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  note            TEXT        NOT NULL,
  is_internal     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by      UUID        REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Work Order Gallery ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.work_order_gallery (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id   UUID        NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  gallery_name    TEXT        NOT NULL,
  gallery_url     TEXT,
  is_shared       BOOLEAN     NOT NULL DEFAULT FALSE,
  shared_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

ALTER TABLE public.work_orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_team      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_timeline  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_gallery   ENABLE ROW LEVEL SECURITY;

-- Staff can manage all work order tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'work_orders', 'work_order_events', 'work_order_team',
    'work_order_deliverables', 'work_order_payments',
    'work_order_documents', 'work_order_timeline',
    'work_order_notes', 'work_order_gallery'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "Staff can manage %I" ON public.%I FOR ALL
       USING (EXISTS (
         SELECT 1 FROM public.profiles
         WHERE id = auth.uid()
         AND role IN (''admin'',''sales'',''photographer'',''videographer'',''editor'',''finance'')
         AND deleted_at IS NULL
       ))', tbl, tbl
    );
  END LOOP;
END $$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_wo_status       ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_wo_payment      ON public.work_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_wo_contract     ON public.work_orders(contract_status);
CREATE INDEX IF NOT EXISTS idx_wo_event_type   ON public.work_orders(event_type);
CREATE INDEX IF NOT EXISTS idx_wo_created_at   ON public.work_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wo_enquiry_id   ON public.work_orders(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_wo_deleted_at   ON public.work_orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_wo_events_wo    ON public.work_order_events(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_team_wo      ON public.work_order_team(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_team_profile ON public.work_order_team(profile_id);
CREATE INDEX IF NOT EXISTS idx_wo_payments_wo  ON public.work_order_payments(work_order_id);
