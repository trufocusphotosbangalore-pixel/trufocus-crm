# Sprint 3 Assignment Engine Verification

Date: 2026-08-06
Workspace: Trufocus CRM
Scope: Assignment Engine verification only (no Manager/Owner dashboard build)

## 1. Migration Application

Target migration: supabase/migrations/00006_assignment_engine.sql

Execution attempts:
- npx supabase migration list
- npx supabase db push

Result: FAIL
- Supabase CLI returned: Cannot find project ref. Have you run supabase link?
- Current local environment is not linked to a Supabase project, so automated migration apply could not be completed from this workspace.

Impact:
- 00006 could not be confirmed as applied by migration tooling in this environment.

## 2. Tables Verified

Verification method:
- Direct API probe via Supabase JS with .env.local credentials.
- For each table: select id limit 1 and capture status/error.

Results:
- work_orders: PASS (status 200)
- work_order_events: FAIL (PGRST205 not found in schema cache)
- work_order_services: FAIL (PGRST205 not found in schema cache)
- work_order_team_assignments: FAIL (PGRST205 not found in schema cache)
- team_assignments: FAIL (PGRST205 not found in schema cache)
- post_production_tasks: FAIL (PGRST205 not found in schema cache)
- event_schedule: FAIL (PGRST205 not found in schema cache)

Conclusion:
- Only work_orders is currently visible through PostgREST in this target environment.
- Assignment Engine required tables are not currently available for runtime use.

## 3. Foreign Keys Verified

Verification status: FAIL

Reason:
- Runtime DB introspection for constraints is not available through current anon API access.
- Migration 00006 defines team_assignments with text columns but no explicit FOREIGN KEY constraints.

Observed in migration 00006:
- work_order_id exists as text column, but no FK reference to work_orders(id)
- event_id exists as text column, but no FK reference to events/work_order_events
- service_id exists as text column, but no FK reference to work_order_services
- assigned_to_id exists as text column, but no FK reference to employees/user_accounts/team_members

Conclusion:
- Relationship integrity is not enforced by database constraints in the submitted 00006 migration.

## 4. Role Test Matrix

Verification basis:
- Permission resolution path: src/services/permissionService.ts and src/services/teamAccessStore.ts
- Route guard usage: src/components/common/ProtectedRoute.tsx
- Assignment visibility path: src/components/layout/WorkspaceRouter.tsx and src/services/assignmentEngineService.ts

Legend:
- PASS: Behavior aligns with Permission Engine expectation.
- FAIL: Behavior violates or weakens Permission Engine policy.
- PARTIAL: Some checks pass, but critical gaps remain.

### Owner
- Modules: PASS (owner always full access in permission service)
- Assignments: PARTIAL (no dedicated owner assignment view yet, expected for this phase)
- Actions: PASS for full action rights
- Overall: PARTIAL

### Administrator
- Modules: PASS (template exists with broad access)
- Assignments: PARTIAL (no dedicated administrator assignment view)
- Actions: PASS for admin action rights
- Overall: PARTIAL

### Manager
- Modules: PASS (manager template exists; settings limited)
- Assignments: PASS (manager receives full assignment activity feed in WorkspaceRouter)
- Actions: PASS for assignment workflow actions in UI context
- Overall: PASS

### Photographer
- Modules: PASS (restricted module template exists)
- Assignments: PASS (only own assignment records are returned)
- Actions: PASS (can transition own tasks through defined stages)
- Overall: PASS

### Videographer
- Modules: FAIL (no videographer role template in teamAccessStore defaults; unresolved roles fall back to owner template)
- Assignments: PASS (workspace filtering is role aware for assignment task type)
- Actions: FAIL (permission engine fallback can over-grant module/action capability)
- Overall: FAIL

### Photo Editor
- Modules: PASS (template exists)
- Assignments: PASS (own assignments only, role category filtering)
- Actions: PASS (editor workflow actions available)
- Overall: PASS

### Video Editor
- Modules: FAIL (no video_editor template in teamAccessStore defaults; unresolved roles fall back to owner template)
- Assignments: PASS (workspace role category filter exists)
- Actions: FAIL (over-grant risk via owner fallback)
- Overall: FAIL

### Album Designer
- Modules: FAIL (no album_designer template in teamAccessStore defaults; unresolved roles fall back to owner template)
- Assignments: PASS (workspace role category filter exists)
- Actions: FAIL (over-grant risk via owner fallback)
- Overall: FAIL

### Sales
- Modules: FAIL (requested role Sales not represented in default permission templates used by resolver)
- Assignments: PASS (no assignment workspace route exposed)
- Actions: FAIL (fallback owner risk if role id is unresolved)
- Overall: FAIL

### Finance
- Modules: FAIL (requested role Finance not represented in default permission templates used by resolver)
- Assignments: PASS (no assignment workspace route exposed)
- Actions: FAIL (fallback owner risk if role id is unresolved)
- Overall: FAIL

## 5. Test Cases Executed

TC-01 Migration apply via CLI
- Steps: run migration list and db push
- Expected: 00006 applies successfully
- Actual: project not linked, migration not applied
- Result: FAIL

TC-02 Assignment table visibility
- Steps: query team_assignments via Supabase JS
- Expected: table visible
- Actual: PGRST205 not found in schema cache
- Result: FAIL

TC-03 Required assignment-domain table visibility
- Steps: query assignment-related tables
- Expected: all visible
- Actual: only work_orders visible
- Result: FAIL

TC-04 Role permission template resolution
- Steps: inspect default role templates and resolver fallback logic
- Expected: all requested roles have explicit templates
- Actual: multiple requested roles missing, unresolved roles fall back to owner
- Result: FAIL

TC-05 Personal assignment visibility
- Steps: inspect assignmentEngineService identity filters and role category filters
- Expected: photographer/videographer/editors see only own assignments
- Actual: enforced by identity filtering in service
- Result: PASS

TC-06 Permission-guarded route enforcement
- Steps: inspect ProtectedRoute and workspace routing patterns
- Expected: permission service consistently gates module views
- Actual: ProtectedRoute uses permission service, but workspace routing also depends on module_access and role-specific routing paths
- Result: PARTIAL

## 6. Pass/Fail Summary

Overall verification status: FAIL

Gate decision:
- Sprint 3 UI development must NOT begin yet.

## 7. Remaining Defects

D-01 Migration execution blocked
- Severity: Blocker
- Details: Supabase project not linked locally, so 00006 cannot be applied through CLI.

D-02 Required assignment tables not available in runtime schema
- Severity: Blocker
- Details: team_assignments and related normalized assignment tables are missing from PostgREST schema cache in target environment.

D-03 Missing foreign key enforcement in migration 00006
- Severity: High
- Details: team_assignments currently has no FK constraints to work orders, events, services, or assignees.

D-04 Permission resolver over-grant fallback
- Severity: Critical
- Details: unresolved roles fall back to owner template in teamAccessStore getRolePermissionConfig, creating privilege escalation risk.

D-05 Role template gaps for requested matrix roles
- Severity: High
- Details: videographer, video_editor, album_designer, sales, finance are not explicitly represented in default permission templates used by resolver.

D-06 Service-level assignment mutations lack explicit permission guard
- Severity: Medium
- Details: updateAssignmentStage performs state mutation without direct permission checks in the service layer.

## 8. Required Remediation Before UI Sprint Continuation

1. Link Supabase project locally and apply migration 00006 successfully.
2. Add and verify normalized assignment-domain tables in exposed schema.
3. Add foreign key constraints for assignment relationships.
4. Fix role resolver fallback so unknown roles deny by default, not owner fallback.
5. Add explicit templates for all roles in the test matrix.
6. Add service-layer permission checks for assignment state transitions.
7. Re-run this verification matrix and achieve full PASS.
