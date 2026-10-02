/**
 * Authentication-related TypeScript types.
 */

/** All available user roles in the system */
export type UserRole =
  | 'admin'
  | 'sales'
  | 'photographer'
  | 'videographer'
  | 'editor'
  | 'finance'
  | 'customer'

/** A user profile record (extends Supabase auth.users) */
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  workspace_role?: string
  employment_type?: string
  specializations?: string[]
  role_id?: string
  role_name?: string
  system_role?: string
  job_roles?: string[]
  module_access?: Record<string, boolean>
  company: string | null
  phone: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** Auth context value exposed to the app */
export interface AuthContextValue {
  user: Profile | null
  currentUser: Profile | null
  userId: string | null
  userName: string | null
  userEmail: string | null
  role: string | null
  department: string | null
  permissions: Record<string, boolean> | null
  accessToken: string | null
  sessionState: 'authenticated' | 'unauthenticated' | 'restoring' | 'expired'
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string, customProfile?: Partial<Profile>) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  refreshSession: () => Promise<boolean>
}
