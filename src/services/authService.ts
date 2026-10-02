import { auth } from './firebase/client'
import * as firebaseAuth from './firebase/auth'
import { fetchAllEmployeesFromCloud } from './employeeService'
import { onAuthStateChanged } from 'firebase/auth'

export async function signIn(
  email: string,
  password: string,
  customProfile?: Partial<import('@/types/auth').Profile>
) {
  return firebaseAuth.signIn(email, password, customProfile)
}

import { onAuthSync, terminateSession } from './sessionService'

export async function signOut() {
  await terminateSession()
  return firebaseAuth.signOut()
}

export async function resetPasswordForEmail(email: string) {
  return firebaseAuth.resetPasswordForEmail(email)
}

export async function updatePassword(newPassword: string) {
  return firebaseAuth.updatePassword(newPassword)
}

export async function getSession() {
  return firebaseAuth.getSession()
}

export async function getProfile(userId: string, email?: string) {
  return firebaseAuth.getProfile(userId, email)
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  // Listen for multi-tab auth events
  const unsubSync = onAuthSync((type, payload) => {
    if (type === 'LOGOUT') {
      callback('SIGNED_OUT', null)
    } else if (type === 'LOGIN') {
      callback('SIGNED_IN', payload)
    }
  })

  // Also listen to Firebase auth if connected
  const unsubFirebase = onAuthStateChanged(auth, (user) => {
    if (user) {
      callback('SIGNED_IN', {
        user: {
          id: user.uid,
          email: user.email,
          user_metadata: { full_name: user.displayName },
        },
      })
    }
  })

  return {
    data: {
      subscription: {
        unsubscribe: () => {
          unsubSync()
          unsubFirebase()
        },
      },
    },
  }
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
