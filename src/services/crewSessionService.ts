import type { UserAccount } from '@/types/teamLogin'

const SESSION_KEY = 'trufocus_crew_active_session_v1'

export function getCrewSession(): UserAccount | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error loading crew session:', e)
  }
  return null
}

export function setCrewSession(employee: UserAccount): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(employee))
    window.dispatchEvent(new CustomEvent('trufocus_crew_session_updated'))
  } catch (e) {
    console.error('Error saving crew session:', e)
  }
}

export function clearCrewSession(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(SESSION_KEY)
    window.dispatchEvent(new CustomEvent('trufocus_crew_session_updated'))
  } catch (e) {
    console.error('Error clearing crew session:', e)
  }
}

export function isCrewLoggedIn(): boolean {
  return Boolean(getCrewSession())
}
