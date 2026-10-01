import { broadcastPaymentSync } from '@/hooks/useRealtimeSync'
import {
  getPostProductionItems,
  savePostProductionItems,
  addDeliverableActivityLog,
  updateDeliverableStatus as storeUpdateStatus,
} from '@/services/postProductionStore'
import { WorkOrderWorkflowService } from '@/services/workOrderWorkflowService'
import { addNotification } from '@/services/notificationService'
import type { PostProductionItem, DeliverableStatus } from '@/types/postProduction'
import type { UserAccount } from '@/types/teamLogin'

export interface EditorDashboardCounts {
  assignedCount: number
  inEditingCount: number
  waitingApprovalCount: number
  dueTodayCount: number
  completedTodayCount: number
}

/**
 * Single Source of Truth Service for Post Production Deliverable Assignments
 * Used by CRM Post Production Management and Crew Portal
 */
export const DeliverableAssignmentService = {
  /**
   * Assign an editor to a deliverable task
   */
  async assignEditor(
    deliverableId: string,
    editorId: string,
    editorName: string
  ): Promise<PostProductionItem | null> {
    const items = getPostProductionItems()
    const idx = items.findIndex((i) => i.id === deliverableId)
    if (idx === -1) return null

    const target = items[idx]
    const previousEditor = target.assigned_editor_name
    const previousStatus = target.status

    let newStatus = target.status
    let newProgress = target.progress_percent

    if (editorName && editorName.trim().length > 0) {
      if (!previousEditor) {
        if (previousStatus === 'not_started' || previousStatus === 'pending' || previousStatus === 'assigned') {
          newStatus = 'in_progress'
          newProgress = 40
        }
        addDeliverableActivityLog(deliverableId, `Deliverable assigned to ${editorName}`, 'Manager')
      } else if (previousEditor !== editorName) {
        if (previousStatus === 'not_started') {
          newStatus = 'in_progress'
          newProgress = 40
        }
        addDeliverableActivityLog(deliverableId, `Reassigned from ${previousEditor} to ${editorName}`, 'Manager')
      }
    } else {
      newStatus = 'not_started'
      newProgress = 0
      addDeliverableActivityLog(deliverableId, `Assignment removed`, 'Manager')
    }

    const updated: PostProductionItem = {
      ...target,
      assigned_editor_name: editorName || null,
      assigned_editor_id: editorName ? (editorId || target.assigned_editor_id || editorName) : null,
      status: newStatus,
      progress_percent: newProgress,
      updated_at: new Date().toISOString(),
    }

    items[idx] = updated
    savePostProductionItems(items)
    WorkOrderWorkflowService.syncWorkOrderStatus(target.work_order_id)

    // Notify Editor
    if (editorName) {
      this.notifyAssignment(updated)
    }

    // Broadcast Realtime Events across tabs, windows, and devices
    this.broadcastRealtimeUpdate()

    return updated
  },

  /**
   * Remove editor assignment from deliverable task
   */
  async removeEditor(deliverableId: string): Promise<PostProductionItem | null> {
    return this.assignEditor(deliverableId, '', '')
  },

  /**
   * Update task status & progress
   */
  async updateTaskStatus(
    deliverableId: string,
    newStatus: DeliverableStatus,
    progressPercent?: number
  ): Promise<PostProductionItem | null> {
    const res = storeUpdateStatus(deliverableId, newStatus, progressPercent)
    if (res) {
      WorkOrderWorkflowService.syncWorkOrderStatus(res.work_order_id)
      this.broadcastRealtimeUpdate()
    }
    return res
  },

  /**
   * Query post-production deliverable tasks assigned to a specific employee using canonical identifier matching
   */
  getAssignmentsByEmployee(employeeInput: string | UserAccount | null | undefined): PostProductionItem[] {
    if (!employeeInput) return []

    const identifiers = new Set<string>()

    if (typeof employeeInput === 'string') {
      const target = employeeInput.trim().toLowerCase()
      if (target) identifiers.add(target)
    } else if (typeof employeeInput === 'object') {
      const u = employeeInput as any
      if (u.id) identifiers.add(String(u.id).trim().toLowerCase())
      if (u.employee_id) identifiers.add(String(u.employee_id).trim().toLowerCase())
      if (u.employee_name) identifiers.add(String(u.employee_name).trim().toLowerCase())
      if (u.full_name) identifiers.add(String(u.full_name).trim().toLowerCase())
      if (u.email) identifiers.add(String(u.email).trim().toLowerCase())
    }

    // Attempt to enrich with local team member records for full canonical mapping
    try {
      const rawTeam = typeof window !== 'undefined' ? localStorage.getItem('trufocus_crm_team_members_v1') : null
      if (rawTeam) {
        let parsed = JSON.parse(rawTeam)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray((parsed as any).data)) {
          parsed = (parsed as any).data
        }
        if (Array.isArray(parsed)) {
          const matchedEmp = parsed.find((e: any) => {
            if (!e) return false
            const id = (e.id || '').toLowerCase()
            const empId = (e.employee_id || '').toLowerCase()
            const name = (e.employee_name || e.full_name || '').toLowerCase()
            const email = (e.email || '').toLowerCase()

            return Array.from(identifiers).some(
              (target) =>
                (id && (id === target || target.includes(id))) ||
                (empId && (empId === target || target.includes(empId))) ||
                (name && (name === target || name.includes(target) || target.includes(name))) ||
                (email && (email === target || target.includes(email)))
            )
          })

          if (matchedEmp) {
            if (matchedEmp.id) identifiers.add(String(matchedEmp.id).trim().toLowerCase())
            if (matchedEmp.employee_id) identifiers.add(String(matchedEmp.employee_id).trim().toLowerCase())
            if (matchedEmp.employee_name) identifiers.add(String(matchedEmp.employee_name).trim().toLowerCase())
            if (matchedEmp.full_name) identifiers.add(String(matchedEmp.full_name).trim().toLowerCase())
            if (matchedEmp.email) identifiers.add(String(matchedEmp.email).trim().toLowerCase())
          }
        }
      }
    } catch (e) {
      console.error('Error enriching employee identifiers:', e)
    }

    const idList = Array.from(identifiers)
    if (idList.length === 0) return []

    const allItems = getPostProductionItems()
    return allItems.filter((item) => {
      const assignedName = (item.assigned_editor_name || '').toLowerCase()
      const assignedId = (item.assigned_editor_id || (item as any).assigned_to || '').toLowerCase()

      return idList.some(
        (target) =>
          (assignedId && (assignedId === target || assignedId.includes(target) || target.includes(assignedId))) ||
          (assignedName && (assignedName === target || assignedName.includes(target) || target.includes(assignedName)))
      )
    })
  },

  /**
   * Query deliverable tasks for a specific Work Order
   */
  getAssignmentsByWorkOrder(workOrderId: string): PostProductionItem[] {
    if (!workOrderId) return []
    const allItems = getPostProductionItems()
    return allItems.filter((item) => item.work_order_id === workOrderId || item.work_order_number === workOrderId)
  },

  /**
   * Calculate editor dashboard counts
   */
  getEditorDashboardCounts(employeeInput: string | UserAccount | null | undefined): EditorDashboardCounts {
    const list = this.getAssignmentsByEmployee(employeeInput)
    const todayStr = new Date().toISOString().split('T')[0]

    let assignedCount = 0
    let inEditingCount = 0
    let waitingApprovalCount = 0
    let dueTodayCount = 0
    let completedTodayCount = 0

    list.forEach((item) => {
      const st = item.status
      if (st !== 'completed' && st !== 'delivered' && st !== 'done') {
        assignedCount++
      }

      if (st === 'in_progress' || st === 'editing') {
        inEditingCount++
      }

      if (st === 'ready_for_review' || st === 'review' || st === 'for_review' || st === 'client_approval') {
        waitingApprovalCount++
      }

      if (item.due_date && item.due_date <= todayStr && st !== 'completed' && st !== 'delivered') {
        dueTodayCount++
      }

      if ((st === 'completed' || st === 'delivered' || st === 'done') && item.updated_at?.startsWith(todayStr)) {
        completedTodayCount++
      }
    })

    return {
      assignedCount,
      inEditingCount,
      waitingApprovalCount,
      dueTodayCount,
      completedTodayCount,
    }
  },

  /**
   * Push notification to assigned editor
   */
  notifyAssignment(item: PostProductionItem): void {
    addNotification({
      type: 'assignment',
      title: 'New Post-Production Task Assigned',
      message: `You have been assigned "${item.deliverable_name}" for ${item.customer_name} (${item.work_order_number}).`,
      work_order_number: item.work_order_number,
    })
  },

  /**
   * Broadcast realtime events across windows, tabs, BroadcastChannel & custom events
   */
  broadcastRealtimeUpdate(): void {
    if (typeof window !== 'undefined') {
      try {
        broadcastPaymentSync()
        window.dispatchEvent(new CustomEvent('trufocus_assignments_updated'))
        window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
        window.dispatchEvent(new CustomEvent('postProductionUpdated'))
      } catch (e) {
        console.error('Error broadcasting deliverable assignment update:', e)
      }
    }
  },

  /**
   * Subscribe to assignment changes
   */
  subscribeAssignments(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {}

    const handleUpdate = () => callback()

    window.addEventListener('trufocus_assignments_updated', handleUpdate)
    window.addEventListener('workOrdersUpdated', handleUpdate)
    window.addEventListener('postProductionUpdated', handleUpdate)
    window.addEventListener('storage', handleUpdate)

    return () => {
      window.removeEventListener('trufocus_assignments_updated', handleUpdate)
      window.removeEventListener('workOrdersUpdated', handleUpdate)
      window.removeEventListener('postProductionUpdated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  },
}
