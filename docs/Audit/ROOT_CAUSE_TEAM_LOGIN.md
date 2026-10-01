# Root Cause: Team Login Synchronization Failure

This report traces the exact execution flow for the scenario where Computer A creates an employee but Computer B does not see the employee.

It is based on the audited files in `docs/Audit/TEAM_LOGIN_AUDIT.md` and the relevant source code paths.

## Exact Execution Flow

### 1. Create User

User action on Computer A:
- UI call comes from `src/pages/settings/TeamLoginAccessTab.tsx` or other team account creation UI.
- The page invokes `createUserAccount(...)` from `src/services/employeeService.ts`.

### 2. Service

In `src/services/employeeService.ts`:
- `createUserAccount()` builds a new `UserAccount` object.
- It calls `createEmployeeInCloud(data, createdBy)` asynchronously.

### 3. API

In `src/services/employeeService.ts`:
- `createEmployeeInCloud()` first calls `fetchAllEmployeesFromCloud()` to load existing cloud accounts.
- It then calls `supabase.auth.signUp(...)` to register a Supabase Auth user.
- When Supabase returns `authData.user.id`, it calls `pushEmployeeToCloudDB(authData.user.id, {...})`.
- It also writes the updated local cache to localStorage under `trufocus_crm_user_accounts_v1`.

### 4. Supabase

In `src/services/employeeService.ts`:
- `pushEmployeeToCloudDB()` performs two Supabase upserts:
  - `supabase.from('user_accounts').upsert({ id, data: record, updated_at: now })`
  - `supabase.from('team_members').upsert({ id, data: record, updated_at: now })`
- This writes the new user account to both `user_accounts` and `team_members` tables in Supabase.

### 5. Read User

On Computer B, the employee list is not loaded directly from Supabase.
- The Team page uses `src/services/teamStore.ts`.
- `getTeamMembers()` calls `loadAllUserAccounts()` from `src/services/teamLoginStore.ts`.
- `loadAllUserAccounts()` reads `trufocus_crm_user_accounts_v1` from localStorage.

### 6. Employee List

If Computer B has stale or missing localStorage cache, the new employee is not present.
- The list is not rebuilt from Supabase on every render.
- It is only updated when localStorage is refreshed via cloud sync or direct fetch.

### 7. Sidebar

Sidebar navigation visibility is based on:
- `useAuth()` user session from `src/hooks/useAuth.ts`
- `useTeamPermissions()` permission state from `src/hooks/useTeamPermissions.ts`
- `ProtectedModuleRoute` and `Sidebar` both read `user.module_access` and `canAccessModule()`.

The new employee is not relevant to sidebar visibility unless the employee is the current active logged-in user.

### 8. Workspace

Workspace routing and access continue to rely on the current authenticated session and role/permission state in the browser.
- New users created on Computer A do not automatically become active users on Computer B.
- Computer B must refresh the local employee cache and/or log in as the new user.

## Exact Synchronization Break Point

The break occurs at the employee read/cache layer on Computer B:
- `src/services/teamLoginStore.ts` -> `loadAllUserAccounts()`
- `src/services/teamStore.ts` -> `getTeamMembers()`

Computer B is not reading the new employee directly from Supabase.
Instead, it relies on the localStorage shadow cache key `trufocus_crm_user_accounts_v1`.

If the realtime/hydration mechanism does not update that localStorage value, the new employee remains invisible.

## Why This Happens

The code path on Computer B depends on synchronization logic, not a direct Supabase query.
The core failure is:
- `Team` page/employee list does not perform a fresh Supabase fetch for `user_accounts`.
- It only reads `loadAllUserAccounts()` from localStorage.
- The local cache is only refreshed via cloud sync events.

If the sync event is missed, not subscribed, or not processed, Computer B will continue showing stale data.

## Supporting Evidence from Code

- `src/services/employeeService.ts` writes new employees to Supabase and localStorage.
- `src/services/cloudSyncService.ts` hydrates localStorage from Supabase on realtime changes.
- `src/hooks/useRealtimeSync.ts` provides an event listener only for pages that opt into it.
- `src/pages/team/Team.ts` uses `useRealtimeSync(() => setMembers(getTeamMembers()))`.
- `src/services/teamStore.ts` transforms `loadAllUserAccounts()` localStorage data into team members.

## Root Cause Statement

**The root cause is that Computer B's employee list is sourced from `localStorage` cache (`trufocus_crm_user_accounts_v1`), and the synchronization mechanism that updates that cache from Supabase is the only path for cross-device consistency. When that sync path is not exercised or fails, Computer B does not see the newly created employee.**

This is the exact point of failure, not the creation API or Supabase write itself.
