-- ====================================================================
-- TRUFOCUS CRM – SUPABASE CLOUD DATABASE SCHEMA & REALTIME SETUP
-- Copy and paste this script into your Supabase SQL Editor to create
-- all cloud database tables and enable real-time multi-device sync!
-- ====================================================================

-- 1. Create Cloud Storage Tables
CREATE TABLE IF NOT EXISTS public.work_orders (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.enquiries (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.business_profile (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_portals (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_payments (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_production (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.data_storage (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.client_requests (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Disable RLS or Allow Public Access for Anonymous Access
ALTER TABLE public.work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_portals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_production DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_storage DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- 3. Enable Realtime Publications for Multi-Device Synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.enquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_profile;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_portals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.finance_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_production;
ALTER PUBLICATION supabase_realtime ADD TABLE public.data_storage;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
