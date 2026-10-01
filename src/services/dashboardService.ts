import { getLocalWorkOrders } from '@/services/supabase/workOrders'
import { fetchEnquiriesLocal } from '@/services/supabase/enquiries'
import { getPayments } from '@/services/financeStore'
import { getWorkOrderComputedStatus } from '@/utils/workOrderStatusEngine'
import type { Enquiry } from '@/types/enquiries'

export interface DashboardStats {
  // Card 1: New Enquiries
  enquiriesToday: number
  enquiriesThisWeek: number
  enquiriesThisMonth: number

  // Card 2: Active Work Orders
  activeWorkOrdersCount: number

  // Card 3: Pending Payments
  totalPendingAmount: number
  pendingCustomersCount: number

  // Card 4: Today's Events
  todayEventsCount: number
  todayEventsBreakdown: Record<string, number>

  // Card 5: Upcoming Events (Next 7 days)
  upcomingEvents7DaysCount: number

  // Card 6: Pending Editing
  pendingEditingCount: number

  // Card 7: Completed Deliveries
  completedDeliveriesThisMonth: number

  // Card 8: Monthly Revenue
  monthlyRevenue: number
  revenueGrowthPct: number
}

export interface ActivityItem {
  id: string
  type: 'enquiry' | 'work_order' | 'payment' | 'contract' | 'shoot'
  title: string
  subtitle: string
  time: string
  timestamp: string
}

export interface TaskItem {
  id: string
  title: string
  client: string
  due: string
  priority: 'high' | 'medium' | 'low'
  workOrderId?: string
}

export interface RecentPaymentItem {
  id: string
  workOrderId: string
  workOrderNumber: string
  customerName: string
  amount: number
  paymentMode: string
  paymentDate: string
  status: string
}

export interface CalendarEventItem {
  id: string
  workOrderId: string
  workOrderNumber: string
  projectName: string
  customerName: string
  eventType: string
  eventDate: string
  eventTime?: string
  venue?: string
  isToday: boolean
}

export interface NotificationItem {
  id: string
  type: 'payment' | 'shoot' | 'gallery' | 'album' | 'contract' | 'approval'
  title: string
  message: string
  workOrderId?: string
  priority: 'high' | 'medium' | 'low'
}

export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN')
}

export function getDashboardStats(): DashboardStats {
  const workOrders = getLocalWorkOrders().filter(w => !w.deleted_at && w.status !== 'deleted')
  const enquiries = fetchEnquiriesLocal().filter(e => !e.deleted_at && e.status !== 'deleted')
  const allPayments = getPayments().filter(p => p.status === 'completed')

  const todayStr = new Date().toISOString().split('T')[0]

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  // Card 1: Enquiries
  const enquiriesToday = enquiries.filter((e: Enquiry) => e.created_at?.startsWith(todayStr)).length
  const enquiriesThisWeek = enquiries.filter((e: Enquiry) => new Date(e.created_at) >= startOfWeek).length
  const enquiriesThisMonth = enquiries.filter((e: Enquiry) => new Date(e.created_at) >= startOfMonth).length

  // Card 2: Active Work Orders (Upcoming, Today's Shoot, In Progress, Editing, Album Design)
  const activeWOs = workOrders.filter((w) => {
    const st = getWorkOrderComputedStatus(w)
    return ['upcoming', 'todays_shoot', 'in_progress', 'editing', 'album_design'].includes(st)
  })
  const activeWorkOrdersCount = activeWOs.length

  // Card 3: Pending Payments
  let totalPendingAmount = 0
  let pendingCustomersCount = 0

  workOrders.forEach(w => {
    const pkg = typeof w.payment?.package_amount === 'number' ? w.payment.package_amount : (typeof w.package_total === 'number' ? w.package_total : 0)
    const disc = w.payment?.discount_amount || 0
    const gst = w.payment?.gst_amount || 0
    const net = w.payment?.net_amount || Math.max(0, pkg - disc + gst)
    const woPaySum = allPayments
      .filter(p => p.work_order_id === w.id || p.work_order_number === w.work_order_number)
      .reduce((acc, cur) => acc + (cur.amount || 0), 0)
    const balance = Math.max(0, net - woPaySum)

    if (balance > 0) {
      totalPendingAmount += balance
      pendingCustomersCount++
    }
  })

  // Card 4: Today's Events & Breakdown
  let todayEventsCount = 0
  const todayEventsBreakdown: Record<string, number> = {}

  const next7Days = new Date(now)
  next7Days.setDate(now.getDate() + 7)

  let upcomingEvents7DaysCount = 0

  workOrders.forEach(w => {
    (w.events || []).forEach(ev => {
      if (!ev.event_date) return
      if (ev.event_date === todayStr) {
        todayEventsCount++
        const typeName = ev.event_type_name || 'Event'
        todayEventsBreakdown[typeName] = (todayEventsBreakdown[typeName] || 0) + 1
      }
      const evDate = new Date(ev.event_date)
      if (evDate > now && evDate <= next7Days) {
        upcomingEvents7DaysCount++
      }
    })
  })

  // Card 6: Pending Editing
  const pendingEditingCount = workOrders.filter(w =>
    w.status === 'editing' || w.status === 'album_design'
  ).length

  // Card 7: Completed Deliveries This Month
  const completedDeliveriesThisMonth = workOrders.filter(w => {
    if (w.status !== 'completed' && w.status !== 'ready_for_delivery') return false
    const d = new Date(w.updated_at || w.created_at)
    return d >= startOfMonth
  }).length

  // Card 8: Monthly Revenue (from canonical getPayments)
  let monthlyRevenue = 0
  let prevMonthRevenue = 0

  allPayments.forEach(entry => {
    if (!entry.payment_date) return
    const pDate = new Date(entry.payment_date)
    if (pDate >= startOfMonth) {
      monthlyRevenue += entry.amount || 0
    } else if (pDate >= prevMonthStart && pDate <= prevMonthEnd) {
      prevMonthRevenue += entry.amount || 0
    }
  })

  const revenueGrowthPct = prevMonthRevenue > 0
    ? Math.round(((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
    : monthlyRevenue > 0 ? 100 : 0

  return {
    enquiriesToday,
    enquiriesThisWeek,
    enquiriesThisMonth,
    activeWorkOrdersCount,
    totalPendingAmount,
    pendingCustomersCount,
    todayEventsCount,
    todayEventsBreakdown,
    upcomingEvents7DaysCount,
    pendingEditingCount,
    completedDeliveriesThisMonth,
    monthlyRevenue,
    revenueGrowthPct,
  }
}

function safeFormatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Recently'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'Recently'
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  } catch {
    return 'Recently'
  }
}

function safeGetTime(dateStr?: string | null): number {
  if (!dateStr) return 0
  try {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? 0 : d.getTime()
  } catch {
    return 0
  }
}

export function getRecentActivities(): ActivityItem[] {
  const workOrders = getLocalWorkOrders().filter(w => !w.deleted_at && w.status !== 'deleted')
  const enquiries = fetchEnquiriesLocal().filter(e => !e.deleted_at && e.status !== 'deleted')
  const allPayments = getPayments().filter(p => p.status === 'completed')
  const activities: ActivityItem[] = []

  workOrders.forEach(w => {
    activities.push({
      id: `act-wo-${w.id}`,
      type: 'work_order',
      title: `Work Order Created — ${w.work_order_number}`,
      subtitle: `${w.customer_name} • ${w.project_name}`,
      time: safeFormatDate(w.created_at),
      timestamp: w.created_at || new Date().toISOString(),
    })

    if (w.contract_status === 'signed') {
      activities.push({
        id: `act-cnt-${w.id}`,
        type: 'contract',
        title: `Contract Signed — ${w.work_order_number}`,
        subtitle: `${w.customer_name} signed agreement digitally`,
        time: safeFormatDate(w.contract_accepted_at),
        timestamp: w.contract_accepted_at || w.created_at || new Date().toISOString(),
      })
    }
  })

  allPayments.forEach(p => {
    activities.push({
      id: `act-pay-${p.id}`,
      type: 'payment',
      title: `Payment Received — ${formatINR(p.amount)}`,
      subtitle: `${p.customer_name} (${p.work_order_number}) via ${p.payment_mode}`,
      time: safeFormatDate(p.payment_date),
      timestamp: p.payment_date || new Date().toISOString(),
    })
  })

  enquiries.forEach((e: Enquiry) => {
    activities.push({
      id: `act-enq-${e.id}`,
      type: 'enquiry',
      title: `New Enquiry from ${e.customer_name}`,
      subtitle: `${e.event_type || 'Photography'} • ${e.location || 'Inquiry'}`,
      time: safeFormatDate(e.created_at),
      timestamp: e.created_at || new Date().toISOString(),
    })
  })

  return activities
    .sort((a, b) => safeGetTime(b.timestamp) - safeGetTime(a.timestamp))
    .slice(0, 7)
}

export function getUpcomingTasks(): TaskItem[] {
  const workOrders = getLocalWorkOrders().filter(w => !w.deleted_at && w.status !== 'deleted')
  const allPayments = getPayments().filter(p => p.status === 'completed')
  const tasks: TaskItem[] = []

  workOrders.forEach(w => {
    const pkg = typeof w.payment?.package_amount === 'number' ? w.payment.package_amount : (typeof w.package_total === 'number' ? w.package_total : 0)
    const disc = w.payment?.discount_amount || 0
    const gst = w.payment?.gst_amount || 0
    const net = w.payment?.net_amount || Math.max(0, pkg - disc + gst)
    const paid = allPayments
      .filter(p => p.work_order_id === w.id || p.work_order_number === w.work_order_number)
      .reduce((sum, p) => sum + (p.amount || 0), 0)
    const balance = Math.max(0, net - paid)

    if (balance > 0) {
      tasks.push({
        id: `tsk-bal-${w.id}`,
        title: `Collect Balance Payment (${formatINR(balance)})`,
        client: `${w.customer_name} (${w.work_order_number})`,
        due: 'Pending Balance',
        priority: 'medium',
        workOrderId: w.id,
      })
    }

    if (w.status === 'editing') {
      tasks.push({
        id: `tsk-edit-${w.id}`,
        title: `Complete Photo & Video Editing`,
        client: `${w.customer_name} — ${w.project_name}`,
        due: w.final_delivery_date || 'Next 5 Days',
        priority: 'high',
        workOrderId: w.id,
      })
    }

    if (w.status === 'album_design') {
      tasks.push({
        id: `tsk-alb-${w.id}`,
        title: `Upload Luxury Album Proof for Approval`,
        client: `${w.customer_name} (${w.work_order_number})`,
        due: w.album_delivery_date || 'In Progress',
        priority: 'medium',
        workOrderId: w.id,
      })
    }
  })

  return tasks.slice(0, 5)
}

// ─── Recent Payments Ledger Widget ───────────────────────────────────────────

export function getRecentPayments(): RecentPaymentItem[] {
  const allPayments = getPayments().filter(p => p.status === 'completed')

  return allPayments
    .sort((a, b) => safeGetTime(b.payment_date) - safeGetTime(a.payment_date))
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      workOrderId: p.work_order_id,
      workOrderNumber: p.work_order_number,
      customerName: p.customer_name,
      amount: p.amount,
      paymentMode: String(p.payment_mode).toUpperCase(),
      paymentDate: p.payment_date,
      status: 'Received',
    }))
}

export function getUpcomingEventsList(): CalendarEventItem[] {
  const workOrders = getLocalWorkOrders().filter(w => !w.deleted_at && w.status !== 'deleted')
  const todayStr = new Date().toISOString().split('T')[0]
  const events: CalendarEventItem[] = []

  workOrders.forEach(w => {
    (w.events || []).forEach(ev => {
      if (!ev.event_date) return
      events.push({
        id: ev.id,
        workOrderId: w.id,
        workOrderNumber: w.work_order_number,
        projectName: w.project_name,
        customerName: w.customer_name,
        eventType: ev.event_type_name || w.event_type,
        eventDate: ev.event_date,
        eventTime: ((ev as any).time || ev.event_time) ?? undefined,
        venue: (ev.venue || w.venue) ?? undefined,
        isToday: ev.event_date === todayStr,
      })
    })
  })

  return events
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 6)
}

export function getDashboardNotifications(): NotificationItem[] {
  const workOrders = getLocalWorkOrders().filter(w => !w.deleted_at && w.status !== 'deleted')
  const allPayments = getPayments().filter(p => p.status === 'completed')
  const notifications: NotificationItem[] = []

  workOrders.forEach(w => {
    const pkg = typeof w.payment?.package_amount === 'number' ? w.payment.package_amount : (typeof w.package_total === 'number' ? w.package_total : 0)
    const disc = w.payment?.discount_amount || 0
    const gst = w.payment?.gst_amount || 0
    const net = w.payment?.net_amount || Math.max(0, pkg - disc + gst)
    const paid = allPayments
      .filter(p => p.work_order_id === w.id || p.work_order_number === w.work_order_number)
      .reduce((sum, p) => sum + (p.amount || 0), 0)
    const balance = Math.max(0, net - paid)

    if (balance > 0 && w.status === 'ready_for_delivery') {
      notifications.push({
        id: `notif-bal-${w.id}`,
        type: 'payment',
        title: 'Pending Final Payment Before Delivery',
        message: `${w.customer_name} (${w.work_order_number}) has an outstanding balance of ${formatINR(balance)}.`,
        workOrderId: w.id,
        priority: 'high',
      })
    }
  })

  return notifications
}

export interface SearchResultItem {
  id: string
  title: string
  subtitle: string
  type: string
  category?: string
  link: string
}

export function globalSearch(query: string): SearchResultItem[] {
  if (!query || query.trim().length < 2) return []
  const q = query.toLowerCase().trim()
  const workOrders = getLocalWorkOrders().filter(w => !w.deleted_at && w.status !== 'deleted')
  const enquiries = fetchEnquiriesLocal().filter(e => !e.deleted_at && e.status !== 'deleted')
  const results: SearchResultItem[] = []

  workOrders.forEach(w => {
    if (
      w.work_order_number.toLowerCase().includes(q) ||
      w.customer_name.toLowerCase().includes(q) ||
      (w.mobile && w.mobile.includes(q)) ||
      (w.event_type && w.event_type.toLowerCase().includes(q))
    ) {
      results.push({
        id: `wo-${w.id}`,
        title: `${w.work_order_number} — ${w.customer_name}`,
        subtitle: `${w.event_type || 'Work Order'} • ${w.status.replace(/_/g, ' ')}`,
        type: 'Work Order',
        category: 'Work Order',
        link: `/work-orders/${w.id}`,
      })
    }
  })

  enquiries.forEach((e: Enquiry) => {
    if (
      e.customer_name.toLowerCase().includes(q) ||
      (e.mobile && e.mobile.includes(q)) ||
      (e.event_type && e.event_type.toLowerCase().includes(q))
    ) {
      results.push({
        id: `enq-${e.id}`,
        title: `Enquiry: ${e.customer_name}`,
        subtitle: `${e.event_type || 'Photography'} • ${e.status}`,
        type: 'Enquiry',
        category: 'Enquiry',
        link: '/enquiries',
      })
    }
  })

  return results.slice(0, 6)
}
