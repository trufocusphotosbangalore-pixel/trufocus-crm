import type { WorkOrder, WorkOrderEvent } from '@/types/workOrders'
import { WorkOrderWorkflowService } from '@/services/workOrderWorkflowService'

export type ComputedScheduleStatus =
  | 'upcoming'
  | 'todays_shoot'
  | 'ongoing'
  | 'in_progress'
  | 'editing'
  | 'completed'
  | 'delivered'
  | 'overdue'
  | 'cancelled'
  | 'deleted'
  | 'archived'

export interface NextShootDetails {
  event_id: string
  event_name: string
  event_date: string
  event_time: string
  venue: string
  status: ComputedScheduleStatus
  status_label: string
}

export interface DashboardStatusCounts {
  all: number
  upcoming: number
  todays_shoot: number
  ongoing: number
  editing: number
  completed: number
  cancelled: number
}

/**
 * Get current ISO Date string in YYYY-MM-DD format (local time zone)
 */
export function getTodayISODate(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Normalize any input date string to YYYY-MM-DD
 */
export function normalizeDateToISO(dateStr?: string | null): string {
  if (!dateStr) return getTodayISODate()
  const clean = dateStr.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean
  const parsed = new Date(clean)
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear()
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const day = String(parsed.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return clean
}

/**
 * Compute the lifecycle status of an individual Event Schedule
 */
export function computeEventScheduleStatus(
  event: Partial<WorkOrderEvent>,
  todayStr: string = getTodayISODate()
): ComputedScheduleStatus {
  const eventDate = normalizeDateToISO(event.event_date)

  const services = event.services || []
  let hasInProgressService = false
  let allServicesCompleted = services.length > 0

  services.forEach((s) => {
    const st = (s.status || '').toLowerCase()
    if (st === 'in_progress' || st === 'shooting' || st === 'started' || st === 'accepted') {
      hasInProgressService = true
    }
    if (st !== 'completed' && st !== 'approved') {
      allServicesCompleted = false
    }
  })

  if (hasInProgressService) return 'ongoing'
  if (allServicesCompleted && services.length > 0) return 'completed'

  if (eventDate === todayStr) {
    return 'todays_shoot'
  }

  if (eventDate > todayStr) {
    return 'upcoming'
  }

  return 'completed'
}

/**
 * Single Source of Truth Work Order Lifecycle Status Calculator
 * Priority Order:
 * 1. Cancelled / Deleted
 * 2. Completed: Shoot completed AND editing completed AND deliverables completed
 * 3. Editing: All shooting completed, 1+ editing tasks/deliverables pending
 * 4. Ongoing: Crew accepted assignment, shoot started, or crew checked in
 * 5. Today's Shoot: Event date is today, shoot not yet completed
 * 6. Upcoming: Next event date is in the future
 */
export function calculateWorkOrderStatus(
  wo: WorkOrder
): ComputedScheduleStatus {
  if (wo.status === 'archived' || wo.is_archived) return 'archived'
  if (wo.status === 'cancelled' || (wo as any).cancelled_at) return 'cancelled'
  if (wo.status === 'deleted' || wo.deleted_at) return 'deleted'

  return WorkOrderWorkflowService.calculateOverallStatus(wo) as ComputedScheduleStatus
}

/**
 * Calculate live counts for all status categories across all Work Orders
 */
export function calculateDashboardCounts(workOrders: WorkOrder[]): DashboardStatusCounts {
  const activeWOs = workOrders.filter((w) => !w.deleted_at && w.status !== 'deleted' && !w.is_archived && w.status !== 'archived')

  const counts: DashboardStatusCounts = {
    all: activeWOs.length,
    upcoming: 0,
    todays_shoot: 0,
    ongoing: 0,
    editing: 0,
    completed: 0,
    cancelled: 0,
  }

  activeWOs.forEach((w) => {
    const st = calculateWorkOrderStatus(w)
    if (st === 'upcoming') counts.upcoming++
    else if (st === 'todays_shoot') counts.todays_shoot++
    else if (st === 'ongoing' || st === 'in_progress') counts.ongoing++
    else if (st === 'editing') counts.editing++
    else if (st === 'completed' || st === 'delivered') counts.completed++
    else if (st === 'cancelled') counts.cancelled++
  })

  return counts
}

/**
 * Filter work orders list based on status and search query
 */
export function filterWorkOrdersList(
  workOrders: WorkOrder[],
  statusFilter: string = 'all',
  searchQuery: string = ''
): WorkOrder[] {
  const query = searchQuery.trim().toLowerCase()

  return workOrders.filter((w) => {
    if (w.deleted_at || w.status === 'deleted' || w.is_archived || w.status === 'archived') return false

    // Search query filter
    if (query) {
      const matchesSearch =
        w.customer_name?.toLowerCase().includes(query) ||
        w.project_name?.toLowerCase().includes(query) ||
        w.mobile?.includes(query) ||
        w.work_order_number?.toLowerCase().includes(query) ||
        (w.city && w.city.toLowerCase().includes(query)) ||
        (w.event_type && w.event_type.toLowerCase().includes(query))
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter !== 'all') {
      const computedStatus = calculateWorkOrderStatus(w)
      if (statusFilter === 'ongoing') {
        if (computedStatus !== 'ongoing' && computedStatus !== 'in_progress') return false
      } else if (computedStatus !== statusFilter) {
        return false
      }
    }

    return true
  })
}

/**
 * Identify the NEXT SHOOT (nearest upcoming event or today's event) for a Work Order
 */
export function getWorkOrderNextShoot(
  wo: WorkOrder,
  todayStr: string = getTodayISODate()
): NextShootDetails | null {
  const events = wo.events || []

  if (events.length === 0) {
    if (!wo.booking_date && !wo.event_type) return null
    const fallbackDate = normalizeDateToISO(wo.booking_date)
    const fallbackStatus = fallbackDate === todayStr ? 'todays_shoot' : fallbackDate > todayStr ? 'upcoming' : 'completed'
    return {
      event_id: 'default',
      event_name: wo.event_type || 'Photography / Videography Shoot',
      event_date: wo.booking_date || 'TBD',
      event_time: 'Full Day Event',
      venue: wo.venue || 'On Location Venue',
      status: fallbackStatus,
      status_label: getComputedStatusBadgeProps(fallbackStatus).label,
    }
  }

  const sortedEvents = [...events].sort((a, b) => {
    const da = normalizeDateToISO(a.event_date)
    const db = normalizeDateToISO(b.event_date)
    return da.localeCompare(db)
  })

  const nextEvent = sortedEvents.find((e) => normalizeDateToISO(e.event_date) >= todayStr)

  if (nextEvent) {
    const st = computeEventScheduleStatus(nextEvent, todayStr)
    return {
      event_id: nextEvent.id,
      event_name: nextEvent.event_type_name || wo.event_type || 'Event Shoot',
      event_date: nextEvent.event_date || wo.booking_date || 'TBD',
      event_time: nextEvent.event_time || (nextEvent.services && nextEvent.services[0]?.start_time ? `${nextEvent.services[0].start_time} - ${nextEvent.services[0].end_time}` : 'Full Day'),
      venue: nextEvent.venue || wo.venue || 'On Location Venue',
      status: st,
      status_label: getComputedStatusBadgeProps(st).label,
    }
  }

  const latestEvent = sortedEvents[sortedEvents.length - 1]
  const st = computeEventScheduleStatus(latestEvent, todayStr)
  return {
    event_id: latestEvent.id,
    event_name: latestEvent.event_type_name || wo.event_type || 'Event Shoot',
    event_date: latestEvent.event_date || wo.booking_date || 'TBD',
    event_time: latestEvent.event_time || 'Full Day',
    venue: latestEvent.venue || wo.venue || 'On Location Venue',
    status: st,
    status_label: getComputedStatusBadgeProps(st).label,
  }
}

/**
 * Alias for backward compatibility
 */
export const getWorkOrderComputedStatus = calculateWorkOrderStatus

/**
 * Return badge properties for computed statuses
 */
export function getComputedStatusBadgeProps(status: ComputedScheduleStatus): {
  label: string
  bgClass: string
  textClass: string
  borderClass: string
  dotClass: string
} {
  switch (status) {
    case 'upcoming':
      return {
        label: 'Upcoming',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-800',
        borderClass: 'border-amber-200',
        dotClass: 'bg-amber-500',
      }
    case 'todays_shoot':
      return {
        label: "Today's Shoot",
        bgClass: 'bg-sky-50',
        textClass: 'text-sky-700',
        borderClass: 'border-sky-200',
        dotClass: 'bg-sky-500',
      }
    case 'ongoing':
    case 'in_progress':
      return {
        label: 'Ongoing',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-700',
        borderClass: 'border-emerald-200',
        dotClass: 'bg-emerald-500',
      }
    case 'editing':
      return {
        label: 'Editing',
        bgClass: 'bg-purple-50',
        textClass: 'text-purple-700',
        borderClass: 'border-purple-200',
        dotClass: 'bg-purple-500',
      }
    case 'completed':
      return {
        label: 'Completed',
        bgClass: 'bg-emerald-100',
        textClass: 'text-emerald-900',
        borderClass: 'border-emerald-300',
        dotClass: 'bg-emerald-600',
      }
    case 'overdue':
      return {
        label: 'Overdue Production',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-800',
        borderClass: 'border-amber-300',
        dotClass: 'bg-amber-600',
      }
    case 'cancelled':
      return {
        label: 'Cancelled',
        bgClass: 'bg-red-50',
        textClass: 'text-red-700',
        borderClass: 'border-red-200',
        dotClass: 'bg-red-500',
      }
    case 'deleted':
      return {
        label: 'Deleted',
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-700',
        borderClass: 'border-gray-300',
        dotClass: 'bg-gray-500',
      }
    default:
      return {
        label: 'Upcoming',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-800',
        borderClass: 'border-amber-200',
        dotClass: 'bg-amber-500',
      }
  }
}

export const WorkOrderStatusService = {
  calculateWorkOrderStatus,
  calculateDashboardCounts,
  filterWorkOrdersList,
  getWorkOrderNextShoot,
  getWorkOrderComputedStatus,
  getComputedStatusBadgeProps,
}
