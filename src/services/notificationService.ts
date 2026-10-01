import { pushEntityToCloud } from '@/services/cloudSyncService'

export interface CrmNotification {
  id: string
  title: string
  message: string
  target_user_id?: string
  target_role?: string
  work_order_number?: string
  type: 'assignment' | 'acceptance' | 'status_change' | 'completion' | 'system'
  is_read: boolean
  created_at: string
}

const NOTIFICATIONS_STORAGE_KEY = 'trufocus_crm_notifications_v1'

export function getNotifications(): CrmNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error loading notifications:', e)
  }
  return []
}

export function saveNotifications(list: CrmNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list))
    pushEntityToCloud('notifications', 'main', list)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
    }
  } catch (e) {
    console.error('Error saving notifications:', e)
  }
}

export function addNotification(data: Omit<CrmNotification, 'id' | 'is_read' | 'created_at'>): CrmNotification {
  const current = getNotifications()
  const newNotif: CrmNotification = {
    ...data,
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    is_read: false,
    created_at: new Date().toISOString(),
  }
  const updated = [newNotif, ...current].slice(0, 100) // Keep latest 100
  saveNotifications(updated)
  return newNotif
}

export function markNotificationAsRead(id: string): void {
  const current = getNotifications()
  const updated = current.map((n) => (n.id === id ? { ...n, is_read: true } : n))
  saveNotifications(updated)
}

export function markAllNotificationsAsRead(): void {
  const current = getNotifications()
  const updated = current.map((n) => ({ ...n, is_read: true }))
  saveNotifications(updated)
}
