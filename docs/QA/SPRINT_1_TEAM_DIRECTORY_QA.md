# Sprint 1 Team Directory QA Checklist

Status: Official QA checklist for Sprint 1 (updated for Sprint 2 implementation validation)

Purpose: Validate the new Team Directory Preview before it replaces the existing Team Login Access page.

Primary test target:
- DEV preview route: `/dev/team-directory-preview`

---

## Section 1: UI Validation

Mark each item as Pass/Fail with notes and evidence links (screenshots, recordings, console logs).

- [ ] Team Directory loads.
- [ ] Search works.
- [ ] Filters work.
- [ ] Roles filter works.
- [ ] Status filter works.
- [ ] Export CSV button.
- [ ] Invite User button.
- [ ] Add Team Member button.
- [ ] Responsive layout.

Test notes:
- Environment:
- Build/version:
- Tester:
- Date/time:

---

## Section 2: Add Team Member Wizard

Verify all six steps are present and functionally correct.

Steps:
1. Engagement
2. Login
3. Contact
4. Workspace Role
5. Details
6. Review

Checklist:
- [ ] Step 1 (Engagement) renders and validates expected fields.
- [ ] Step 2 (Login) renders and validates expected fields.
- [ ] Step 3 (Contact) renders and validates expected fields.
- [ ] Step 4 (Workspace Role) renders and validates expected fields.
- [ ] Step 5 (Details) renders and validates expected fields.
- [ ] Step 6 (Review) renders summary correctly.
- [ ] Previous navigation works correctly across all steps.
- [ ] Next navigation works correctly across all steps.
- [ ] Validation blocks invalid progression.
- [ ] Final submit enabled only when required fields are valid.

Test notes:
- Edge cases tested:
- Validation behavior:

---

## Section 3: Supabase

Verify data persistence behavior and storage boundaries.

- [ ] Employee saved in Supabase.
- [ ] No localStorage writes.
- [ ] EmployeeService used.

Evidence required:
- [ ] Supabase table row proof (record ID, timestamp).
- [ ] Browser storage inspection (no localStorage writes for this flow).
- [ ] Network or log trace showing EmployeeService path.

---

## Section 4: Authentication

Verify account creation rules and consistency.

- [ ] Optional Login behavior validated.
- [ ] Supabase Auth account created only when Login Enabled.
- [ ] No orphan users.

Evidence required:
- [ ] Auth user state for login-enabled path.
- [ ] No auth user created when login disabled.
- [ ] Referential consistency between app employee record and auth user.

---

## Section 5: Workspace

Verify automatic routing mapping correctness.

Workspace Role
↓
Correct Workspace

Checklist:
- [ ] Role-to-workspace mapping is automatic.
- [ ] Each tested role lands in correct workspace.
- [ ] Fallback behavior is correct for undefined or unsupported role values.

Matrix (fill during QA):
- [ ] owner →
- [ ] administrator →
- [ ] manager →
- [ ] photographer →
- [ ] videographer →
- [ ] photo_editor →
- [ ] video_editor →
- [ ] album_designer →
- [ ] data_operator →
- [ ] finance →
- [ ] sales_executive →
- [ ] client_manager →

---

## Section 6: Permissions

Verify permission behavior and module visibility.

- [ ] Permission profile applied.
- [ ] Sidebar generated correctly.
- [ ] Unauthorized modules hidden.

Checklist details:
- [ ] Allowed modules are visible and accessible.
- [ ] Disallowed modules are hidden or blocked consistently.
- [ ] Direct URL access to unauthorized modules is denied correctly.

---

## Section 7: Synchronization

Verify cross-browser consistency of employee list state.

Required environments:
- Chrome
- Edge
- Firefox
- Incognito

Checklist:
- [ ] Chrome shows expected employee list.
- [ ] Edge shows expected employee list.
- [ ] Firefox shows expected employee list.
- [ ] Incognito shows expected employee list.
- [ ] Lists are identical across all four environments.
- [ ] Real-time updates converge consistently across all sessions.

---

## Section 8: Negative Tests

Run each negative test and record expected vs actual behavior.

- [ ] Duplicate Email
- [ ] Duplicate Employee ID
- [ ] Missing Mobile
- [ ] Missing Role
- [ ] Missing Workspace
- [ ] Disabled Login
- [ ] Invalid Password

For each failed input, verify:
- [ ] User sees clear validation or error feedback.
- [ ] Invalid record is not persisted unexpectedly.
- [ ] No partial/orphan auth or employee records remain.

---

## Section 9: Performance

Measure and record values for representative dataset sizes.

Metrics:
- [ ] Load time
- [ ] Save time
- [ ] Search speed
- [ ] Filter speed

Capture format:
- Dataset size:
- Browser:
- Network condition:
- Device:
- Metric values:

Pass criteria (fill by QA lead):
- [ ] Load time within threshold:
- [ ] Save time within threshold:
- [ ] Search speed within threshold:
- [ ] Filter speed within threshold:

---

## Section 10: GO / NO-GO

Decision rule:

The old Team Login page may be replaced ONLY if every checklist item passes.

Otherwise the migration is blocked.

Final decision:
- [ ] GO
- [ ] NO-GO

Sign-off:
- QA Lead:
- Engineering Lead:
- Product Owner:
- Date:
- Notes:
