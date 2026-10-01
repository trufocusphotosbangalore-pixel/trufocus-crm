import type { WorkOrder, WorkOrderEvent } from '@/types/workOrders'
import { getOrCreatePortalForWorkOrder } from '@/services/customerPortalStore'

const GCAL_STORAGE_KEY = 'trufocus_gcal_synced_events_v1'

function parseTimeString(str: string): string | null {
  if (!str) return null
  const match = str.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i)
  if (!match) return null

  let hours = parseInt(match[1], 10)
  const minutes = match[2] ? parseInt(match[2], 10) : 0
  const ampm = match[3] ? match[3].toUpperCase() : null

  if (ampm === 'PM' && hours < 12) hours += 12
  if (ampm === 'AM' && hours === 12) hours = 0

  const hStr = hours < 10 ? `0${hours}` : `${hours}`
  const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`
  return `${hStr}${mStr}00`
}

function addHours(timeHHMMSS: string, hoursToAdd: number): string {
  let h = parseInt(timeHHMMSS.substring(0, 2), 10) + hoursToAdd
  if (h >= 24) h -= 24
  const hStr = h < 10 ? `0${h}` : `${h}`
  return `${hStr}${timeHHMMSS.substring(2)}`
}

export function parseEventTimeRange(dateStr: string, timeStr?: string): { startISO: string; endISO: string } {
  const cleanDate = (dateStr || new Date().toISOString().split('T')[0]).replace(/\D/g, '') || '20261230'
  if (!timeStr || !timeStr.trim()) {
    return {
      startISO: `${cleanDate}T100000`,
      endISO: `${cleanDate}T140000`,
    }
  }

  const parts = timeStr.split(/[-–—to]+/i).map((s) => s.trim())
  const startTime = parseTimeString(parts[0]) || '100000'
  const endTime = parts[1] ? (parseTimeString(parts[1]) || addHours(startTime, 4)) : addHours(startTime, 4)

  return {
    startISO: `${cleanDate}T${startTime}`,
    endISO: `${cleanDate}T${endTime}`,
  }
}

export function generateGoogleCalendarUrl(wo: WorkOrder, evt?: WorkOrderEvent | null): string {
  const eventName = evt?.event_type_name || (evt as any)?.name || wo.event_type || 'Photography Shoot'
  const title = `${wo.project_name} - ${eventName}`

  const dateStr = evt?.event_date || wo.booking_date || new Date().toISOString().split('T')[0]
  const timeStr = evt?.event_time || (evt as any)?.time || '10:00 AM – 02:00 PM'

  const { startISO, endISO } = parseEventTimeRange(dateStr, timeStr)
  const dates = `${startISO}/${endISO}`

  const location = evt?.google_map_link || wo.google_map_link || evt?.venue || wo.venue || 'Bangalore, Karnataka'

  // Extract services text
  const servicesList = (evt?.services || []).map((s) => `- ${s.service_name} (${s.quantity || 1} Staff)`).join('\n')
  const fallbackServices = `- Traditional Photography\n- Candid Videography\n- Drone Coverage`

  // Financial calculations
  const packageAmt = wo.payment?.package_amount || 0
  const discountAmt = wo.payment?.discount_amount || 0
  const isGstApplicable = wo.payment?.gst_applicable ?? false
  const gstPct = isGstApplicable ? (wo.payment?.gst_percent || 18) : 0
  const gstAmt = isGstApplicable ? Math.round(((packageAmt - discountAmt) * gstPct) / 100) : 0
  const grandTotal = packageAmt - discountAmt + gstAmt
  const paidAmt = (wo.payment?.ledger || []).reduce((sum, item) => sum + (item.amount || 0), 0)
  const balanceDue = Math.max(0, grandTotal - paidAmt)

  const portal = getOrCreatePortalForWorkOrder(wo)

  const details = [
    `Work Order: ${wo.work_order_number}`,
    `Project: ${wo.project_name}`,
    ``,
    `Customer: ${wo.customer_name}`,
    `Phone: ${wo.mobile}`,
    `Email: ${wo.email || 'N/A'}`,
    ``,
    `Event Details:`,
    `Shoot Date: ${dateStr}`,
    `Time: ${timeStr}`,
    `Venue: ${evt?.venue || wo.venue || 'N/A'}`,
    `Google Maps: ${evt?.google_map_link || wo.google_map_link || 'N/A'}`,
    ``,
    `Services Booked:`,
    servicesList || fallbackServices,
    ``,
    `Payment Status: ${wo.payment_status?.toUpperCase() || 'PENDING'}`,
    `Grand Total: ₹${grandTotal.toLocaleString('en-IN')}`,
    `Balance Due: ₹${balanceDue.toLocaleString('en-IN')}`,
    ``,
    `Client Portal:`,
    portal.share_link,
    `Access PIN: ${portal.pin_code}`,
  ].join('\n')

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&ctz=Asia/Kolkata`
}

export function loadSyncedCalendarKeys(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(GCAL_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error loading calendar synced keys:', e)
  }
  return {}
}

export function isCalendarSynced(woNumber: string, eventId?: string): boolean {
  const keys = loadSyncedCalendarKeys()
  const key = `${woNumber}_${eventId || 'main'}`
  return Boolean(keys[key])
}

export function toggleCalendarSynced(woNumber: string, eventId?: string): boolean {
  const keys = loadSyncedCalendarKeys()
  const key = `${woNumber}_${eventId || 'main'}`
  const next = !keys[key]
  keys[key] = next

  try {
    localStorage.setItem(GCAL_STORAGE_KEY, JSON.stringify(keys))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
    }
  } catch (e) {
    console.error('Error saving calendar synced state:', e)
  }

  return next
}
