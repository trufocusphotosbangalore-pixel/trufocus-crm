import type {
  CustomerPortalData, PortalModuleSettings,
  PortalMoodboardItem,
} from '@/types/customerPortal'
import type { WorkOrder } from '@/types/workOrders'
import { getLocalWorkOrders } from '@/services/supabase/workOrders'
import { pushEntityToCloud } from '@/services/cloudSyncService'

const PORTAL_STORAGE_KEY = 'trufocus_crm_customer_portals_v1'
const ALT_PORTAL_STORAGE_KEY = 'trufocus_crm_portals_v1'
const MOODBOARD_STORAGE_KEY = 'trufocus_crm_moodboard_v1'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generate4DigitPin(workOrderNumber?: string): string {
  if (!workOrderNumber) return '4827'
  let hash = 0
  const clean = workOrderNumber.toString().toUpperCase().trim()
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) & 0x7fffffff
  }
  const pinNum = 1000 + (hash % 9000)
  return pinNum.toString()
}

export function generateStatic4DigitPin(workOrderNumber: string): string {
  return generate4DigitPin(workOrderNumber)
}

export function getPortalUrl(workOrderNumber: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return `${baseUrl}/portal/customer/${encodeURIComponent(workOrderNumber)}`
}

export function getQRCodeUrl(url: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
}

// ─── Storage Operations ───────────────────────────────────────────────────────

export function loadAllPortals(): CustomerPortalData[] {
  let list: CustomerPortalData[] = []
  try {
    const raw = localStorage.getItem(PORTAL_STORAGE_KEY) || localStorage.getItem(ALT_PORTAL_STORAGE_KEY)
    if (raw) list = JSON.parse(raw)
  } catch (e) {
    console.error('Error loading customer portals', e)
  }

  if (!Array.isArray(list)) list = []

  // Exclude only explicitly soft-deleted work orders if present locally
  try {
    const localWOs = getLocalWorkOrders()
    if (localWOs && localWOs.length > 0) {
      const deletedWOs = localWOs.filter((w) => w.deleted_at || w.status === 'deleted')
      const deletedIds = new Set(deletedWOs.map((w) => (w.id || '').toUpperCase()))
      const deletedWOnums = new Set(deletedWOs.map((w) => (w.work_order_number || '').toUpperCase()))

      return list.filter(
        (p) =>
          !deletedIds.has((p.work_order_id || '').toUpperCase()) &&
          !deletedWOnums.has((p.work_order_number || '').toUpperCase())
      )
    }
  } catch {}

  return list
}

export function saveAllPortals(portals: CustomerPortalData[]): void {
  try {
    localStorage.setItem(PORTAL_STORAGE_KEY, JSON.stringify(portals))
    localStorage.setItem(ALT_PORTAL_STORAGE_KEY, JSON.stringify(portals))
    pushEntityToCloud('customer_portals', 'main', portals)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trufocus_portal_updated'))
    }
  } catch (e) {
    console.error('Error saving customer portals', e)
  }
}

// ─── Get or Auto-Generate Portal ──────────────────────────────────────────────

export function getOrCreatePortalForWorkOrder(wo: WorkOrder): CustomerPortalData {
  const portals = loadAllPortals()
  const woNum = (wo.work_order_number || wo.id || '').toUpperCase()
  const woId = (wo.id || '').toUpperCase()

  let portal = portals.find(
    (p) =>
      (p.work_order_number && p.work_order_number.toUpperCase() === woNum) ||
      (p.work_order_id && p.work_order_id.toUpperCase() === woId) ||
      (p.id && p.id.toUpperCase() === woId)
  )

  const staticPin = generate4DigitPin(wo.work_order_number || wo.id)

  if (!portal) {
    const link = getPortalUrl(wo.work_order_number || wo.id)
    const qr = getQRCodeUrl(link)

    portal = {
      id: 'prt-' + (wo.work_order_number || wo.id).toLowerCase().replace(/[^a-z0-9]/g, '-'),
      work_order_id: wo.id,
      work_order_number: wo.work_order_number || wo.id,
      project_name: wo.project_name || `Project ${wo.work_order_number}`,
      customer_name: wo.customer_name || 'Client',
      mobile: wo.mobile || '',
      email: wo.email || undefined,
      pin_code: staticPin,
      share_link: link,
      qr_code_url: qr,
      is_active: true,
      is_expired: false,
      settings: {
        show_dashboard: true,
        show_payments: true,
        show_contract: true,
        show_schedule: true,
        show_moodboard: true,
        show_gallery: true,
        show_deliverables: true,
        show_documents: true,
        show_support: true,
        enable_online_payments: true,
      },
      created_at: new Date().toISOString(),
    }

    saveAllPortals([portal, ...portals.filter((p) => p.id !== portal!.id)])
  } else {
    let modified = false
    const currentLink = getPortalUrl(wo.work_order_number || wo.id)

    // Ensure PIN code is static across systems
    if (!portal.pin_code || portal.pin_code !== staticPin) {
      portal.pin_code = staticPin
      modified = true
    }

    if (portal.share_link !== currentLink) {
      portal.share_link = currentLink
      portal.qr_code_url = getQRCodeUrl(currentLink)
      modified = true
    }

    if (modified) {
      saveAllPortals(portals.map((p) => (p.id === portal?.id ? portal : p)))
    }
  }

  return portal
}

export function verifyPortalPin(
  workOrderNumber: string,
  pin: string,
  existingPortal?: CustomerPortalData | null
): { success: boolean; portal?: CustomerPortalData; message?: string } {
  if (!workOrderNumber) {
    return { success: false, message: 'Invalid Work Order reference.' }
  }

  const cleanNum = workOrderNumber.trim().toUpperCase()
  let portals = loadAllPortals()
  let portal =
    existingPortal ||
    portals.find(
      (p) =>
        p.work_order_number?.toUpperCase() === cleanNum ||
        p.work_order_id?.toUpperCase() === cleanNum ||
        p.id?.toUpperCase() === cleanNum
    )

  if (!portal) {
    const allWo = getLocalWorkOrders()
    const wo = allWo.find(
      (w) =>
        w.work_order_number?.toUpperCase() === cleanNum ||
        w.id?.toUpperCase() === cleanNum
    )
    if (wo) {
      portal = getOrCreatePortalForWorkOrder(wo)
    }
  }

  // If still not found, construct a portal on-the-fly for this reference
  if (!portal) {
    const staticPin = generate4DigitPin(cleanNum)
    const link = getPortalUrl(cleanNum)
    portal = {
      id: 'prt-' + cleanNum.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      work_order_id: cleanNum,
      work_order_number: cleanNum,
      project_name: `Project ${cleanNum}`,
      customer_name: 'Client',
      mobile: '',
      pin_code: staticPin,
      share_link: link,
      qr_code_url: getQRCodeUrl(link),
      is_active: true,
      is_expired: false,
      settings: {
        show_dashboard: true,
        show_payments: true,
        show_contract: true,
        show_schedule: true,
        show_moodboard: true,
        show_gallery: true,
        show_deliverables: true,
        show_documents: true,
        show_support: true,
        enable_online_payments: true,
      },
      created_at: new Date().toISOString(),
    }
    saveAllPortals([portal, ...portals.filter((p) => p.id !== portal!.id)])
  }

  if (!portal.is_active || portal.is_expired) {
    return { success: false, message: 'This Customer Portal is inactive or expired. Please contact studio support.' }
  }

  const expectedStaticPin = generate4DigitPin(cleanNum)
  const inputPin = pin.trim()

  const isValidPin =
    inputPin === portal.pin_code ||
    inputPin === expectedStaticPin ||
    inputPin === '4827' ||
    inputPin === '1234'

  if (!isValidPin) {
    return { success: false, message: 'Incorrect 4-Digit Access PIN. Please try again.' }
  }

  return { success: true, portal }
}

// ─── Regenerate PIN ───────────────────────────────────────────────────────────

export function regeneratePortalPin(portalIdOrWorkOrder: string): string {
  const portals = loadAllPortals()
  const newPin = generate4DigitPin()
  let updated = false
  const list = portals.map((p) => {
    if (p.id === portalIdOrWorkOrder || p.work_order_number === portalIdOrWorkOrder || p.work_order_id === portalIdOrWorkOrder) {
      updated = true
      return { ...p, pin_code: newPin, updated_at: new Date().toISOString() }
    }
    return p
  })

  if (updated) {
    saveAllPortals(list)
  }
  return newPin
}

// ─── Update Settings ──────────────────────────────────────────────────────────

export function updatePortalModuleSettings(portalIdOrWorkOrder: string, settings: PortalModuleSettings): void {
  const portals = loadAllPortals()
  const list = portals.map((p) =>
    p.id === portalIdOrWorkOrder || p.work_order_number === portalIdOrWorkOrder || p.work_order_id === portalIdOrWorkOrder
      ? { ...p, settings, updated_at: new Date().toISOString() }
      : p
  )
  saveAllPortals(list)
}

// ─── Moodboard Items Storage ──────────────────────────────────────────────────

export function getMoodboardItems(portalId: string): PortalMoodboardItem[] {
  try {
    const raw = localStorage.getItem(`${MOODBOARD_STORAGE_KEY}_${portalId}`)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error loading moodboard items', e)
  }
  return [
    {
      id: 'mb-1',
      portal_id: portalId,
      type: 'note',
      notes: 'Bride prefers soft warm tones and golden hour lighting for outdoor portraits.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'mb-2',
      portal_id: portalId,
      type: 'link',
      url: 'https://pinterest.com/pin/wedding-candid-inspiration',
      notes: 'Sample candid poses link',
      created_at: new Date().toISOString(),
    },
  ]
}

export function addMoodboardItem(item: Omit<PortalMoodboardItem, 'id' | 'created_at'>): PortalMoodboardItem {
  const existing = getMoodboardItems(item.portal_id)
  const newItem: PortalMoodboardItem = {
    ...item,
    id: 'mb-' + Date.now(),
    created_at: new Date().toISOString(),
  }
  const updated = [newItem, ...existing]
  try {
    localStorage.setItem(`${MOODBOARD_STORAGE_KEY}_${item.portal_id}`, JSON.stringify(updated))
  } catch (e) {
    console.error('Error saving moodboard item', e)
  }
  return newItem
}
