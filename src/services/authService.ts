import { supabase } from './supabase/client'
import * as supabaseAuth from './supabase/auth'
import { fetchAllEmployeesFromCloud } from './employeeService'

export async function signIn(
  email: string,
  password: string,
  customProfile?: Partial<import('@/types/auth').Profile>
) {
  return supabaseAuth.signIn(email, password, customProfile)
}

export async function signOut() {
  return supabaseAuth.signOut()
}

export async function resetPasswordForEmail(email: string) {
  return supabaseAuth.resetPasswordForEmail(email)
}

export async function updatePassword(newPassword: string) {
  return supabaseAuth.updatePassword(newPassword)
}

export async function getSession() {
  return supabaseAuth.getSession()
}

export async function getProfile(userId: string, email?: string) {
  return supabaseAuth.getProfile(userId, email)
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

export async function resolveLoginIdentifier(usernameOrEmail: string): Promise<string> {
  const rawInput = usernameOrEmail.trim()
  if (rawInput.includes('@')) return rawInput

  if (rawInput.toLowerCase() === 'owner.admin' || rawInput.toLowerCase() === 'trufocus.admin') {
    return 'owner@trufocusphotos.com'
  }

  try {
    const cloudAccounts = await fetchAllEmployeesFromCloud()
    if (cloudAccounts && cloudAccounts.length > 0) {
      const matched = cloudAccounts.find(
        (m: any) =>
          m.username?.toLowerCase() === rawInput.toLowerCase() ||
          m.employee_id?.toLowerCase() === rawInput.toLowerCase()
      )
      if (matched?.email) {
        return matched.email
      }
    }
  } catch (error) {
    console.warn('[AuthService] resolveLoginIdentifier lookup failed:', error)
  }

  return `${rawInput.toLowerCase()}@trufocusphotos.com`
}
