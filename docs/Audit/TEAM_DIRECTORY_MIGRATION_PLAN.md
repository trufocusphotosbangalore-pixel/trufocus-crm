# Team Directory Migration Plan (Post Sprint 1 Verification)

Status: Draft only. Do not execute replacement yet.

## Preconditions (All must be complete)

- Authentication verified
- Employee synchronization verified
- Permission engine verified
- Workspace routing verified
- Cross-browser testing passed

## Scope

- Replace existing Team Login Access UI with Team Directory UI.
- Keep Supabase as the source of truth through EmployeeService.
- Preserve existing security and permission controls.

## Current State

- Existing production page remains active in Team Access:
  - `TeamLoginAccessTab`
- New development-only preview route exists:
  - `/dev/team-directory-preview` (DEV only)

## Migration Steps (Execute only after preconditions pass)

1. Enable feature flag for controlled rollout.
2. Integrate Team Directory actions with verified PermissionService checks.
3. Integrate edit/delete/bulk actions with EmployeeService and audit logging.
4. Add parity tests for existing Team Login Access behaviors.
5. Run staging validation with realistic role permutations.
6. Roll out to production behind flag.
7. Monitor logs and sync health for 7 days.
8. Remove legacy TeamLoginAccessTab only after stable observation window.

## Rollback Plan

- Keep legacy page import and route path available during rollout.
- Switch feature flag off to restore legacy UI instantly.
- No schema rollback required for UI-only switchover.

## Verification Checklist Before Cutover

- Auth sign-in/out and session restore pass.
- Realtime employee updates reflect across tabs.
- Role-based access checks enforce expected visibility/actions.
- Route guards and redirects behave identically.
- Chrome, Edge, Firefox pass exploratory and regression checks.
