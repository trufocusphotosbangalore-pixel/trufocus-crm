import { useEffect, useState, useCallback, createContext, useContext, useRef } from 'react'
import * as authService from '@/services/authService'
import * as sessionService from '@/services/sessionService'
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
  // Initial state from vault/storage for instantaneous hydration
  const initialVault = sessionService.getStoredVault()
  const initialProfile = initialVault?.cachedProfile || getSavedSessionProfile()

  const [user, setUser] = useState<Profile | null>(() => initialProfile)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [sessionState, setSessionState] = useState<
    'authenticated' | 'unauthenticated' | 'restoring' | 'expired'
  >(() => (initialProfile ? 'restoring' : 'unauthenticated'))
  const [isLoading, setIsLoading] = useState(true)

  const isRestoringRef = useRef(false)

  /** Apply profile & session credentials to state */
  const applyAuthenticatedUser = useCallback((profile: Profile, token: string | null) => {
    setUser(profile)
    setAccessToken(token)
    setSessionState('authenticated')
    saveSessionProfile(profile)

    const activeRole = profile.role_id || profile.workspace_role || profile.role
    if (activeRole) {
      setActiveRoleId(activeRole)
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trufocus_permissions_updated'))
    }
  }, [])

  /** Clear all authentication credentials from state */
  const applyUnauthenticated = useCallback(() => {
    setUser(null)
    setAccessToken(null)
    setSessionState('unauthenticated')
    clearSavedSessionProfile()
  }, [])

  /** Validate and restore session on page refresh or startup */
  const restoreSession = useCallback(async () => {
    if (isRestoringRef.current) return
    isRestoringRef.current = true
    setIsLoading(true)

    try {
      const result = await sessionService.validateAndRestoreSession()
      if (result.success && result.profile) {
        applyAuthenticatedUser(result.profile, result.accessToken)
      } else {
        applyUnauthenticated()
      }
    } catch (err) {
      console.warn('[AUTH] Error during session restoration:', err)
      // Check if we have a valid fallback
      const fallback = sessionService.getStoredVault()
      if (fallback?.cachedProfile && new Date(fallback.expiresAt).getTime() > Date.now()) {
        applyAuthenticatedUser(fallback.cachedProfile, null)
      } else {
        applyUnauthenticated()
      }
    } finally {
      setIsLoading(false)
      isRestoringRef.current = false
    }
  }, [applyAuthenticatedUser, applyUnauthenticated])

  // Initial session restoration on mount
  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  // Periodic automatic token refresh (every 5 minutes)
  useEffect(() => {
    const timer = setInterval(() => {
      if (user && sessionState === 'authenticated') {
        sessionService.validateAndRestoreSession().then((res) => {
          if (res.success && res.accessToken) {
            setAccessToken(res.accessToken)
          } else if (res.reason === 'SESSION_EXPIRED' || res.reason === 'SESSION_REVOKED' || res.reason === 'ACCOUNT_DISABLED') {
            applyUnauthenticated()
          }
        })
      }
    }, sessionService.AUTH_CONFIG.AUTO_REFRESH_CHECK_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [user, sessionState, applyUnauthenticated])

  // Multi-tab synchronization listener
  useEffect(() => {
    const unsubscribeSync = sessionService.onAuthSync((type, payload) => {
      if (type === 'LOGOUT') {
        applyUnauthenticated()
      } else if (type === 'LOGIN') {
        restoreSession()
      }
    })

    return () => unsubscribeSync()
  }, [applyUnauthenticated, restoreSession])

  const signIn = useCallback(
    async (email: string, password: string, customProfile?: Partial<Profile>) => {
      setIsLoading(true)
      try {
        const result = await authService.signIn(email, password, customProfile)
        if (result.error) throw new Error(result.error)
        if (!result.data) throw new Error('No user profile returned.')

        // Create persistent session with refresh & access tokens
        const session = await sessionService.createSession(result.data)
        applyAuthenticatedUser(session.profile, session.accessToken)
      } finally {
        setIsLoading(false)
      }
    },
    [applyAuthenticatedUser]
  )

  const signOut = useCallback(async () => {
    setIsLoading(true)
    try {
      await sessionService.terminateSession()
      await authService.signOut()
    } finally {
      applyUnauthenticated()
      setIsLoading(false)
    }
  }, [applyUnauthenticated])

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await sessionService.validateAndRestoreSession()
      if (res.success && res.profile) {
        applyAuthenticatedUser(res.profile, res.accessToken)
        return true
      }
      applyUnauthenticated()
      return false
    } catch {
      applyUnauthenticated()
      return false
    }
  }, [applyAuthenticatedUser, applyUnauthenticated])

  const resetPassword = useCallback(async (email: string) => {
    const result = await authService.resetPasswordForEmail(email)
    if (result.error) throw new Error(result.error)
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const result = await authService.updatePassword(password)
    if (result.error) throw new Error(result.error)
  }, [])

  // Derived state fields for centralized authentication consumers
  const currentUser = user
  const userId = user?.id || null
  const userName = user?.full_name || (user?.email ? user.email.split('@')[0] : null)
  const userEmail = user?.email || null
  const role = user?.role_id || user?.workspace_role || user?.role || null
  const department = sessionService.deriveDepartment(user)
  const permissions = user?.module_access || null
  const isAuthenticated = !!user && sessionState === 'authenticated'

  return {
    user,
    currentUser,
    userId,
    userName,
    userEmail,
    role,
    department,
    permissions,
    accessToken,
    sessionState,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
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
