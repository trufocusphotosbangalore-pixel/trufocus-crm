# Team Login Rebuild Plan

This document defines an architecture-only rebuild plan for Team Login in Trufocus CRM.
It describes the new service structure, canonical data flow, and migration/testing plan required to move from the current dual-path login/identity design to a clean, single source of truth.

## Objectives

- Eliminate duplicate login and identity flows.
- Centralize employee identity and permission evaluation.
- Make Supabase the canonical source of truth for employee and access data.
- Keep UI components dependent on services and derived state, not local caches.
- Support consistent multi-device and team workflows.

## Architecture Components

### One EmployeeService

Purpose:
- Own employee directory data, team membership metadata, status, roles, and profile details.
- Provide employee lifecycle operations such as create, update, disable, and read employee profiles.
- Expose only employee-specific data and team account metadata.

Responsibilities:
- Fetch employee records from the canonical employee table.
- Normalize employee profile, team assignment, and status information.
- Surface employee metadata used by team management and permission mapping.
- Do not perform authentication or session management.

### One AuthService

Purpose:
- Own authentication, session lifecycle, and identity validation.
- Provide login, logout, session refresh, and current identity context.
- Enforce that only one auth flow exists in the application.

Responsibilities:
- Authenticate users against Supabase Auth.
- Resolve the active employee identity and current tenant context.
- Provide current user identity claims to UI and permission services.
- Manage auth state transitions and session persistence consistently.

### One PermissionService

Purpose:
- Own permission evaluation and access decisions across the app.
- Provide module access, route authorization, and UI affordance decisions.

Responsibilities:
- Evaluate permissions using employee role assignments and policy definitions.
- Expose `canAccessModule`, `canPerformAction`, and route guard decisions.
- Derive permissions from a single, canonical permission definition source.
- Avoid duplicating permission logic in UI components.

### One WorkspaceRouter

Purpose:
- Own workspace route resolution and tenant/workspace context boundaries.
- Provide the route graph for employee and team workspace experiences.

Responsibilities:
- Route authenticated users into the correct workspace context.
- Enforce auth and permission guard integration with AuthService and PermissionService.
- Keep routing concerns separate from UI presentation.
- Provide a single entry point for workspace-specific navigation and route protection.

### One SidebarGenerator

Purpose:
- Own sidebar navigation structure and visibility decisions.
- Generate UI navigation items based on permissions and workspace context.

Responsibilities:
- Query PermissionService for sidebar visibility rules.
- Use AuthService identity context to determine active user context.
- Return a canonical sidebar model to the layout layer.
- Do not implement permission rules or auth checks itself.

### One Employee Table

Purpose:
- Provide a single canonical employee table in Supabase as the source of truth.
- Store employee identity metadata, role assignment keys, status, and workspace membership.

Responsibilities:
- Hold the authoritative employee directory and team membership data.
- Persist references to Supabase Auth user IDs.
- Include audit metadata such as created/updated timestamps and tenant association.
- Serve both identity queries and employee profile reads.

### One Source of Truth

The canonical source of truth is:
- Supabase Auth for authentication state and active session identity.
- Supabase employee table for employee directory and team membership data.
- Permission definitions stored centrally and evaluated by PermissionService.

Principles:
- No local shadow caches for employee or permission state outside transient UI state.
- UI derives state from service APIs that read the canonical Supabase-backed source.
- Any local browser persistence must be for UX-only state, not for definitive identity or access control.

## Rebuild Architecture

1. AuthService is the exclusive auth and session manager.
2. EmployeeService is the exclusive employee directory manager.
3. PermissionService is the exclusive permission evaluator.
4. WorkspaceRouter uses AuthService/PermissionService to resolve routes.
5. SidebarGenerator uses PermissionService to build navigation.
6. UI components consume service outputs, not local entitlements.
7. Supabase employee table is the single employee source of truth.

## Migration Plan

### Phase 1: Define canonical contracts

- Document EmployeeService, AuthService, PermissionService, WorkspaceRouter, and SidebarGenerator APIs.
- Map existing data flows to these services.
- Identify all current localStorage shadow state keys and their purpose.

### Phase 2: Centralize identity and permission read paths

- Move all employee list reads to EmployeeService and Supabase employee table.
- Move all login/session reads to AuthService and Supabase Auth.
- Move all permission checks to PermissionService.

### Phase 3: Remove duplicate caches

- Stop relying on `trufocus_crm_user_accounts_v1` for employee visibility.
- Stop using localStorage for permission/role decision state as a source of truth.
- Only keep ephemeral UI state, if needed, for page refresh optimization.

### Phase 4: Implement service-driven UI composition

- Redirect sidebar generation to SidebarGenerator.
- Redirect route guards to WorkspaceRouter and PermissionService.
- Ensure employee management UI uses EmployeeService exclusively.

### Phase 5: Roll out migration with backward compatibility

- Introduce the new service interfaces while preserving current behavior.
- Run both legacy and new paths in read-only mode to validate results.
- Incrementally switch UI modules to new service outputs.

### Phase 6: Cut over and remove legacy flow

- Disable legacy local shadow login and team login store behavior.
- Remove stale localStorage- and role-store-based auth/employee logic.
- Validate that no UI component still depends on legacy cache keys.

## Testing Plan

### Unit testing

- AuthService
  - Validate login/logout/session refresh logic.
  - Validate identity resolution from Supabase Auth claims.

- EmployeeService
  - Validate employee record reads, create/update operations, and team membership resolution.
  - Validate employee profile normalization and status handling.

- PermissionService
  - Validate module access decisions for role-based and policy-based scenarios.
  - Validate denial cases and edge conditions.

- WorkspaceRouter
  - Validate route resolution for authenticated and unauthenticated flows.
  - Validate permission-based route blocking.

- SidebarGenerator
  - Validate navigation item visibility by permission set and workspace context.

### Integration testing

- End-to-end scenario: user signs in, employee list loads from EmployeeService, and sidebar renders according to permissions.
- Multi-device scenario: create employee in one session, refresh team list in another session, verify new employee appears.
- Access control scenario: user with restricted role is blocked from protected routes and hidden sidebar items.

### Migration validation

- Compare legacy employee list output to new EmployeeService output for the same tenant.
- Compare legacy permission decisions to PermissionService decisions for current roles.
- Validate that legacy localStorage state is no longer required for fresh page load.

### Regression validation

- Validate all current team login and employee management workflows still function.
- Validate logout and session expiration behavior.
- Validate that permission and sidebar behavior remain consistent after the migration.

## Success Criteria

- Single AuthService handles all login and session state.
- Single EmployeeService handles all employee directory data.
- Single PermissionService handles all access evaluation.
- UI no longer depends on duplicate localStorage identity or permission caches.
- Employee list and access rights are consistent across devices.
- Supabase remains the canonical source of truth for employee identity and permissions.
