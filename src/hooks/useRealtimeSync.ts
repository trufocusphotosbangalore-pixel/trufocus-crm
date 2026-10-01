import { useEffect, useRef } from 'react'
import { initRealtimeCloudListener } from '@/services/cloudSyncService'

const SYNC_CHANNEL_NAME = 'trufocus_payment_sync'
const SYNC_STORAGE_KEY = 'trufocus_last_payment_sync_timestamp'

// BroadcastChannel instance (fallback gracefully if not supported)
let syncChannel: BroadcastChannel | null = null
try {
  if (typeof BroadcastChannel !== 'undefined') {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME)
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this environment', e)
}

/** Broadcast payment/assignment sync to all open browser tabs and windows */
export function broadcastPaymentSync(payload?: Record<string, unknown>): void {
  const timestamp = Date.now().toString()

  // 1. Post to BroadcastChannel (same origin tabs)
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'REALTIME_SYNC', timestamp, ...payload })
    } catch (e) {
      console.error('Error posting to BroadcastChannel', e)
    }
  }

  // 2. Write to LocalStorage (triggers 'storage' event across all open windows)
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, timestamp)
  } catch (e) {
    console.error('Error updating sync storage key', e)
  }

  // 3. Dispatch local CustomEvent (same window)
  window.dispatchEvent(new CustomEvent('workOrdersUpdated', { detail: payload }))
  window.dispatchEvent(new CustomEvent('trufocus_cloud_synced', { detail: payload }))
  window.dispatchEvent(new CustomEvent('trufocus_assignments_updated', { detail: payload }))
}

/** Custom Hook: Listen to cross-tab, cross-window, and cross-device Supabase Realtime sync events */
export function useRealtimeSync(onSync: () => void): void {
  const onSyncRef = useRef(onSync)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    onSyncRef.current = onSync
  }, [onSync])

  useEffect(() => {
    const triggerDebouncedSync = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        onSyncRef.current()
      }, 150)
    }

    // 1. Local event handler
    const handleLocalEvent = () => triggerDebouncedSync()

    // 2. BroadcastChannel handler
    const handleBroadcastMessage = (event: MessageEvent) => {
      if (event.data?.type === 'REALTIME_SYNC' || event.data?.type === 'PAYMENT_SYNC' || event.data?.type === 'ASSIGNMENT_SYNC') {
        triggerDebouncedSync()
      }
    }

    // 3. LocalStorage cross-tab storage handler
    const handleStorageEvent = (event: StorageEvent) => {
      if (
        event.key === SYNC_STORAGE_KEY ||
        event.key === 'trufocus_crm_team_assignments_v1' ||
        event.key === 'trufocus_crm_work_orders_v1' ||
        event.key === 'trufocus_crm_enquiries_v1' ||
        event.key === 'trufocus_crm_employees_v1' ||
        event.key === 'trufocus_crm_deleted_employee_ids_v1'
      ) {
        triggerDebouncedSync()
      }
    }

    // 4. Supabase Cloud DB Realtime listener across devices
    const unsubscribeCloud = initRealtimeCloudListener(() => {
      triggerDebouncedSync()
    })

    // Attach listeners
    window.addEventListener('workOrdersUpdated', handleLocalEvent)
    window.addEventListener('trufocus_cloud_synced', handleLocalEvent)
    window.addEventListener('trufocus_assignments_updated', handleLocalEvent)
    window.addEventListener('trufocus_business_profile_updated', handleLocalEvent)
    window.addEventListener('trufocus_team_updated', handleLocalEvent)
    window.addEventListener('trufocus_portal_updated', handleLocalEvent)
    window.addEventListener('storage', handleStorageEvent)

    if (syncChannel) {
      syncChannel.addEventListener('message', handleBroadcastMessage)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      window.removeEventListener('workOrdersUpdated', handleLocalEvent)
      window.removeEventListener('trufocus_cloud_synced', handleLocalEvent)
      window.removeEventListener('trufocus_assignments_updated', handleLocalEvent)
      window.removeEventListener('trufocus_business_profile_updated', handleLocalEvent)
      window.removeEventListener('trufocus_team_updated', handleLocalEvent)
      window.removeEventListener('trufocus_portal_updated', handleLocalEvent)
      window.removeEventListener('storage', handleStorageEvent)
      if (syncChannel) {
        syncChannel.removeEventListener('message', handleBroadcastMessage)
      }
      unsubscribeCloud()
    }
  }, [])
}
