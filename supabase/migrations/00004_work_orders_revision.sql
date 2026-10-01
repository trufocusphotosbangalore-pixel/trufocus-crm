-- ─── TRUFOCUS CRM: Work Orders Revision Migration ─────────────────────────

-- 1. Create Settings Masters Tables
CREATE TABLE IF NOT EXISTS public.settings_event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department_id UUID,
  default_rate NUMERIC DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings_payment_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  requires_reference BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings_contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Services under Events Table
CREATE TABLE IF NOT EXISTS public.work_order_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.work_order_events(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  start_time TIME,
  end_time TIME,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Team Assignments under Services Table
CREATE TABLE IF NOT EXISTS public.work_order_team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.work_order_services(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  role_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Payment Ledger Table
CREATE TABLE IF NOT EXISTS public.work_order_payment_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_mode TEXT NOT NULL,
  transaction_ref TEXT,
  received_by TEXT,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Contracts Table
CREATE TABLE IF NOT EXISTS public.work_order_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  agreement_number TEXT,
  agreement_date DATE,
  valid_until DATE,
  customer_signature TEXT,
  studio_signature TEXT,
  terms_content TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
