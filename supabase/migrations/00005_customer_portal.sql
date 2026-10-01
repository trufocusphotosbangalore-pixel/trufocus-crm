-- SQL Migration: Customer Portal Tables
-- Run in Supabase SQL Editor

-- 1. customer_portals
CREATE TABLE IF NOT EXISTS public.customer_portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  work_order_number TEXT NOT NULL,
  project_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  pin_code VARCHAR(4) NOT NULL DEFAULT '4827',
  share_link TEXT NOT NULL,
  qr_code_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_expired BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. portal_settings
CREATE TABLE IF NOT EXISTS public.portal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id UUID NOT NULL REFERENCES public.customer_portals(id) ON DELETE CASCADE,
  show_dashboard BOOLEAN DEFAULT true,
  show_payments BOOLEAN DEFAULT true,
  show_contract BOOLEAN DEFAULT true,
  show_schedule BOOLEAN DEFAULT true,
  show_moodboard BOOLEAN DEFAULT true,
  show_gallery BOOLEAN DEFAULT true,
  show_deliverables BOOLEAN DEFAULT true,
  show_documents BOOLEAN DEFAULT true,
  show_support BOOLEAN DEFAULT true,
  enable_online_payments BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. portal_access_logs
CREATE TABLE IF NOT EXISTS public.portal_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id UUID NOT NULL REFERENCES public.customer_portals(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. portal_moodboard
CREATE TABLE IF NOT EXISTS public.portal_moodboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id UUID NOT NULL REFERENCES public.customer_portals(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'link', 'note')),
  url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_portals_wo_num ON public.customer_portals(work_order_number);
CREATE INDEX IF NOT EXISTS idx_portal_moodboard_portal ON public.portal_moodboard(portal_id);
