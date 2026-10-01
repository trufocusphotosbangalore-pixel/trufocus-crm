-- Sprint 2.5 forward-only compatibility migration
-- Purpose: Add missing backend schema elements without rewriting legacy public tables.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.set_row_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Identity and access tables expected by runtime services
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workspaces (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  company TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_code TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  mobile TEXT,
  role_id TEXT,
  workspace_role TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assignment and scheduling compatibility tables
CREATE TABLE IF NOT EXISTS public.work_order_events (
  id TEXT PRIMARY KEY,
  work_order_id TEXT NOT NULL,
  event_name TEXT,
  event_type TEXT,
  event_date DATE,
  event_time TEXT,
  venue TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.work_order_services (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  start_time TEXT,
  end_time TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.work_order_team_assignments (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  employee_name TEXT,
  role_title TEXT,
  status TEXT NOT NULL DEFAULT 'assigned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_schedule (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  start_timestamp TIMESTAMPTZ,
  end_timestamp TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  venue TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_production_tasks (
  id TEXT PRIMARY KEY,
  work_order_id TEXT NOT NULL,
  event_id TEXT,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_editor_id TEXT,
  assigned_editor_name TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_assignments (
  id TEXT PRIMARY KEY,
  work_order_id TEXT NOT NULL,
  work_order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_mobile TEXT NOT NULL DEFAULT '',
  event_id TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT 'Event',
  event_date DATE,
  event_time TEXT,
  venue TEXT,
  google_map_link TEXT,
  service_id TEXT NOT NULL DEFAULT '',
  service_name TEXT NOT NULL DEFAULT '',
  role_title TEXT NOT NULL DEFAULT 'Crew Member',
  task_type TEXT NOT NULL,
  assigned_to_id TEXT NOT NULL,
  assigned_to_name TEXT NOT NULL,
  assigned_by TEXT NOT NULL DEFAULT 'Manager',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'assigned',
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  rejection_reason TEXT,
  memory_card_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT team_assignments_status_check CHECK (
    status IN ('assigned', 'accepted', 'started', 'completed', 'submitted', 'approved', 'rejected')
  )
);

-- Updated-at triggers
DROP TRIGGER IF EXISTS trg_user_accounts_updated_at ON public.user_accounts;
CREATE TRIGGER trg_user_accounts_updated_at BEFORE UPDATE ON public.user_accounts
FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS trg_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER trg_workspaces_updated_at BEFORE UPDATE ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS trg_role_permissions_updated_at ON public.role_permissions;
CREATE TRIGGER trg_role_permissions_updated_at BEFORE UPDATE ON public.role_permissions
FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS trg_employees_updated_at ON public.employees;
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS trg_work_order_events_updated_at ON public.work_order_events;
CREATE TRIGGER trg_work_order_events_updated_at BEFORE UPDATE ON public.work_order_events
FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS trg_work_order_services_updated_at ON public.work_order_services;
CREATE TRIGGER trg_work_order_services_updated_at BEFORE UPDATE ON public.work_order_services
FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS trg_work_order_team_assignments_updated_at ON public.work_order_team_assignments;
CREATE TRIGGER trg_work_order_team_assignments_updated_at BEFORE UPDATE ON public.work_order_team_assignments
FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS trg_event_schedule_updated_at ON public.event_schedule;
CREATE TRIGGER trg_event_schedule_updated_at BEFORE UPDATE ON public.event_schedule
FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS trg_post_production_tasks_updated_at ON public.post_production_tasks;
CREATE TRIGGER trg_post_production_tasks_updated_at BEFORE UPDATE ON public.post_production_tasks
FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS trg_team_assignments_updated_at ON public.team_assignments;
CREATE TRIGGER trg_team_assignments_updated_at BEFORE UPDATE ON public.team_assignments
FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_assignments_work_order_id ON public.team_assignments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_assigned_to_id ON public.team_assignments(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_status ON public.team_assignments(status);
CREATE INDEX IF NOT EXISTS idx_team_assignments_task_type ON public.team_assignments(task_type);
CREATE INDEX IF NOT EXISTS idx_team_assignments_event_date ON public.team_assignments(event_date);
CREATE INDEX IF NOT EXISTS idx_work_order_events_work_order_id ON public.work_order_events(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_services_event_id ON public.work_order_services(event_id);
CREATE INDEX IF NOT EXISTS idx_work_order_team_assignments_service_id ON public.work_order_team_assignments(service_id);
CREATE INDEX IF NOT EXISTS idx_post_production_tasks_work_order_id ON public.post_production_tasks(work_order_id);
CREATE INDEX IF NOT EXISTS idx_event_schedule_event_id ON public.event_schedule(event_id);

-- RLS baseline
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_production_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS authenticated_manage_user_accounts ON public.user_accounts;
CREATE POLICY authenticated_manage_user_accounts ON public.user_accounts
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS authenticated_manage_workspaces ON public.workspaces;
CREATE POLICY authenticated_manage_workspaces ON public.workspaces
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS authenticated_manage_role_permissions ON public.role_permissions;
CREATE POLICY authenticated_manage_role_permissions ON public.role_permissions
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS authenticated_read_update_own_profile ON public.profiles;
CREATE POLICY authenticated_read_update_own_profile ON public.profiles
FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS authenticated_manage_employees ON public.employees;
CREATE POLICY authenticated_manage_employees ON public.employees
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS authenticated_manage_work_order_events ON public.work_order_events;
CREATE POLICY authenticated_manage_work_order_events ON public.work_order_events
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS authenticated_manage_work_order_services ON public.work_order_services;
CREATE POLICY authenticated_manage_work_order_services ON public.work_order_services
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS authenticated_manage_work_order_team_assignments ON public.work_order_team_assignments;
CREATE POLICY authenticated_manage_work_order_team_assignments ON public.work_order_team_assignments
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS authenticated_manage_event_schedule ON public.event_schedule;
CREATE POLICY authenticated_manage_event_schedule ON public.event_schedule
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS authenticated_manage_post_production_tasks ON public.post_production_tasks;
CREATE POLICY authenticated_manage_post_production_tasks ON public.post_production_tasks
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS authenticated_manage_team_assignments ON public.team_assignments;
CREATE POLICY authenticated_manage_team_assignments ON public.team_assignments
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Realtime publication entries
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE public.role_permissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_order_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_order_services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_order_team_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_schedule;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_production_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_assignments;
