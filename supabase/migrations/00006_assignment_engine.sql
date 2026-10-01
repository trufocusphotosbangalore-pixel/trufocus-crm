-- ─── TRUFOCUS CRM: Assignment Engine Core ───────────────────────────────

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

CREATE INDEX IF NOT EXISTS idx_team_assignments_work_order_id ON public.team_assignments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_assigned_to_id ON public.team_assignments(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_status ON public.team_assignments(status);
CREATE INDEX IF NOT EXISTS idx_team_assignments_task_type ON public.team_assignments(task_type);
CREATE INDEX IF NOT EXISTS idx_team_assignments_event_date ON public.team_assignments(event_date);

CREATE OR REPLACE FUNCTION public.set_team_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_team_assignments_updated_at ON public.team_assignments;
CREATE TRIGGER trg_team_assignments_updated_at
  BEFORE UPDATE ON public.team_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_team_assignments_updated_at();
