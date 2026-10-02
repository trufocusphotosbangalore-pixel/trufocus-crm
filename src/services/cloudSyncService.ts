import { db } from '@/services/firebase/client'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot
} from 'firebase/firestore'
import { fetchAllEmployeesFromCloud } from './employeeService'
import { filterOutLegacyDemoItems } from '@/utils/legacyDemoPurge'

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
    const localProfileStr = localStorage.getItem('trufocus_crm_business_profile_v1')
    if (profileRows && profileRows.length > 0) {
      const latestProfile = profileRows[0]
      if (latestProfile && typeof latestProfile === 'object') {
        localStorage.setItem('trufocus_crm_business_profile_v1', JSON.stringify(latestProfile))
        broadcastCloudSync('business_profile', latestProfile)
      }
    } else if (localProfileStr) {
      try {
        const localProfile = JSON.parse(localProfileStr)
        await pushEntityToCloud('business_profile', 'main', localProfile)
      } catch {}
    }

    // 2. Sync Work Orders
    const rawWoRows = await pullTableFromCloud('work_orders')
    const localWOsStr = localStorage.getItem('trufocus_crm_work_orders_v1')
    let localWOs: any[] = []
    if (localWOsStr) {
      try { localWOs = JSON.parse(localWOsStr) } catch (e) {}
    }
    localWOs = filterOutLegacyDemoItems(localWOs)

    if (rawWoRows && rawWoRows.length > 0) {
      const extractedCloud = extractEntitiesFromCloudRows(rawWoRows)
      const cloudWOs = filterOutLegacyDemoItems(extractedCloud)
      const mergedMap = new Map<string, any>()
      cloudWOs.forEach((w: any) => {
        const k = w.id || w.work_order_number
        if (k) mergedMap.set(k, w)
      })

      let hasLocalChanges = false
      if (Array.isArray(localWOs)) {
        localWOs.forEach((w: any) => {
          const key = w.id || w.work_order_number
          if (!key) return
          if (!mergedMap.has(key)) {
            mergedMap.set(key, w)
            hasLocalChanges = true
          } else {
            const cloudItem = mergedMap.get(key)
            const lTime = new Date(w.updated_at || w.archived_at || w.deleted_at || w.created_at || 0).getTime()
            const cTime = new Date(cloudItem.updated_at || cloudItem.archived_at || cloudItem.deleted_at || cloudItem.created_at || 0).getTime()

            const lArchived = Boolean(w.is_archived || w.status === 'archived')
            const cArchived = Boolean(cloudItem.is_archived || cloudItem.status === 'archived')
            const lDeleted = Boolean(w.deleted_at || w.status === 'deleted')
            const cDeleted = Boolean(cloudItem.deleted_at || cloudItem.status === 'deleted')

            if ((lArchived && !cArchived) || (lDeleted && !cDeleted)) {
              mergedMap.set(key, w)
              hasLocalChanges = true
            } else if (lTime > cTime) {
              mergedMap.set(key, w)
              hasLocalChanges = true
            }
          }
        })
      }

      const mergedList = Array.from(mergedMap.values())
      localStorage.setItem('trufocus_crm_work_orders_v1', JSON.stringify(mergedList))
      broadcastCloudSync('work_orders', mergedList)

      if (hasLocalChanges || cloudWOs.length !== extractedCloud.length) {
        await pushEntityToCloud('work_orders', 'main', mergedList)
      }
    } else if (Array.isArray(localWOs) && localWOs.length > 0) {
      // Cloud is empty, seed cloud with existing local work orders
      await pushEntityToCloud('work_orders', 'main', localWOs)
    }

    // 3. Sync Enquiries
    const rawEnqRows = await pullTableFromCloud('enquiries')
    const localEnqsStr = localStorage.getItem('trufocus_crm_enquiries_v1')
    let localEnqs: any[] = []
    if (localEnqsStr) {
      try { localEnqs = JSON.parse(localEnqsStr) } catch (e) {}
    }

    if (rawEnqRows && rawEnqRows.length > 0) {
      const cloudEnqs = extractEntitiesFromCloudRows(rawEnqRows)
      if (cloudEnqs.length > 0) {
        const mergedMap = new Map<string, any>()
        cloudEnqs.forEach((e: any) => mergedMap.set(e.id || e.enquiry_number, e))
        let hasNewLocal = false
        if (Array.isArray(localEnqs)) {
          localEnqs.forEach((e: any) => {
            const key = e.id || e.enquiry_number
            if (key && !mergedMap.has(key)) {
              mergedMap.set(key, e)
              hasNewLocal = true
            }
          })
        }
        const mergedList = Array.from(mergedMap.values())
        localStorage.setItem('trufocus_crm_enquiries_v1', JSON.stringify(mergedList))
        broadcastCloudSync('enquiries', mergedList)

        if (hasNewLocal) {
          pushEntityToCloud('enquiries', 'main', mergedList)
        }
      }
    } else if (Array.isArray(localEnqs) && localEnqs.length > 0) {
      await pushEntityToCloud('enquiries', 'main', localEnqs)
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
    const localPayStr = localStorage.getItem('trufocus_crm_payments_v1')
    if (payRows && payRows.length > 0) {
      let payData = payRows[0]
      if (payData && typeof payData === 'object' && !Array.isArray(payData) && Array.isArray(payData.data)) {
        payData = payData.data
      }
      if (Array.isArray(payData)) {
        const cleanedPay = filterOutLegacyDemoItems(payData)
        localStorage.setItem('trufocus_crm_payments_v1', JSON.stringify(cleanedPay))
        broadcastCloudSync('finance', cleanedPay)
        if (cleanedPay.length !== payData.length) {
          await pushEntityToCloud('finance_payments', 'main', cleanedPay)
        }
      }
    } else if (localPayStr) {
      try {
        const localPay = filterOutLegacyDemoItems(JSON.parse(localPayStr))
        if (localPay && localPay.length > 0) await pushEntityToCloud('finance_payments', 'main', localPay)
      } catch {}
    }

    // 6. Sync Post Production Deliverables
    const postProdRows = await pullTableFromCloud('post_production')
    const localPostProdStr = localStorage.getItem('trufocus_crm_post_production_v1')
    if (postProdRows && postProdRows.length > 0) {
      let postProdData = postProdRows[0]
      if (postProdData && typeof postProdData === 'object' && !Array.isArray(postProdData) && Array.isArray(postProdData.data)) {
        postProdData = postProdData.data
      }
      if (Array.isArray(postProdData)) {
        if (postProdData.length > 0 && Array.isArray(postProdData[0])) {
          postProdData = postProdData.flat()
        }
        const cleanedPostProd = filterOutLegacyDemoItems(postProdData)
        localStorage.setItem('trufocus_crm_post_production_v1', JSON.stringify(cleanedPostProd))
        broadcastCloudSync('post_production', cleanedPostProd)
        if (cleanedPostProd.length !== postProdData.length) {
          await pushEntityToCloud('post_production', 'main', cleanedPostProd)
        }
      }
    } else if (localPostProdStr) {
      try {
        const localPostProd = filterOutLegacyDemoItems(JSON.parse(localPostProdStr))
        if (localPostProd && localPostProd.length > 0) await pushEntityToCloud('post_production', 'main', localPostProd)
      } catch {}
    }

    // 7. Sync Customer Portals
    const portalRows = await pullTableFromCloud('customer_portals')
    const localPortalStr = localStorage.getItem('trufocus_crm_customer_portals_v1') || localStorage.getItem('trufocus_crm_portals_v1')
    if (portalRows && portalRows.length > 0) {
      let portalData = portalRows[0]
      if (portalData && typeof portalData === 'object' && !Array.isArray(portalData) && Array.isArray(portalData.data)) {
        portalData = portalData.data
      }
      if (Array.isArray(portalData)) {
        localStorage.setItem('trufocus_crm_customer_portals_v1', JSON.stringify(portalData))
        localStorage.setItem('trufocus_crm_portals_v1', JSON.stringify(portalData))
        broadcastCloudSync('customer_portals', portalData)
      }
    } else if (localPortalStr) {
      try {
        const localPortals = JSON.parse(localPortalStr)
        if (localPortals && localPortals.length > 0) await pushEntityToCloud('customer_portals', 'main', localPortals)
      } catch {}
    }

    console.log('✅ Firebase Cloud Database Hydration completed successfully!')
  } catch (e) {
    console.warn('Notice: Firebase Cloud Database Hydration skipped:', e)
  }
}
