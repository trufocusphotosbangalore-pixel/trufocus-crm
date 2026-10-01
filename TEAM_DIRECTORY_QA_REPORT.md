# TEAM_DIRECTORY_QA_REPORT

Date: 2026-08-06
Environment: Local dev server (Vite), URL http://localhost:4173
Module: Settings -> Team Access & Permissions -> Team Directory
Execution Type: Evidence-based manual QA (no feature implementation)

## Screenshot Index
- SS-01: Login screen with Admin quick autofill.
- SS-02: Dashboard after sign-in (Owner session).
- SS-03: Add Team Member wizard opened (step 1).
- SS-04: Create flow (Login Required = Yes) failure context.
- SS-05: Team Directory after CRUD/login action execution.
- SS-06: Post-delete attempt state (QA employee still present).
- SS-07: Team Directory state used for filter/search/role evidence.

## Console Error Summary (Observed)
- Repeated React key collisions:
  - "Encountered two children with the same key ..."
  - Repeated keys observed: acc_1785937951140, acc_admin_owner, acc_1786006838435
- Realtime listener errors:
  - "cannot add postgres_changes callbacks ... after subscribe()"
- Auth/API errors:
  - 400 Invalid login credentials in some sessions
  - 401 responses during employee operations
- RLS errors:
  - "new row violates row-level security policy for table user_accounts"

---

## TEST 1 - Employee CRUD

### Create Employee
- Case A: Login Required = Yes
  - Result: FAIL
  - Evidence: SS-04
  - Console / UI: EMPLOYEE_AUTH_CREATE_FAILED: Email address "qa.employee8061@example.com" is invalid
  - Root cause: Auth signup path rejects valid-form email in current flow (likely malformed payload/path handling before Supabase auth call)
  - Proposed fix: Normalize and validate email at service boundary; log exact Supabase auth request payload fields; add integration test for signUp with standard addresses

- Case B: Login Required = No
  - Result: PASS (UI)
  - Evidence: SS-05
  - Console: RLS and key collision noise still present
  - DB verification: FAIL (see TEST 8 / backend evidence)
  - Root cause note: UI shows created row(s), but backend persistence is inconsistent

### Edit Employee
- Result: FAIL
- Evidence: SS-05 (edit action area) + observed modal interaction lock
- Console errors: repeated key collision errors
- Root cause: Edit modal footer controls become non-actionable/out-of-viewport in current interaction path (Save Changes unreachable in this run)
- Proposed fix: Ensure modal footer stays fixed/visible in viewport; add Playwright test for edit-save on common viewport sizes

### Disable Employee
- Result: PASS (behavioral)
- Evidence: Post-action snapshot showed inactive state and Reactivate action
- Console errors: repeated key collisions

### Enable Employee
- Result: PASS (behavioral, with data inconsistency caveat)
- Evidence: Reactivate action toggled at least one QA row back to Active
- Caveat: Duplicate rows remained with mixed states
- Root cause for caveat: Duplicate IDs/rows in list rendering and data source
- Proposed fix: de-duplicate records by primary key before render; enforce unique IDs in source merge logic

### Delete Employee
- Result: FAIL
- Evidence: SS-06 (QA employee still present after confirmed delete)
- Console errors: 401 + ongoing data sync noise
- Root cause: Delete confirmation executes but state/backend consistency not achieved; likely auth/RLS/data merge issues
- Proposed fix: Verify delete policy permissions in Supabase for current role, and require post-delete fetch confirmation by ID absence

### Verify database updates correctly
- Result: FAIL
- Evidence: Direct backend dump (tmp-supabase-team-members.mjs output) did not show EMP-QA8061/qa.employee8061@example.com
- Root cause: UI state appears ahead of or divergent from persistent backend state; potential local in-memory duplication path
- Proposed fix: Treat create/update/delete as successful only after confirmed refetch from canonical table and ID reconciliation

---

## TEST 2 - Login Management

### Login Required = Yes
- Result: FAIL
- Evidence: SS-04
- Root cause: Auth create path failure (invalid email error on valid email)
- Proposed fix: Fix signup payload/validation path and add regression test

### Login Required = No
- Result: PASS (UI)
- Evidence: SS-05 (QA row showed Login Off)

### Reset Password
- Result: PASS
- Evidence: Temporary password modal shown ("Temporary Password Generated") and activity log item recorded
- Console: background 401 noise persisted

### Disable Login / Enable Login
- Result: PARTIAL FAIL
- Evidence: Mixed row states due duplication; enable/disable visible and triggerable but consistency uncertain
- Root cause: Duplicate records and inconsistent synchronization
- Proposed fix: canonical source + dedupe on fetch; operation response should target unique account record only

### Invitation Email flow
- Result: PASS (flow trigger)
- Evidence: status toast "Invitation email sent to owner@trufocusphotos.com"
- Caveat: Triggered on selected card context with noisy duplicate UI

---

## TEST 3 - Search

### Name
- Result: PASS
- Evidence: Query "QA Employee 8061" returned matches

### Employee ID
- Result: PASS
- Evidence: Query "EMP-QA8061" returned matches

### Mobile
- Result: FAIL
- Evidence: Query by mobile via available search inputs returned no matches
- Root cause: Current implementation supports name + employee ID filtering only
- Proposed fix: Extend search predicate to include mobile and email

### Email
- Result: FAIL
- Evidence: Query by email returned no matches
- Root cause: Current implementation does not include email in search predicate
- Proposed fix: Extend search predicate to include email

---

## TEST 4 - Filters

### Workspace Role
- Result: FAIL
- Evidence: Role filter retained non-matching entries in observed state (owner filter still showed QA entries)
- Root cause: Filtering + duplicate merged records produce inconsistent visible output
- Proposed fix: Filter against canonical normalized dataset and unique keys

### Employment Type
- Result: PASS (basic)
- Evidence: In-House filtering returned entries (all observed sample entries were in-house)

### Active / Inactive
- Result: FAIL
- Evidence: Inactive filter still surfaced mixed states in duplicated rows
- Root cause: Duplicate/stale records and status inconsistency
- Proposed fix: Normalize records and enforce latest state only

### Login Enabled
- Result: PARTIAL FAIL
- Evidence: Login enabled filter returned inconsistent mixed states due duplicates
- Proposed fix: Same dedupe/canonicalization fix

---

## TEST 5 - Employee Details

Tabs verified for rendered navigation and panel switching:
- Overview: PASS
- Assignments: PASS
- Calendar: PASS
- Permissions: PASS
- Equipment: PASS
- Documents: PASS
- Activity: PASS

Evidence:
- Details page showed all tabs and successful switching
- Activity panel showed generated events (password reset, invitation sent, profile events)

Caveat:
- Due duplicate-list instability, detail context may switch to wrong matching card in some interactions

---

## TEST 6 - Permissions (Role-based Action Visibility)

Roles requested:
- Owner
- Administrator
- Manager
- Photographer
- Videographer
- Photo Editor
- Video Editor
- Album Designer
- Sales
- Finance

Result: FAIL / BLOCKED
- Could not fully validate all requested roles in this run due unavailable authenticated role sessions for every role and unstable role-switch context in Settings view
- Observed concern: destructive action buttons (Delete) broadly visible in list cards while backend outcomes are inconsistent

Proposed fix:
- Add deterministic role-switch test harness in settings (or seed role accounts)
- Add automated permission matrix tests asserting per-role action visibility and action execution policy

---

## TEST 7 - Synchronization (Chrome / Edge / Incognito)

Result: FAIL / BLOCKED
- Tooling session did not provide true Chrome+Edge+Incognito independent browser verification
- Additional new sessions hit login/auth inconsistencies (invalid credential in repeated demo sign-ins)

Proposed fix:
- Run this test on real desktop browsers manually with shared seed account and synchronized timestamp logs
- Add server-side audit IDs for each employee mutation to verify cross-session propagation

---

## TEST 8 - Backend

### EmployeeService only
- Result: PASS (code evidence)
- Evidence: Team Directory routes through EmployeeService calls (fetch/create/update/delete/login actions)

### Supabase only
- Result: PASS (code evidence)
- Evidence: EmployeeService uses Supabase client for CRUD/auth/realtime

### No localStorage employee persistence
- Result: PASS (employee-service scope)
- Evidence: Employee service login/audit uses in-memory caches (LOGIN_HISTORY_CACHE, LOGIN_AUDIT_CACHE) and localStorage employee keys marked DISABLED
- Note: App still uses localStorage for other modules (business profile/work orders/payments/test role), which is outside Team Directory employee persistence scope

---

## TEST 9 - Performance

Measured (current run):
- Page load (DOMContentLoaded): ~1060 ms
- Create employee (Login Required = No path): ~2291 ms
- Edit employee: NOT COMPLETED (blocked by modal interaction defect in this run)
- Search: ~338 ms
- Filter: ~385 ms

Assessment:
- Search/filter latency is acceptable in this local run
- CRUD reliability issues are higher priority than raw performance

---

## Defects Summary

1. Create fails when Login Required = Yes (valid email rejected)
- Severity: Critical
- Impact: Blocks account creation with login

2. Backend persistence mismatch / QA employee not reliably present in DB dump
- Severity: Critical
- Impact: Data integrity risk

3. Duplicate record rendering with repeated keys
- Severity: High
- Impact: Incorrect UI state, wrong-row operations, filter inaccuracies

4. Filter correctness issues (role/status/login enabled)
- Severity: High
- Impact: Operational misfiltering

5. Delete operation not reliably removing employee
- Severity: High
- Impact: Admin control failure

6. Edit-save interaction instability (modal control accessibility)
- Severity: Medium
- Impact: Edit flow reliability

7. Role-based permissions testability gaps
- Severity: Medium
- Impact: Cannot certify role action isolation

8. Realtime listener initialization errors
- Severity: Medium
- Impact: Sync reliability risk

---

## Recommended Fixes (Not Implemented)

1. Canonicalize employee dataset before render
- Merge source rows by unique ID and discard duplicates before UI mapping

2. Harden create/update/delete confirmation with post-action refetch checks
- Mark success only when canonical refetch confirms mutation outcome

3. Fix Login Required = Yes auth create pipeline
- Validate/normalize email + inspect Supabase auth payload and response path

4. Correct filters to run on canonical unique list only
- Add unit tests for role/type/status/login predicates

5. Ensure modal footer actions are always accessible
- Sticky footer + responsive viewport test coverage

6. Stabilize realtime channel subscription lifecycle
- Prevent duplicate on() registration after subscribe()

7. Add role-based automated permission tests
- Assert action visibility and action execution for all listed roles

8. Repeat sync verification on real Chrome/Edge/Incognito outside integrated browser tooling

---

## Final Status
Team Directory Sprint 3.1 QA is NOT ready for sign-off in current state.
Primary blockers are CRUD reliability, backend consistency, duplicate rendering/state integrity, and incomplete role/sync verification.
