# MIGRATION_RECONCILIATION_PLAN

Date: 2026-08-06
Project Ref: zdbhtojtxqxeqttqjomf
Scope: Reconcile current remote schema with local migrations `00001` to `00006`
Constraints honored:
- No migration apply
- No `db push`
- No database modifications
- Forward-only strategy only

## 1. Reconciliation Inputs

Compared:
- Current remote schema (read-only SQL inspection)
- Local migration files:
  - `supabase/migrations/00001_init.sql`
  - `supabase/migrations/00002_enquiries.sql`
  - `supabase/migrations/00003_work_orders.sql`
  - `supabase/migrations/00004_work_orders_revision.sql`
  - `supabase/migrations/00005_customer_portal.sql`
  - `supabase/migrations/00006_assignment_engine.sql`

## 2. Existing Schema (Remote Baseline)

Current `public` tables:
- business_profile
- client_requests
- customer_portals
- data_storage
- enquiries
- finance_payments
- post_production
- settings
- team_members
- work_orders

Current structural pattern in `public`:
- All above tables use legacy shape:
  - `id text`
  - `data jsonb`
  - `created_at timestamptz`
  - `updated_at timestamptz`

Current `public` relational posture:
- Foreign keys: none
- RLS policies: none
- Triggers: none
- Indexes: PK only on each existing table

Migration history state:
- Local versions exist (`00001` to `00006`)
- Remote migration entries for those versions are empty in `supabase migration list`

## 3. Missing Schema (Expected by 00001–00006 but not present remotely)

### Missing tables
From `00001`:
- profiles
- notifications

From `00003`:
- work_order_events
- work_order_team
- work_order_deliverables
- work_order_payments
- work_order_documents
- work_order_timeline
- work_order_notes
- work_order_gallery

From `00004`:
- settings_event_types
- settings_services
- settings_deliverables
- settings_payment_modes
- settings_contract_templates
- work_order_services
- work_order_team_assignments
- work_order_payment_ledger
- work_order_contracts

From `00005`:
- portal_settings
- portal_access_logs
- portal_moodboard

From `00006`:
- team_assignments

## 4. Extra Objects (Exist remotely but not defined by 00001–00006)

`public` extras not defined in these migrations:
- business_profile
- client_requests
- data_storage
- finance_payments
- post_production
- settings (legacy JSON table, not `settings_*` normalized tables)
- team_members (legacy JSON table)

Also present managed schemas not part of app migrations:
- auth
- realtime
- storage
- vault

## 5. Conflicting Objects

These tables exist in both remote and migration model by name, but shape is incompatible:
- enquiries
- work_orders
- customer_portals

Conflict type:
- Remote: JSONB envelope table (`id`, `data`, timestamps)
- Migrations: normalized relational table with many typed columns, constraints, and FKs

Risk:
- Replaying migrations against same names can cause partial object creation, constraint failures, and incorrect assumptions in app logic.

## 6. Tables That Already Exist

Already exist remotely (public):
- business_profile
- client_requests
- customer_portals
- data_storage
- enquiries
- finance_payments
- post_production
- settings
- team_members
- work_orders

## 7. Tables That Should Be Created (Forward-Compatible Target)

Priority tables required for migration-model parity and Sprint 3 data model:
- profiles
- notifications
- work_order_events
- work_order_team
- work_order_deliverables
- work_order_payments
- work_order_documents
- work_order_timeline
- work_order_notes
- work_order_gallery
- settings_event_types
- settings_services
- settings_deliverables
- settings_payment_modes
- settings_contract_templates
- work_order_services
- work_order_team_assignments
- work_order_payment_ledger
- work_order_contracts
- portal_settings
- portal_access_logs
- portal_moodboard
- team_assignments

## 8. Columns That Should Be Added (If preserving existing table names)

Because key tables currently store payload in `data jsonb`, these are missing typed columns expected by migrations.

### enquiries (from 00002)
Should add typed fields such as:
- enquiry_number, customer_name, mobile, alternate_mobile, email
- event_type, event_date, event_time, venue, location, budget
- source, status, assigned_to, notes, preferred_contact_method
- created_by, deleted_at

### work_orders (from 00003)
Should add typed fields such as:
- work_order_number, project_name, customer_name, mobile
- whatsapp_number, alternate_mobile, email
- event_type, booking_date, source, enquiry_id
- venue, city, google_map_link, notes
- status, payment_status, contract_status, progress_percent
- pinterest_link, special_instructions, contract_url, contract_accepted_at
- final_delivery_date, album_delivery_date, is_draft
- created_by, deleted_at

### customer_portals (from 00005)
Should add typed fields such as:
- work_order_id, work_order_number, project_name
- customer_name, mobile, email
- pin_code, share_link, qr_code_url
- is_active, is_expired

## 9. Columns That Should Be Deprecated

For overlapping legacy tables once typed model is adopted and verified:
- enquiries.data (jsonb)
- work_orders.data (jsonb)
- customer_portals.data (jsonb)

Likely also for broader legacy table set as normalization proceeds:
- business_profile.data
- client_requests.data
- data_storage.data
- finance_payments.data
- post_production.data
- settings.data
- team_members.data

Note:
- Deprecation should be phased only after dual-write/backfill and verification.

## 10. Foreign Key Differences

Current remote (`public`):
- No foreign keys

Expected by migrations:
- enquiries.assigned_to -> profiles.id
- work_orders.enquiry_id -> enquiries.id
- work_orders.created_by -> auth.users.id
- work_order_events.work_order_id -> work_orders.id
- work_order_team.work_order_id -> work_orders.id
- work_order_team.profile_id -> profiles.id
- work_order_deliverables.work_order_id -> work_orders.id
- work_order_payments.work_order_id -> work_orders.id
- work_order_documents.work_order_id -> work_orders.id
- work_order_timeline.work_order_id -> work_orders.id
- work_order_notes.work_order_id -> work_orders.id
- work_order_gallery.work_order_id -> work_orders.id
- work_order_services.event_id -> work_order_events.id
- work_order_team_assignments.service_id -> work_order_services.id
- work_order_payment_ledger.work_order_id -> work_orders.id
- work_order_contracts.work_order_id -> work_orders.id
- customer_portals.work_order_id -> work_orders.id
- portal_settings.portal_id -> customer_portals.id
- portal_access_logs.portal_id -> customer_portals.id
- portal_moodboard.portal_id -> customer_portals.id

Gap:
- Major FK integrity gap between current remote and migration target.

## 11. Index Differences

Current remote (`public`):
- PK indexes only:
  - business_profile_pkey
  - client_requests_pkey
  - customer_portals_pkey
  - data_storage_pkey
  - enquiries_pkey
  - finance_payments_pkey
  - post_production_pkey
  - settings_pkey
  - team_members_pkey
  - work_orders_pkey

Expected by migrations (examples):
- enquiries: status/source/event_type/mobile/created_at/event_date/deleted_at/assigned_to/search
- work_orders: status/payment/contract/event_type/created_at/enquiry_id/deleted_at + child-table FK indexes
- customer_portals: work_order_number index
- portal_moodboard: portal_id index
- team_assignments (00006): work_order_id/assigned_to_id/status/task_type/event_date

Gap:
- Performance indexes for query/filter/sort paths are largely missing.

## 12. RLS Differences

Current remote (`public`):
- No RLS policies found

Expected by migrations:
- 00001: profiles + notifications RLS and policies
- 00002: enquiries RLS policy
- 00003: RLS enabled and staff policies across work-order domain tables

Gap:
- Security model differs materially from migration design.

## 13. Determination: Baseline vs Never Applied

Conclusion:
- The remote schema already exists (legacy JSONB model).
- Local migrations `00001–00006` are not represented in remote migration history and are not reflected in object shape.

Interpretation:
- Migration history is missing relative to local files.
- Schema has not been applied in the same lineage as local migration set.
- This is a lineage mismatch, not a blank database.

## 14. Forward-Only Migration Strategy (Safest)

### Phase 0: Protect current state
1. Take full remote backups:
- schema dump
- data dump (at least `public`)

2. Freeze direct schema changes until baseline is established.

### Phase 1: Baseline current remote schema (no rebuild)
1. Pull current remote schema into repository as baseline migration artifact.
2. Commit baseline as source-of-truth start point for this environment.
3. Repair migration history to align with baseline only.
- Do not mark `00001–00006` as applied unless exact effects are present.
- Keep those files as historical/spec references, not executable truth for this remote.

### Phase 2: Add forward-only compatibility migrations
1. Introduce normalized tables needed for Sprint 3 without destructive rewrites.
- Prefer additive create/bridge strategy.

2. Implement dual-write or transformation pipeline from legacy `data jsonb` objects to normalized entities.

3. Add FK constraints incrementally after data quality checks.

4. Add required indexes for workload queries.

5. Add RLS policies per module and role model.

6. Add realtime publication entries for newly introduced domain tables.

### Phase 3: Validation gates
1. Staging dry-run:
- row parity checks
- FK validation
- query performance validation
- RLS access matrix checks
- realtime event checks

2. Production rollout only after staging pass.

## 15. Safest Method to Baseline Missing Migration History (Without Rebuild)

Recommended method:
1. Authenticate and keep linked project context.
2. Generate a baseline migration from current remote schema (`db pull` workflow).
3. Commit baseline migration.
4. Use migration history repair to align remote migration ledger to the baseline version.
5. Treat `00001–00006` as legacy reference unless individually reconciled and superseded by forward-only migrations.

Why this is safest:
- Avoids replaying incompatible historical migrations over live legacy tables.
- Preserves existing production data and service continuity.
- Creates a clean, auditable starting point for controlled forward evolution.

---

No migrations were applied.
No destructive SQL was generated.
No database modifications were performed.
