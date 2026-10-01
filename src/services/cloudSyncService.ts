import { supabase } from '@/services/supabase/client'
import { fetchAllEmployeesFromCloud } from './employeeService'

/**
 * Centralized Cloud Database Sync Service
 * Handles multi-device cloud persistence for Work Orders, Enquiries, Team Members,
 * Business Profile, Customer Portals, Finance, Post Production, Data Storage,
 * Client Requests, and Settings via Supabase Database & Realtime WebSockets.
 */

export interface CloudSyncStatus {
  isConfigured: boolean
  isOnline: boolean
  lastSyncedAt: string | null
}

export function isCloudConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string
  return Boolean(url && url.trim().length > 0 && !url.includes('placeholder.supabase.co'))
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

/** Push entity payload to Supabase DB asynchronously */
export async function pushEntityToCloud(table: string, id: string, record: any): Promise<boolean> {
  if (!isCloudConfigured()) return false
  try {
    const { error } = await supabase.from(table).upsert({
      id,
      data: record,
      updated_at: new Date().toISOString(),
    })
    if (error) {
      console.warn(`[CloudSync] Warning writing to table '${table}':`, error.message)
      return false
    }
    return true
  } catch (e) {
    console.warn(`[CloudSync] Network exception writing to table '${table}':`, e)
    return false
  }
}

/** Helper to flatten and extract entities from Supabase rows (array payload id='main' and individual rows) */
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

/** Pull all records for a table from Supabase DB */
export async function pullTableFromCloud(table: string): Promise<any[] | null> {
  if (!isCloudConfigured()) return null
  try {
    const { data, error } = await supabase.from(table).select('*')
    if (error || !data) {
      console.warn(`[CloudSync] Warning reading table '${table}':`, error?.message)
      return null
    }
    return data.map((row) => row.data || row)
  } catch (e) {
    console.warn(`[CloudSync] Network exception reading table '${table}':`, e)
    return null
  }
}

let activeRealtimeChannel: ReturnType<typeof supabase.channel> | null = null
const activeRealtimeCallbacks = new Set<() => void>()

/** Initialize Supabase Realtime WebSocket Listener for multi-device sync */
export function initRealtimeCloudListener(onSyncCallback: () => void): () => void {
  if (!isCloudConfigured()) return () => {}

  activeRealtimeCallbacks.add(onSyncCallback)

  if (!activeRealtimeChannel) {
    try {
      activeRealtimeChannel = supabase
        .channel('trufocus-cloud-realtime-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          async (payload) => {
            // NOTE: Do not cache permissions or role assignments in localStorage.
            // Permissions must be sourced via permissionService/teamAccessStore only.
            broadcastCloudSync(payload.table || 'all', payload.new)
            activeRealtimeCallbacks.forEach((cb) => {
              try { cb() } catch (e) { console.error('Realtime sync callback error:', e) }
            })
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('🌐 Connected to Supabase Cloud DB Realtime Channel')
          }
        })
    } catch (e) {
      console.error('Error initializing Supabase Realtime Listener:', e)
    }
  }

  return () => {
    activeRealtimeCallbacks.delete(onSyncCallback)
    if (activeRealtimeCallbacks.size === 0 && activeRealtimeChannel) {
      supabase.removeChannel(activeRealtimeChannel)
      activeRealtimeChannel = null
    }
  }
}

/** Hydrate all local stores from Supabase Cloud DB on application launch */
export async function initCloudDatabaseSync(): Promise<void> {
  if (!isCloudConfigured()) return

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

    // 4. Sync Team Members (handled via EmployeeService canonical fetch)
    try {
      await fetchAllEmployeesFromCloud()
      broadcastCloudSync('team', null)
    } catch (e) {
      console.warn('[Cloud Sync] Failed to hydrate team members via EmployeeService:', e)
    }

    // 5. Sync Finance Payments
    const payRows = await pullTableFromCloud('finance_payments')
    if (payRows && payRows.length > 0) {
      const payData = Array.isArray(payRows[0]) ? payRows[0] : payRows
      localStorage.setItem('trufocus_crm_payments_v1', JSON.stringify(payData))
      broadcastCloudSync('finance', payData)
    }

    // 7. Sync Post Production Deliverables
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

    console.log('✅ Cloud Database Hydration completed successfully!')
  } catch (e) {
    console.warn('Notice: Cloud Database Hydration skipped:', e)
  }
}
