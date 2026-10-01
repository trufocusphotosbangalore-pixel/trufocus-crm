import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import * as authService from '@/services/authService'
import type { AuthContextValue, Profile } from '@/types/auth'
import { setActiveRoleId } from '@/services/permissionService'

// ─── Session Storage Persistence Helpers ──────────────────────────────────────

const CRM_SESSION_STORAGE_KEY = 'trufocus_active_crm_session_v1'

export function saveSessionProfile(profile: Profile) {
  try {
    localStorage.setItem(CRM_SESSION_STORAGE_KEY, JSON.stringify(profile))
  } catch (e) {
    console.warn('[AUTH] Failed to persist CRM session profile:', e)
  }
}

export function getSavedSessionProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(CRM_SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.id) {
      return parsed as Profile
    }
    return null
  } catch {
    return null
  }
}

export function clearSavedSessionProfile() {
  try {
    localStorage.removeItem(CRM_SESSION_STORAGE_KEY)
  } catch {}
}

// ─── Context ─────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider hook (used in AuthProvider component) ───────────────────────────

export function useAuthProvider(): AuthContextValue {
  const [user, setUser] = useState<Profile | null>(() => getSavedSessionProfile())
  const [isLoading, setIsLoading] = useState(true)

  /** Build a fallback profile from an auth user */
  const buildFallbackProfile = (authUser: { id: string; email?: string | null; user_metadata?: any }): Profile => ({
    id: authUser.id,
    email: authUser.email ?? '',
    full_name: authUser.user_metadata?.full_name ?? (authUser.email ? authUser.email.split('@')[0] : 'Staff Member'),
    avatar_url: authUser.user_metadata?.avatar_url ?? null,
    role: 'photographer',
    role_id: 'owner',
    role_name: 'Owner',
    system_role: 'owner',
    company: 'Trufocus Photography',
    phone: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    deleted_at: null,
  })

  /** Load profile from Supabase session with local session fallback */
  const loadUser = useCallback(async () => {
    setIsLoading(true)
    try {
      const session = await authService.getSession()
      if (session?.user) {
        const profile = await authService.getProfile(session.user.id)
        const userProf = profile ?? buildFallbackProfile(session.user)
        saveSessionProfile(userProf)
        setUser(userProf)
        if (userProf.role_id) {
          setActiveRoleId(userProf.role_id)
        }
      } else {
        // Fall back to saved local session if present
        const savedProf = getSavedSessionProfile()
        if (savedProf) {
          setUser(savedProf)
          if (savedProf.role_id) {
            setActiveRoleId(savedProf.role_id)
          }
        } else {
          setUser(null)
        }
      }
    } catch {
      const savedProf = getSavedSessionProfile()
      setUser(savedProf)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          const profile = await authService.getProfile(session.user.id)
          const userProf = profile ?? buildFallbackProfile(session.user)
          saveSessionProfile(userProf)
          setUser(userProf)
          if (userProf.role_id) {
            setActiveRoleId(userProf.role_id)
          }
        } else if (event === 'SIGNED_OUT') {
          clearSavedSessionProfile()
          setUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [loadUser])

  const signIn = useCallback(async (email: string, password: string, customProfile?: Partial<Profile>) => {
    const result = await authService.signIn(email, password, customProfile)
    if (result.error) throw new Error(result.error)
    if (result.data) {
      saveSessionProfile(result.data)
      if (result.data.role_id) {
        setActiveRoleId(result.data.role_id)
      }
      setUser(result.data)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trufocus_permissions_updated'))
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    clearSavedSessionProfile()
    await authService.signOut()
    setUser(null)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const result = await authService.resetPasswordForEmail(email)
    if (result.error) throw new Error(result.error)
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const result = await authService.updatePassword(password)
    if (result.error) throw new Error(result.error)
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  }
}

// ─── Consumer hook ────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
