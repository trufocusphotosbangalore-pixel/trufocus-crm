import { getLocalWorkOrders, saveLocalWorkOrders } from '@/services/supabase/workOrders'
import { getPostProductionItems, isWorkOrderProductionCompleted } from '@/services/postProductionStore'
import { broadcastPaymentSync } from '@/hooks/useRealtimeSync'
import type { WorkOrder, WorkOrderStatus } from '@/types/workOrders'
import type { PostProductionItem } from '@/types/postProduction'

export interface EditingWorkflowStats {
  status: 'not_started' | 'editing' | 'completed' | 'delivered'
  progressPercent: number
  completedCount: number
  totalCount: number
}

export type CanonicalStageId =
  | 'enquiry'
  | 'quotation'
  | 'approved'
  | 'advance_paid'
  | 'work_order'
  | 'shoot_completed'
  | 'editing'
  | 'album_design'
  | 'customer_approval'
  | 'delivery'
  | 'completed'
  | 'cancelled'

export interface ProjectLifecycleInfo {
  stageId: CanonicalStageId
  stageIndex: number // 0 to 10 for active stages, -1 for cancelled
  stageLabel: string
  shootStatus: 'upcoming' | 'todays_shoot' | 'ongoing' | 'completed' | 'cancelled'
  postProductionStatus: 'not_started' | 'editing' | 'album_design' | 'customer_approval' | 'completed' | 'delivered'
  requiredDeliverablesCount: number
  completedDeliverablesCount: number
  deliveredDeliverablesCount: number
  postProductionComplete: boolean
  clientApprovalRequired: boolean
  clientApprovalStatus: 'not_required' | 'pending' | 'approved'
  deliveryStatus: 'pending' | 'delivered'
  projectCompleted: boolean
}

const syncInProgress = new Set<string>()

/**
 * Single Source of Truth Event-Driven Workflow Engine for Work Orders & Project Lifecycle
 */
export const WorkOrderWorkflowService = {
  /**
   * Calculate shoot/production status from Event Schedule
   * Evaluates next pending schedule in chronological order for multi-day events.
   */
  calculateProductionStatus(wo: WorkOrder): 'cancelled' | 'upcoming' | 'todays_shoot' | 'ongoing' | 'completed' {
    const rawSt = (wo.status || '').toLowerCase()
    if (rawSt === 'cancelled' || rawSt === 'deleted') return 'cancelled'

    if (wo.production_completed === true) return 'completed'

    const todayStr = new Date().toISOString().split('T')[0]
    const events = wo.events || []

    if (events.length === 0) {
      if (wo.booking_date && wo.booking_date.trim() !== '' && wo.booking_date.trim() < todayStr) {
        return 'completed'
      }
      if (wo.booking_date && wo.booking_date.trim() === todayStr) {
        return 'todays_shoot'
      }
      return 'upcoming'
    }

    // Step 1: Sort schedule entries chronologically by event_date
    const sortedEvents = [...events].sort((a, b) => {
      const da = (a.event_date || '').trim()
      const db = (b.event_date || '').trim()
      return da.localeCompare(db)
    })

    // Helper: Determine if an individual event schedule is completed
    const isEventScheduleCompleted = (ev: any): boolean => {
      const evDateStr = ev.event_date ? ev.event_date.trim() : ''

      if (evDateStr && evDateStr < todayStr) {
        return true
      }

      const services = ev.services || []
      if (services.length > 0) {
        const allServicesDone = services.every((s: any) => {
          const st = (s.status || '').toLowerCase()
          const team = s.assigned_team || []
          return st === 'completed' || st === 'approved' ||
            (team.length > 0 && team.every((m: any) => {
              const mst = (m.assignment_status || m.status || '').toLowerCase()
              return mst === 'completed' || mst === 'submitted' || mst === 'approved'
            }))
        })
        if (allServicesDone) return true
      }

      return false
    }

    // Step 2: Find the next pending (uncompleted) schedule in chronological order
    const nextPendingEvent = sortedEvents.find((ev) => !isEventScheduleCompleted(ev))

    // If ALL schedules are completed
    if (!nextPendingEvent) {
      return 'completed'
    }

    const nextDateStr = nextPendingEvent.event_date ? nextPendingEvent.event_date.trim() : ''

    // Future schedule -> Upcoming
    if (nextDateStr > todayStr) {
      return 'upcoming'
    }

    // Today's schedule
    if (nextDateStr === todayStr) {
      const services = nextPendingEvent.services || []
      const hasStarted = services.some((s: any) => {
        const st = (s.status || '').toLowerCase()
        const team = s.assigned_team || []
        return st === 'in_progress' || st === 'shooting' || st === 'started' || st === 'accepted' ||
          team.some((m: any) => {
            const mst = (m.assignment_status || m.status || '').toLowerCase()
            return mst === 'accepted' || mst === 'in_progress' || mst === 'checked_in'
          })
      })
      if (hasStarted) return 'ongoing'
      return 'todays_shoot'
    }

    return 'completed'
  },

  /**
   * Calculate Editing status and progress percentage from Post-Production Deliverables
   */
  calculateEditingStatus(wo: WorkOrder, providedDeliverables?: PostProductionItem[]): EditingWorkflowStats {
    const allDeliverables = providedDeliverables || getPostProductionItems()
    const woDeliverables = allDeliverables.filter(
      (d) => d.work_order_id === wo.id || d.work_order_number === wo.work_order_number
    )

    if (woDeliverables.length === 0) {
      return {
        status: 'not_started',
        progressPercent: 0,
        completedCount: 0,
        totalCount: 0,
      }
    }

    let completedCount = 0
    let deliveredCount = 0

    woDeliverables.forEach((d) => {
      const st = d.status
      if (st === 'completed' || st === 'done') {
        completedCount++
      } else if (st === 'delivered') {
        completedCount++
        deliveredCount++
      }
    })

    const totalCount = woDeliverables.length
    const progressPercent = Math.round((completedCount / totalCount) * 100)

    if (deliveredCount === totalCount && totalCount > 0) {
      return { status: 'delivered', progressPercent: 100, completedCount, totalCount }
    }

    if (completedCount === totalCount && totalCount > 0) {
      return { status: 'completed', progressPercent: 100, completedCount, totalCount }
    }

    if (completedCount > 0 || isWorkOrderProductionCompleted(wo)) {
      return { status: 'editing', progressPercent, completedCount, totalCount }
    }

    return { status: 'not_started', progressPercent, completedCount, totalCount }
  },

  /**
   * Single Source of Truth: Canonical Project Lifecycle Calculation
   */
  getProjectLifecycle(wo: WorkOrder): ProjectLifecycleInfo {
    const rawSt = (wo.status || '').toLowerCase()
    if (rawSt === 'cancelled' || rawSt === 'deleted') {
      return {
        stageId: 'cancelled',
        stageIndex: -1,
        stageLabel: 'Cancelled',
        shootStatus: 'cancelled',
        postProductionStatus: 'not_started',
        requiredDeliverablesCount: 0,
        completedDeliverablesCount: 0,
        deliveredDeliverablesCount: 0,
        postProductionComplete: false,
        clientApprovalRequired: false,
        clientApprovalStatus: 'not_required',
        deliveryStatus: 'pending',
        projectCompleted: false,
      }
    }

    const prodStatus = this.calculateProductionStatus(wo)
    const isShootFinished = prodStatus === 'completed' || wo.production_completed === true

    // Fetch post production deliverables
    const allDeliverables = getPostProductionItems()
    const woDeliverables = allDeliverables.filter(
      (d) => d.work_order_id === wo.id || d.work_order_number === wo.work_order_number
    )

    let completedDeliverablesCount = 0
    let deliveredDeliverablesCount = 0
    let isAlbumActive = false
    let isEditingActive = false
    let isCustomerApprovalActive = false

    woDeliverables.forEach((d) => {
      const st = (d.status || '').toLowerCase()
      const delName = (d.deliverable_name || '').toLowerCase()

      if (st === 'completed' || st === 'done') {
        completedDeliverablesCount++
      } else if (st === 'delivered') {
        completedDeliverablesCount++
        deliveredDeliverablesCount++
      }

      if (d.approval_status === 'sent_for_approval' || st === 'client_approval' || st === 'customer_approval') {
        isCustomerApprovalActive = true
      }

      if (delName.includes('album') || delName.includes('photobook') || delName.includes('book') || delName.includes('frame')) {
        if (st === 'in_progress' || st === 'internal_review' || st === 'assigned' || st === 'ready_for_review') {
          isAlbumActive = true
        }
      } else if (st === 'in_progress' || st === 'editing' || st === 'internal_review') {
        isEditingActive = true
      }
    })

    const requiredDeliverablesCount = woDeliverables.length > 0
      ? woDeliverables.length
      : ((wo.deliverables || []).filter((d) => d.is_included !== false).length || 1)

    const postProductionComplete =
      woDeliverables.length > 0
        ? (deliveredDeliverablesCount === requiredDeliverablesCount || completedDeliverablesCount === requiredDeliverablesCount)
        : (rawSt === 'completed' || rawSt === 'delivered' || wo.production_completed === true)

    const clientApprovalRequired = isCustomerApprovalActive || woDeliverables.some((d) => d.approval_status !== 'not_sent')
    const clientApprovalStatus: 'not_required' | 'pending' | 'approved' =
      !clientApprovalRequired ? 'not_required' : isCustomerApprovalActive ? 'pending' : 'approved'

    const projectCompleted = rawSt === 'completed' || (postProductionComplete && (isShootFinished || woDeliverables.length > 0))
    const deliveryStatus: 'pending' | 'delivered' = postProductionComplete ? 'delivered' : 'pending'

    // Determine Stage
    let stageId: CanonicalStageId = 'enquiry'
    let stageIndex = 0

    const signed = wo.contract_status === 'signed' || Boolean(wo.contract?.customer_signature)
    const hasAdvance = wo.payment_status === 'advance_received' || wo.payment_status === 'partially_paid' || wo.payment_status === 'fully_paid'
    const woAny = wo as any

    if (projectCompleted || (postProductionComplete && deliveredDeliverablesCount > 0)) {
      stageId = 'completed'
      stageIndex = 10
    } else if (postProductionComplete || (completedDeliverablesCount === requiredDeliverablesCount && requiredDeliverablesCount > 0)) {
      stageId = 'delivery'
      stageIndex = 9
    } else if (isCustomerApprovalActive) {
      stageId = 'customer_approval'
      stageIndex = 8
    } else if (isAlbumActive) {
      stageId = 'album_design'
      stageIndex = 7
    } else if (isEditingActive || (isShootFinished && woDeliverables.some(d => d.status !== 'not_started'))) {
      stageId = 'editing'
      stageIndex = 6
    } else if (isShootFinished) {
      stageId = 'shoot_completed'
      stageIndex = 5
    } else if (signed) {
      stageId = 'work_order'
      stageIndex = 4
    } else if (hasAdvance) {
      stageId = 'advance_paid'
      stageIndex = 3
    } else if (woAny.quotation_approved) {
      stageId = 'approved'
      stageIndex = 2
    } else if (woAny.quotation_sent) {
      stageId = 'quotation'
      stageIndex = 1
    } else {
      stageId = 'enquiry'
      stageIndex = 0
    }

    const STAGE_LABELS: Record<CanonicalStageId, string> = {
      enquiry: 'Enquiry',
      quotation: 'Quotation',
      approved: 'Approved',
      advance_paid: 'Advance Paid',
      work_order: 'Work Order Created',
      shoot_completed: 'Shoot Completed',
      editing: 'Editing',
      album_design: 'Album Design',
      customer_approval: 'Customer Approval',
      delivery: 'Delivery',
      completed: 'Completed',
      cancelled: 'Cancelled',
    }

    return {
      stageId,
      stageIndex,
      stageLabel: STAGE_LABELS[stageId],
      shootStatus: prodStatus,
      postProductionStatus: postProductionComplete
        ? 'delivered'
        : isCustomerApprovalActive
        ? 'customer_approval'
        : isAlbumActive
        ? 'album_design'
        : isEditingActive || isShootFinished
        ? 'editing'
        : 'not_started',
      requiredDeliverablesCount,
      completedDeliverablesCount,
      deliveredDeliverablesCount,
      postProductionComplete,
      clientApprovalRequired,
      clientApprovalStatus,
      deliveryStatus,
      projectCompleted,
    }
  },

  /**
   * Calculate overall canonical WorkOrder status
   */
  calculateOverallStatus(wo: WorkOrder, _providedDeliverables?: PostProductionItem[]): WorkOrderStatus {
    const rawSt = (wo.status || '').toLowerCase()
    if (rawSt === 'cancelled' || rawSt === 'deleted') return 'cancelled'

    const lifecycle = this.getProjectLifecycle(wo)
    if (lifecycle.projectCompleted || lifecycle.stageId === 'completed') return 'completed'
    if (lifecycle.stageId === 'delivery') return 'completed'
    if (lifecycle.stageId === 'editing' || lifecycle.stageId === 'album_design' || lifecycle.stageId === 'customer_approval') return 'editing'

    const prodStatus = this.calculateProductionStatus(wo)
    if (prodStatus === 'completed') return 'editing'
    if (prodStatus === 'ongoing') return 'ongoing'
    if (prodStatus === 'todays_shoot') return 'todays_shoot'

    return 'upcoming'
  },

  /**
   * Recalculate and persist WorkOrder status & progress percentage upon any workflow event
   */
  syncWorkOrderStatus(workOrderId: string): WorkOrder | null {
    if (!workOrderId || syncInProgress.has(workOrderId)) return null

    syncInProgress.add(workOrderId)
    try {
      const workOrders = getLocalWorkOrders()
      const woIndex = workOrders.findIndex(
        (w) => w.id === workOrderId || w.work_order_number === workOrderId
      )

      if (woIndex === -1) return null

      const wo = workOrders[woIndex]
      const lifecycle = this.getProjectLifecycle(wo)
      const newStatus = this.calculateOverallStatus(wo)

      let updated = false
      const updatedWo = { ...wo }

      if (wo.status !== newStatus) {
        updatedWo.status = newStatus
        updated = true
      }

      if (lifecycle.requiredDeliverablesCount > 0) {
        const calcPercent = Math.round((lifecycle.completedDeliverablesCount / lifecycle.requiredDeliverablesCount) * 100)
        if (wo.progress_percent !== calcPercent) {
          updatedWo.progress_percent = calcPercent
          updated = true
        }
      }

      if (lifecycle.projectCompleted && !wo.production_completed) {
        updatedWo.production_completed = true
        updatedWo.production_completed_at = new Date().toISOString()
        updated = true
      }

      if (updated) {
        updatedWo.updated_at = new Date().toISOString()
        workOrders[woIndex] = updatedWo
        saveLocalWorkOrders(workOrders)

        this.broadcastWorkflowEvent()
      }

      return updatedWo
    } finally {
      syncInProgress.delete(workOrderId)
    }
  },

  /**
   * Run one-time backfill reconciliation over all existing Work Orders
   */
  reconcileAllLifecycles(): void {
    try {
      const workOrders = getLocalWorkOrders()
      let anyChanged = false

      workOrders.forEach((wo, idx) => {
        if (wo.deleted_at || wo.status === 'deleted') return
        const lifecycle = this.getProjectLifecycle(wo)

        let changed = false
        const updatedWo = { ...wo }

        if (lifecycle.projectCompleted && wo.status !== 'completed' && wo.status !== 'delivered') {
          updatedWo.status = 'completed'
          updatedWo.production_completed = true
          updatedWo.progress_percent = 100
          changed = true
        } else if (lifecycle.stageId === 'editing' && wo.status !== 'editing') {
          updatedWo.status = 'editing'
          changed = true
        }

        if (changed) {
          workOrders[idx] = updatedWo
          anyChanged = true
        }
      })

      if (anyChanged) {
        saveLocalWorkOrders(workOrders)
        this.broadcastWorkflowEvent()
      }
    } catch (e) {
      console.error('Error reconciling lifecycles:', e)
    }
  },

  /**
   * Broadcast realtime workflow update event
   */
  broadcastWorkflowEvent(): void {
    if (typeof window !== 'undefined') {
      try {
        broadcastPaymentSync()
        window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
        window.dispatchEvent(new CustomEvent('postProductionUpdated'))
        window.dispatchEvent(new CustomEvent('trufocus_assignments_updated'))
      } catch (e) {
        console.error('Error broadcasting workflow event:', e)
      }
    }
  },

  /**
   * Subscribe to workflow changes
   */
  subscribeWorkflowChanges(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {}

    const handleEvent = () => callback()

    window.addEventListener('workOrdersUpdated', handleEvent)
    window.addEventListener('postProductionUpdated', handleEvent)
    window.addEventListener('trufocus_assignments_updated', handleEvent)
    window.addEventListener('storage', handleEvent)

    return () => {
      window.removeEventListener('workOrdersUpdated', handleEvent)
      window.removeEventListener('postProductionUpdated', handleEvent)
      window.removeEventListener('trufocus_assignments_updated', handleEvent)
      window.removeEventListener('storage', handleEvent)
    }
  },
}
