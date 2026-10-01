import { db } from '@/services/firebase/client'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot
} from 'firebase/firestore'
import { fetchAllEmployeesFromCloud } from './employeeService'

/**
 * Centralized Cloud Database Sync Service (Firebase / Firestore)
 * Handles multi-device cloud persistence for Work Orders, Enquiries, Team Members,
 * Business Profile, Customer Portals, Finance, Post Production, Data Storage,
 * Client Requests, and Settings via Firestore.
 */

export interface CloudSyncStatus {
  isConfigured: boolean
  isOnline: boolean
  lastSyncedAt: string | null
}

export function isCloudConfigured(): boolean {
  return true
}

/** Broadcast local event to notify UI components across tabs and devices */
export function broadcastCloudSync(entity: string, payload?: any): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent('workOrdersUpdated', { detail: { entity, payload } }))
    window.dispatchEvent(new CustomEvent('trufocus_cloud_synced', { detail: { entity, payload } }))
    window.dispatchEvent(new CustomEvent('trufocus_assignments_updated', { detail: { entity, payload } }))

    if (entity === 'business_profile') {
      window.dispatchEvent(new CustomEvent('trufocus_business_profile_updated', { detail: payload }))
    }
    if (entity === 'team') {
      window.dispatchEvent(new CustomEvent('trufocus_team_updated', { detail: payload }))
    }
    if (entity === 'portal') {
      window.dispatchEvent(new CustomEvent('trufocus_portal_updated', { detail: payload }))
    }
  } catch (e) {
    console.error('Error broadcasting cloud sync event:', e)
  }
}

/** Push entity payload to Firestore DB asynchronously */
export async function pushEntityToCloud(table: string, id: string, record: any): Promise<boolean> {
  try {
    const docRef = doc(db, table, id)
    await setDoc(docRef, {
      id,
      data: record,
      updated_at: new Date().toISOString(),
    }, { merge: true })
    return true
  } catch (e: any) {
    console.warn(`[CloudSync] Exception writing to collection '${table}':`, e.message || e)
    return false
  }
}

/** Helper to flatten and extract entities from Firestore documents */
export function extractEntitiesFromCloudRows<T = any>(rows: any[]): T[] {
  if (!rows || !Array.isArray(rows)) return []

  const entityMap = new Map<string, T>()

  rows.forEach((row) => {
    if (!row) return
    let content = (row.data !== undefined && row.data !== null) ? row.data : row
    if (typeof content === 'string') {
      try { content = JSON.parse(content) } catch (e) {}
    }

    if (Array.isArray(content)) {
      content.forEach((item: any) => {
        if (item && typeof item === 'object') {
          const key = item.id || item.work_order_number || item.enquiry_number
          if (key) entityMap.set(key, item)
        }
      })
    } else if (content && typeof content === 'object') {
      const mergedObj = { ...row, ...content }
      const key = mergedObj.id || mergedObj.work_order_number || mergedObj.enquiry_number
      if (key && key !== 'main') entityMap.set(key, mergedObj as any)
    }
  })

  return Array.from(entityMap.values())
}

/** Pull all records for a collection from Firestore */
export async function pullTableFromCloud(table: string): Promise<any[] | null> {
  try {
    const colRef = collection(db, table)
    const snapshot = await getDocs(colRef)
    const items: any[] = []
    snapshot.forEach((d) => {
      const data = d.data()
      items.push(data.data !== undefined ? data.data : data)
    })
    return items
  } catch (e: any) {
    console.warn(`[CloudSync] Exception reading collection '${table}':`, e.message || e)
    return null
  }
}

const activeRealtimeCallbacks = new Set<() => void>()
let unsubscribers: Array<() => void> = []

/** Initialize Firestore Realtime Listener for multi-device sync */
export function initRealtimeCloudListener(onSyncCallback: () => void): () => void {
  activeRealtimeCallbacks.add(onSyncCallback)

  if (unsubscribers.length === 0) {
    const collectionsToListen = ['work_orders', 'enquiries', 'business_profile', 'finance_payments']
    collectionsToListen.forEach((colName) => {
      try {
        const unsub = onSnapshot(collection(db, colName), () => {
          broadcastCloudSync(colName)
          activeRealtimeCallbacks.forEach((cb) => {
            try { cb() } catch (err) { console.error('Realtime sync callback error:', err) }
          })
        }, (err) => {
          console.warn(`[Firestore Realtime] Listener error on ${colName}:`, err)
        })
        unsubscribers.push(unsub)
      } catch (e) {
        console.warn(`[Firestore Realtime] Failed listener on ${colName}:`, e)
      }
    })
  }

  return () => {
    activeRealtimeCallbacks.delete(onSyncCallback)
    if (activeRealtimeCallbacks.size === 0) {
      unsubscribers.forEach((u) => u())
      unsubscribers = []
    }
  }
}

/** Hydrate all local stores from Firestore on application launch */
export async function initCloudDatabaseSync(): Promise<void> {
  try {
    // 1. Sync Business Profile
    const profileRows = await pullTableFromCloud('business_profile')
    if (profileRows && profileRows.length > 0) {
      const latestProfile = profileRows[0]
      if (latestProfile && typeof latestProfile === 'object') {
        localStorage.setItem('trufocus_crm_business_profile_v1', JSON.stringify(latestProfile))
        broadcastCloudSync('business_profile', latestProfile)
      }
    }

    // 2. Sync Work Orders
    const rawWoRows = await pullTableFromCloud('work_orders')
    if (rawWoRows && rawWoRows.length > 0) {
      const cloudWOs = extractEntitiesFromCloudRows(rawWoRows)
      if (cloudWOs.length > 0) {
        const localWOsStr = localStorage.getItem('trufocus_crm_work_orders_v1')
        let localWOs: any[] = []
        if (localWOsStr) {
          try { localWOs = JSON.parse(localWOsStr) } catch (e) {}
        }
        const mergedMap = new Map<string, any>()
        cloudWOs.forEach((w: any) => mergedMap.set(w.id || w.work_order_number, w))
        if (Array.isArray(localWOs)) {
          localWOs.forEach((w: any) => {
            const key = w.id || w.work_order_number
            if (key && !mergedMap.has(key)) mergedMap.set(key, w)
          })
        }
        const mergedList = Array.from(mergedMap.values())
        localStorage.setItem('trufocus_crm_work_orders_v1', JSON.stringify(mergedList))
        broadcastCloudSync('work_orders', mergedList)
      }
    }

    // 3. Sync Enquiries
    const rawEnqRows = await pullTableFromCloud('enquiries')
    if (rawEnqRows && rawEnqRows.length > 0) {
      const cloudEnqs = extractEntitiesFromCloudRows(rawEnqRows)
      if (cloudEnqs.length > 0) {
        localStorage.setItem('trufocus_crm_enquiries_v1', JSON.stringify(cloudEnqs))
        broadcastCloudSync('enquiries', cloudEnqs)
      }
    }

    // 4. Sync Team Members
    try {
      await fetchAllEmployeesFromCloud()
      broadcastCloudSync('team', null)
    } catch (e) {
      console.warn('[Cloud Sync] Failed to hydrate team members:', e)
    }

    // 5. Sync Finance Payments
    const payRows = await pullTableFromCloud('finance_payments')
    if (payRows && payRows.length > 0) {
      const payData = Array.isArray(payRows[0]) ? payRows[0] : payRows
      localStorage.setItem('trufocus_crm_payments_v1', JSON.stringify(payData))
      broadcastCloudSync('finance', payData)
    }

    // 6. Sync Post Production Deliverables
    const postProdRows = await pullTableFromCloud('post_production')
    if (postProdRows && postProdRows.length > 0) {
      let postProdData = postProdRows[0]
      if (postProdData && typeof postProdData === 'object' && !Array.isArray(postProdData) && Array.isArray(postProdData.data)) {
        postProdData = postProdData.data
      }
      if (Array.isArray(postProdData)) {
        if (postProdData.length > 0 && Array.isArray(postProdData[0])) {
          postProdData = postProdData.flat()
        }
        localStorage.setItem('trufocus_crm_post_production_v1', JSON.stringify(postProdData))
        broadcastCloudSync('post_production', postProdData)
      }
    }

    console.log('✅ Firebase Cloud Database Hydration completed successfully!')
  } catch (e) {
    console.warn('Notice: Firebase Cloud Database Hydration skipped:', e)
  }
}
