# TEAM_DIRECTORY_DEFECT_BACKLOG

Source of truth: TEAM_DIRECTORY_QA_REPORT.md only
Scope: Team Directory defect planning only (no implementation)

## Severity-Sorted Defect Backlog

### Critical

#### TD-CRIT-001
1. Defect ID: TD-CRIT-001
2. Title: Create Employee fails when Login Required = Yes (valid email rejected)
3. Module: Team Directory -> Employee Create Wizard -> Login Access
4. Severity: Critical
5. Root Cause: Auth signup path rejects valid-form email; likely malformed payload/path handling before Supabase auth call
6. Files affected:
- Team Directory create flow file(s): Not explicitly named in report
- Auth signup integration path in EmployeeService (named in report)
7. Estimated Fix Complexity: Medium
8. Dependencies:
- Supabase Auth signup behavior
- EmployeeService signup payload normalization
9. Acceptance Criteria:
- Creating employee with Login Required = Yes and valid email succeeds
- No EMPLOYEE_AUTH_CREATE_FAILED for valid email format
- Created account appears consistently in UI and backend
10. Regression Tests Required:
- Create with Login Required = Yes, valid corporate and public-domain emails
- Create with invalid email must fail with correct validation error
- Post-create backend verification check

#### TD-CRIT-002
1. Defect ID: TD-CRIT-002
2. Title: CRUD success in UI does not reliably persist to backend
3. Module: Team Directory -> Employee CRUD persistence
4. Severity: Critical
5. Root Cause: UI state diverges from persistent backend state; potential in-memory duplication/path inconsistency and missing canonical post-action reconciliation
6. Files affected:
- EmployeeService data write/read reconciliation path (named in report)
- Backend verification script evidence: tmp-supabase-team-members.mjs
7. Estimated Fix Complexity: High
8. Dependencies:
- Supabase row-level policies
- Canonical refetch/reconciliation strategy after mutations
9. Acceptance Criteria:
- Create/Edit/Delete outcomes are confirmed by backend refetch before UI success state
- Employee created in UI is present in backend dump
- Deleted employee is absent from backend dump and UI
10. Regression Tests Required:
- CRUD operation + backend confirmation sequence
- Negative tests for failed writes and rollback UI state

### High

#### TD-HIGH-001
1. Defect ID: TD-HIGH-001
2. Title: Duplicate record rendering with repeated React keys
3. Module: Team Directory -> List rendering/data merge
4. Severity: High
5. Root Cause: Duplicate IDs/rows in list rendering and data source merge path produce non-unique keys
6. Files affected:
- Team Directory list rendering file(s): Not explicitly named in report
- EmployeeService fetch/merge path (named in report)
7. Estimated Fix Complexity: High
8. Dependencies:
- Canonical unique-key strategy by primary account ID
- Source merge rules for user_accounts/team_members paths
9. Acceptance Criteria:
- No duplicate key console errors
- No duplicate employee cards for same ID
- All list operations target a single canonical row per employee
10. Regression Tests Required:
- List render test with duplicated source rows
- Key uniqueness assertion and dedupe assertion

#### TD-HIGH-002
1. Defect ID: TD-HIGH-002
2. Title: Employee delete operation is unreliable (employee remains after confirm)
3. Module: Team Directory -> Employee Delete
4. Severity: High
5. Root Cause: Delete confirmation executes but state/backend consistency is not achieved; likely auth/RLS/data merge issues
6. Files affected:
- Team Directory delete action flow file(s): Not explicitly named in report
- EmployeeService delete path (named in report)
7. Estimated Fix Complexity: Medium
8. Dependencies:
- Supabase policy permissions for current role
- Post-delete canonical refetch validation
9. Acceptance Criteria:
- Confirmed delete removes employee from UI and backend
- No orphaned or duplicate row remains for deleted ID
- Clear failure message returned when policy blocks delete
10. Regression Tests Required:
- Delete success test with backend verification
- Delete blocked test with policy-denied response handling

#### TD-HIGH-003
1. Defect ID: TD-HIGH-003
2. Title: Filter correctness failures (role/status/login enabled)
3. Module: Team Directory -> Filters
4. Severity: High
5. Root Cause: Filtering runs over duplicate/stale merged records; non-canonical dataset causes non-matching entries to remain visible
6. Files affected:
- Team Directory filter predicate logic file(s): Not explicitly named in report
- EmployeeService fetch normalization path (named in report)
7. Estimated Fix Complexity: Medium
8. Dependencies:
- Deduplicated canonical dataset
- Stable status/login state source of truth
9. Acceptance Criteria:
- Role filter shows only selected role entries
- Active/Inactive filter shows strictly matching states
- Login Enabled/Disabled filter shows strictly matching states
10. Regression Tests Required:
- Predicate tests for each filter
- Combined filter interactions on mixed dataset

#### TD-HIGH-004
1. Defect ID: TD-HIGH-004
2. Title: Login enable/disable consistency is unreliable
3. Module: Team Directory -> Login Management toggles
4. Severity: High
5. Root Cause: Duplicate records and inconsistent synchronization produce mixed row states after toggle actions
6. Files affected:
- Team Directory login toggle actions file(s): Not explicitly named in report
- EmployeeService login toggle path (named in report)
7. Estimated Fix Complexity: Medium
8. Dependencies:
- Deduplicated canonical records
- Deterministic toggle response handling and refresh
9. Acceptance Criteria:
- Toggle action updates exactly one employee record
- Login state remains consistent across list and detail views
- No mixed-state duplicates after toggle
10. Regression Tests Required:
- Enable/Disable toggle state test
- Multi-action sequence test (disable -> enable -> refresh)

### Medium

#### TD-MED-001
1. Defect ID: TD-MED-001
2. Title: Edit save flow is unstable due modal interaction lock/accessibility
3. Module: Team Directory -> Edit Employee modal
4. Severity: Medium
5. Root Cause: Footer controls become non-actionable/out-of-viewport in observed interaction path
6. Files affected:
- Team Directory edit modal UI file(s): Not explicitly named in report
7. Estimated Fix Complexity: Medium
8. Dependencies:
- Responsive modal layout behavior
- Footer positioning strategy
9. Acceptance Criteria:
- Save and cancel buttons are always reachable and clickable in supported viewports
- Edit changes persist and re-render correctly
10. Regression Tests Required:
- Edit-save test across viewport sizes
- Keyboard and pointer interaction test for modal controls

#### TD-MED-002
1. Defect ID: TD-MED-002
2. Title: Search does not support Mobile
3. Module: Team Directory -> Search
4. Severity: Medium
5. Root Cause: Search predicate currently supports name + employee ID only
6. Files affected:
- Team Directory search predicate file(s): Not explicitly named in report
7. Estimated Fix Complexity: Low
8. Dependencies:
- Canonical searchable fields in employee record
9. Acceptance Criteria:
- Searching by exact/partial mobile returns matching employees
- No false positives outside current filter constraints
10. Regression Tests Required:
- Mobile exact and partial match tests
- Combined search + filters tests

#### TD-MED-003
1. Defect ID: TD-MED-003
2. Title: Search does not support Email
3. Module: Team Directory -> Search
4. Severity: Medium
5. Root Cause: Search predicate currently excludes email
6. Files affected:
- Team Directory search predicate file(s): Not explicitly named in report
7. Estimated Fix Complexity: Low
8. Dependencies:
- Canonical searchable fields in employee record
9. Acceptance Criteria:
- Searching by exact/partial email returns matching employees
- No regressions for name/employee ID search
10. Regression Tests Required:
- Email exact and partial match tests
- Mixed query tests (email + role filter)

#### TD-MED-004
1. Defect ID: TD-MED-004
2. Title: Role-based permission verification is blocked by unstable role-test setup
3. Module: Team Directory -> Permissions/Action visibility
4. Severity: Medium
5. Root Cause: Unavailable authenticated role sessions for all requested roles and unstable role-switch test context
6. Files affected:
- Permission visibility layer: Not explicitly named in report
- Test harness/seed role setup: Not explicitly named in report
7. Estimated Fix Complexity: Medium
8. Dependencies:
- Seed role accounts for Owner/Admin/Manager/Photographer/Videographer/Photo Editor/Video Editor/Album Designer/Sales/Finance
- Deterministic role-switch validation workflow
9. Acceptance Criteria:
- Each role can be validated against expected action visibility
- Destructive actions hidden/blocked where not permitted
10. Regression Tests Required:
- Role matrix visibility tests per role
- Action execution authorization tests per role

#### TD-MED-005
1. Defect ID: TD-MED-005
2. Title: Synchronization verification blocked (Chrome/Edge/Incognito parity not certifiable)
3. Module: Team Directory -> Cross-session sync QA
4. Severity: Medium
5. Root Cause: Tooling session did not provide true independent browser parity run; repeated auth/login inconsistencies impacted repeatability
6. Files affected:
- Cross-browser QA process artifacts: Not explicitly named in report
7. Estimated Fix Complexity: Medium
8. Dependencies:
- Real desktop browser sessions (Chrome/Edge/Incognito)
- Shared seed user/session data and timestamped mutation logs
9. Acceptance Criteria:
- Employee count/details/permissions/login state match across all three sessions
- Mutation in one session propagates to others within expected realtime window
10. Regression Tests Required:
- Cross-session parity checklist run
- Mutation propagation timing checks

#### TD-MED-006
1. Defect ID: TD-MED-006
2. Title: Realtime listener initialization errors reduce sync reliability
3. Module: Realtime synchronization lifecycle
4. Severity: Medium
5. Root Cause: Realtime callback registration attempted after subscribe lifecycle point
6. Files affected:
- Realtime listener initialization path: Not explicitly named in report
7. Estimated Fix Complexity: Medium
8. Dependencies:
- Correct subscription lifecycle ordering
- Listener registration idempotency guard
9. Acceptance Criteria:
- No "cannot add postgres_changes callbacks ... after subscribe()" errors
- Realtime updates continue working after navigation/reconnect
10. Regression Tests Required:
- Realtime subscribe/unsubscribe lifecycle test
- Navigation/reconnect listener re-registration test

### Low

#### TD-LOW-001
1. Defect ID: TD-LOW-001
2. Title: Repeat-login reliability for QA reruns is inconsistent in test sessions
3. Module: QA environment/session bootstrap
4. Severity: Low
5. Root Cause: Invalid credential responses occurred in repeated demo sign-in attempts during tooling session
6. Files affected:
- QA credential/bootstrap process: Not explicitly named in report
7. Estimated Fix Complexity: Low
8. Dependencies:
- Stable demo-user login setup for repeated QA runs
9. Acceptance Criteria:
- Re-running manual QA can authenticate deterministically for configured test users
10. Regression Tests Required:
- Repeated login attempts test in same and new sessions

---

## Sprint Plan

### Sprint 3.2 (Critical Defects Only)
Defects:
- TD-CRIT-001
- TD-CRIT-002

Goal:
- Restore reliable employee creation with login-enabled path
- Enforce backend-confirmed CRUD persistence consistency

Exit Criteria:
- Both critical defects accepted and regression tests passing
- No new features introduced

### Sprint 3.3 (High Defects)
Defects:
- TD-HIGH-001
- TD-HIGH-002
- TD-HIGH-003
- TD-HIGH-004

Goal:
- Eliminate duplicate rendering/state corruption
- Stabilize delete and login toggle behavior
- Make role/status/login filters strictly accurate

Exit Criteria:
- All high-severity defects accepted and regression tests passing
- No new features introduced

### Sprint 3.4 (Medium + Low Defects)
Defects:
- TD-MED-001
- TD-MED-002
- TD-MED-003
- TD-MED-004
- TD-MED-005
- TD-MED-006
- TD-LOW-001

Goal:
- Resolve modal edit reliability and search coverage gaps
- Certify permissions/synchronization testability and realtime stability
- Improve QA rerun reliability

Exit Criteria:
- All medium/low defects accepted and regression tests passing
- No new features introduced

---

## Policy Note
No new features should be planned or implemented until all Critical and High defects (Sprint 3.2 and Sprint 3.3) are resolved and verified.
