# Team Login & Identity Audit

This audit covers all files involved in login, logout, team login access, employee lifecycle management, role and permission handling, sidebar generation, route protection, authentication, session management, Supabase Auth, and employee synchronization.

## Summary

The system currently has two overlapping authentication/identity flows:
- `src/services/supabase/auth.ts` + `src/hooks/useAuth.ts` for Supabase Auth and browser session handling.
- `src/services/teamLoginStore.ts` + `src/services/employeeService.ts` for local shadow login and employee management.

There is also a permission engine in `src/services/teamAccessStore.ts` and permission-aware UI in `src/components/common/ProtectedModuleRoute.tsx`, `src/components/layout/Sidebar.tsx`, and route guards.

Several files read and write legacy localStorage-based employee data and role configurations that duplicate Supabase-sourced identity state.

---

## Files Audited

### 1. `src/services/supabase/auth.ts`
- Purpose: Supabase authentication wrapper, session retrieval, password reset, password update, and profile lookup across `team_members`, `user_accounts`, and `profiles`.
- Functions exported:
  - `signIn`
  - `signOut`
  - `resetPasswordForEmail`
  - `updatePassword`
  - `getSession`
  - `getProfile`
- Supabase tables used:
  - `team_members`
  - `user_accounts`
  - `profiles`
- Reads from:
  - Supabase
  - localStorage
- Writes to:
  - localStorage (`trufocus_session_user_v1`)
- Duplicate logic exists:
  - Yes. It overlaps with employee login and profile state held in `teamLoginStore` / `employeeService`.

### 2. `src/hooks/useAuth.ts`
- Purpose: Auth context provider, load authenticated user profile, listen for Supabase auth state changes, and expose auth actions.
- Functions exported:
  - `useAuthProvider`
  - `useAuth`
- Supabase tables used:
  - none directly, but it calls `authService` which reads Supabase.
- Reads from:
  - localStorage (`trufocus_session_user_v1`)
  - React Context (consumed by `useAuth`)
- Writes to:
  - localStorage (removes `trufocus_session_user_v1` on sign out)
- Duplicate logic exists:
  - Yes. Maintains session state via localStorage and Supabase Auth while separate employee stores also manage login state.

### 3. `src/services/teamLoginStore.ts`
- Purpose: Login validation and persisted user account read/write bridge for team accounts.
- Functions exported:
  - `asyncValidateUserLogin`
  - `validateUserLogin`
  - plus all exports from `./employeeService`
- Supabase tables used:
  - indirectly via `fetchAllEmployeesFromCloud()` from `employeeService`
- Reads from:
  - localStorage (`trufocus_crm_user_accounts_v1`)
- Writes to:
  - none directly (unless through `employeeService` helpers)
- Duplicate logic exists:
  - Yes. It validates login using local shadow account data instead of Supabase Auth, creating a parallel login flow.

### 4. `src/services/employeeService.ts`
- Purpose: Employee account CRUD, Supabase synchronization, shadow local storage cache, user account creation, update, deletion, password reset, and audit logging.
- Functions exported:
  - `fetchAllEmployeesFromCloud`
  - `loadAllUserAccounts`
  - `pushEmployeeToCloudDB`
  - `generateEmployeeIdFromCloud`
  - `generateEmployeeId`
  - `createEmployeeInCloud`
  - `createUserAccount`
  - `updateEmployeeInCloud`
  - `updateUserAccount`
  - `deleteEmployeeFromCloud`
  - `deleteUserAccount`
  - `resetAllEmployeesToOwnerOnly`
  - `resetToOnlyOwnerAccount`
  - `subscribeToEmployeeRealtimeChanges`
  - `generateSecurePassword`
  - `suggestUsername`
  - `loadLoginHistory`
  - `addLoginHistory`
  - `loadLoginAuditLogs`
  - `logLoginAudit`
  - `resetUserPassword`
  - `revealUserPasswordLog`
  - `unlockUserAccount`
  - `toggleAccountLogin`
  - `bulkActivateUsers`
  - `bulkDeactivateUsers`
  - `bulkResetPasswords`
  - `bulkDeleteUsers`
- Supabase tables used:
  - `user_accounts`
  - `team_members`
  - indirectly `auth.users` during sign-up
- Reads from:
  - localStorage (`trufocus_crm_user_accounts_v1`)
  - Supabase
- Writes to:
  - Supabase (user_accounts, team_members)
  - localStorage (`trufocus_crm_user_accounts_v1`, and shadow copies)
- Duplicate logic exists:
  - Yes. It replicates employee auth state in localStorage and in both `user_accounts` and `team_members` tables.

### 5. `src/services/teamAccessStore.ts`
- Purpose: Permission engine, role definitions, active role persistence, role CRUD, user role assignments, and audit logs.
- Functions exported:
  - `loadAllRoleConfigs`
  - `saveAllRoleConfigs`
  - `getActiveRoleId`
  - `setActiveRoleId`
  - `loadUserAssignments`
  - `saveUserAssignments`
  - `loadAuditLogs`
  - `logPermissionAction`
  - `createCustomRole`
  - `getRolePermissionConfig`
  - `getModulePermissions`
  - `canUserAccessModule`
  - `duplicateRole`
  - `deleteRole`
  - `renameRole`
  - `resetRoleToDefaults`
  - `canUserPerformDelete`
  - `canUserDeleteWorkOrder`
  - `canUserDeleteEnquiry`
- Supabase tables used:
  - none directly, but syncs roles via `pushEntityToCloud` in `cloudSyncService` on local role changes.
- Reads from:
  - localStorage (`trufocus_crm_roles_v1`, `trufocus_crm_active_test_role_v1`, `trufocus_crm_member_roles_v1`, `trufocus_crm_permission_audit_logs_v1`)
- Writes to:
  - localStorage (various permission and role state keys)
- Duplicate logic exists:
  - Yes. Role/permission data are persisted locally and shadowed to Supabase, creating a separate local permission store from the Supabase-backed identity model.

### 6. `src/hooks/useTeamPermissions.ts`
- Purpose: Hook exposing active role, permission checks, module access, and refresh behavior.
- Functions exported:
  - `useTeamPermissions`
- Supabase tables used:
  - none directly
- Reads from:
  - localStorage via `loadAllRoleConfigs()` and `getActiveRoleId()`
  - React state
- Writes to:
  - none directly (`setActiveRoleId` updates localStorage)
- Duplicate logic exists:
  - Yes. It duplicates permission decisions using localStorage-based role configs separate from any Supabase-permission model.

### 7. `src/components/common/ProtectedRoute.tsx`
- Purpose: Guard route access based on authenticated session state.
- Functions exported:
  - `ProtectedRoute`
- Supabase tables used:
  - none directly
- Reads from:
  - React Context via `useAuth`
- Writes to:
  - none
- Duplicate logic exists:
  - No, this is a route guard for authenticated access only.

### 8. `src/components/common/ProtectedModuleRoute.tsx`
- Purpose: Module-level route guard based on module permissions and user module access.
- Functions exported:
  - `ProtectedModuleRoute`
- Supabase tables used:
  - none directly
- Reads from:
  - React Context via `useAuth`
  - localStorage-derived permission state via `useTeamPermissions`
- Writes to:
  - none
- Duplicate logic exists:
  - Yes. It uses both `user.module_access` and the permission hook, bypassing a single centralized permission engine.

### 9. `src/components/common/RouteGuard.tsx`
- Purpose: Route guard for authentication and public route redirect behavior.
- Functions exported:
  - `ProtectedRoute`
  - `PublicRoute`
- Supabase tables used:
  - none directly
- Reads from:
  - React Context via `useAuth`
- Writes to:
  - none
- Duplicate logic exists:
  - No.

### 10. `src/components/layout/Sidebar.tsx`
- Purpose: Sidebar navigation generation based on permission state and active user role.
- Functions exported:
  - `Sidebar`
- Supabase tables used:
  - none directly
- Reads from:
  - React Context via `useAuth`
  - localStorage-derived permissions via `useTeamPermissions`
- Writes to:
  - none
- Duplicate logic exists:
  - Yes. Sidebar visibility is computed using both `user.module_access` and `canAccessModule`,混ating role-derived labels with permissions.

### 11. `src/pages/auth/Login.tsx`
- Purpose: Login page UI and email/username resolution flow.
- Functions exported:
  - default `Login`
- Supabase tables used:
  - `team_members` (direct query in login resolution)
- Reads from:
  - Supabase
  - localStorage indirectly through `signIn`
- Writes to:
  - none directly (but `signIn` writes session profile to localStorage)
- Duplicate logic exists:
  - Yes. Resolves username/email via `team_members` directly and then invokes Supabase Auth, while team login logic also exists independently.

### 12. `src/pages/auth/ForgotPassword.tsx`
- Purpose: Forgot password UI and password reset initiation.
- Functions exported:
  - default `ForgotPassword`
- Supabase tables used:
  - none directly
- Reads from:
  - React Context via `useAuth`
- Writes to:
  - none directly
- Duplicate logic exists:
  - No significant duplicate beyond `useAuth` calling `authService`.

### 13. `src/pages/auth/ResetPassword.tsx`
- Purpose: Reset password UI for authenticated session.
- Functions exported:
  - default `ResetPassword`
- Supabase tables used:
  - none directly
- Reads from:
  - React Context via `useAuth`
- Writes to:
  - none directly
- Duplicate logic exists:
  - No.

### 14. `src/pages/settings/TeamLoginAccessTab.tsx`
- Purpose: UI for managing team login accounts, password resets, user activation, and login audit history.
- Functions exported:
  - default `TeamLoginAccessTab`
- Supabase tables used:
  - none directly, but service helpers write to Supabase indirectl
- Reads from:
  - localStorage-derived user accounts via `loadAllUserAccounts()`
  - localStorage-derived login history and audits
- Writes to:
  - Supabase indirectly through `employeeService` helpers
  - localStorage indirectly via service helpers
- Duplicate logic exists:
  - Yes. It manages employee login state through local shadow store and also through Supabase.

### 15. `src/components/settings/TeamAccessTab.tsx`
- Purpose: UI for managing workspace roles, custom permissions, and role assignment audit.
- Functions exported:
  - `TeamAccessTab`
- Supabase tables used:
  - none directly
- Reads from:
  - localStorage via `loadAllRoleConfigs()`, `loadUserAssignments()`, `loadAuditLogs()`
- Writes to:
  - localStorage via `saveAllRoleConfigs()` and `saveUserAssignments()`
- Duplicate logic exists:
  - Yes. Role/permission configuration is stored locally and shadowed to Supabase, and is separate from user session permissions.

### 16. `src/pages/team/Team.tsx`
- Purpose: Team members list and management UI.
- Functions exported:
  - default `Team`
- Supabase tables used:
  - none directly
- Reads from:
  - localStorage-derived team members via `getTeamMembers()`
- Writes to:
  - Supabase indirectly through `deleteUserAcc()` / `updateUserAccount()`
- Duplicate logic exists:
  - Yes. Team members are surfaced from local shadow login store rather than a single canonical Supabase auth identity.

### 17. `src/services/teamStore.ts`
- Purpose: Map user accounts into team member domain objects and support team member CRUD wrappers.
- Functions exported:
  - `getTeamMembers`
  - `saveTeamMembers`
  - `saveTeamMember`
  - `deleteTeamMember`
  - `getMembersByRole`
  - `exportTeamToCSV`
- Supabase tables used:
  - none directly
- Reads from:
  - localStorage-derived `loadAllUserAccounts()` via `teamLoginStore`
- Writes to:
  - Supabase indirectly via `updateUserAccount()` / `deleteUserAcc()`
- Duplicate logic exists:
  - Yes. It mirrors team member data from the employee login store into a separate team domain.

### 18. `src/App.tsx`
- Purpose: App routing, protected route setup, auth provider initialization, and cloud sync startup.
- Functions exported:
  - default `App`
- Supabase tables used:
  - none directly
- Reads from:
  - React Context via `useAuth`
- Writes to:
  - none
- Duplicate logic exists:
  - No, though it uses both `ProtectedRoute` and `ProtectedModuleRoute` with separate auth/permission mechanisms.

### 19. `src/services/cloudSyncService.ts`
- Purpose: Sync local cache to Supabase, initialize realtime listeners, and broadcast cross-tab sync events.
- Functions exported:
  - `isCloudConfigured`
  - `broadcastCloudSync`
  - `pushEntityToCloud`
  - `pullTableFromCloud`
  - `initRealtimeCloudListener`
  - `initCloudDatabaseSync`
- Supabase tables used:
  - `business_profile`
  - `work_orders`
  - `enquiries`
  - `team_members`
  - `finance_payments`
  - `user_accounts`
  - `role_permissions`
  - `user_role_assignments`
- Reads from:
  - none directly
- Writes to:
  - localStorage for cached tables
- Duplicate logic exists:
  - Yes. It hydrates localStorage caches for many tables, including employee data and role permissions, creating a shadow sync model.

### 20. `src/hooks/useTeamPermissions.ts`
- Purpose: Expose permission checks and active role state.
- Functions exported:
  - `useTeamPermissions`
- Supabase tables used:
  - none directly
- Reads from:
  - localStorage via `loadAllRoleConfigs()` and `getActiveRoleId()`
- Writes to:
  - localStorage via `setActiveRoleId()`
- Duplicate logic exists:
  - Yes. It implements permissions state outside of Supabase and separate from global user session.

### 21. `src/pages/dashboard/Dashboard.tsx` (relevant auth/role logic)
- Purpose: Workspace routing and role-aware dashboard display.
- Functions exported:
  - default `Dashboard`
- Reads from:
  - React Context via `useAuth`
  - local user session and role metadata
- Duplicate logic exists:
  - It uses both user workspace role and permissions for display, which mirrors other role/permission systems.

### 22. `src/components/layout/WorkspaceRouter.tsx`
- Purpose: Selects workspace landing content based on user workspace role and module access.
- Functions exported:
  - `WorkspaceRouter`
- Reads from:
  - React Context via `useAuth`
  - permissions via `user.module_access`
- Duplicate logic exists:
  - Yes. It bases workspace routing on role and local module access rather than single permission engine.

---

## Findings

1. Two authentication systems are present:
   - Supabase Auth (`src/services/supabase/auth.ts`, `src/hooks/useAuth.ts`, `src/pages/auth/Login.tsx`) as canonical auth.
   - Local shadow login via `teamLoginStore` / `employeeService` for team login access and user account management.

2. LocalStorage is heavily used for business user and permission state:
   - `trufocus_session_user_v1`
   - `trufocus_crm_user_accounts_v1`
   - `trufocus_crm_roles_v1`
   - `trufocus_crm_active_test_role_v1`
   - `trufocus_crm_member_roles_v1`
   - `trufocus_crm_permission_audit_logs_v1`
   - `trufocus_crm_login_history_v1`

3. Permission evaluation is fragmented:
   - `useTeamPermissions()` and `teamAccessStore` provide role-based permissions.
   - `ProtectedModuleRoute` also reads `user.module_access` directly.
   - Sidebar generation uses both role-based labels and module access checks.

4. Employee lifecycle is duplicated:
   - `employeeService` writes and syncs users to Supabase tables and local cache.
   - `teamLoginStore` validates login using cached accounts and updates role context.
   - `teamStore` maps those accounts into team member domain objects.

5. Route protection is implemented, but there are two guard layers:
   - Auth guard in `RouteGuard` for login status.
   - Module guard in `ProtectedModuleRoute` using mixed permission sources.

6. There is no single authoritative auth/permission code path.
   - Some operations rely on `useAuth` and Supabase session state.
   - Others rely on localStorage based role configs and team account caches.

7. Supabase is used as source of truth in some places, but local shadow models undermine it.
   - `auth.ts` reads from Supabase and writes the session profile to localStorage.
   - `employeeService` reads/writes Supabase tables and also caches shadow localStorage copies.
   - `cloudSyncService` hydrates localStorage from Supabase for cross-tab sync.

---

## Audit Implications

- The current identity architecture is not aligned with the approved SaaS-audience design because it duplicates auth and permission state.
- Immediate cleanup is required to enforce:
  - Single auth path via Supabase Auth.
  - One source of truth for employee login and identity.
  - Centralized PermissionService instead of mixed `user.module_access` plus `teamAccessStore`.
  - Elimination of business-data localStorage for employee/session/permissions state.

This audit report identifies the files and duplicate logic that must be addressed in the next refactor sprint.
