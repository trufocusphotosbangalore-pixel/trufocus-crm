import {
  loadAssignmentRecords,
  getAssignmentActivityLogs,
  getPersonalShootTasks,
  getPersonalEditingTasks,
  updateAssignmentStage,
  type AssignmentRecord,
  type CanonicalAssignmentStatus,
} from './assignmentEngineService'
import { fetchAllEmployeesFromCloud } from './employeeService'
import { getLocalWorkOrders, saveLocalWorkOrders } from './supabase/workOrders'
import { supabase } from './supabase/client'
import { isCloudConfigured } from './cloudSyncService'
import { addNotification } from './notificationService'
import type { UserAccount } from '@/types/teamLogin'
import type { WorkOrderTeamAssignment } from '@/types/workOrders'

export type { CanonicalAssignmentStatus, AssignmentRecord }

export interface StaffAvailabilityItem {
  employee: UserAccount
  is_available: boolean
  assigned_count_today: number
  assignments_today: AssignmentRecord[]
  status_label: 'Available' | 'Assigned (Busy)' | 'On Leave'
}

export interface StaffWorkloadSummary {
  employee_id: string
  employee_name: string
  job_role: string
  department: string
  total_assignments: number
  pending_acceptances: number
  active_shoots: number
  active_editing: number
  completed: number
}

const TABLE = 'team_assignments'

/**
 * Canonical AssignmentService
 * Manages all event service team assignments, status transitions, staff availability, and workload monitoring.
 */
export const AssignmentService = {
  /**
   * Load all assignment records from cloud database / derived work orders
   */
  async loadAllAssignments(): Promise<AssignmentRecord[]> {
    return loadAssignmentRecords()
  },

  /**
   * Get assignments specific to an employee by ID or user profile
   */
  async getAssignmentsForEmployee(employeeId: string, userAccount?: any): Promise<AssignmentRecord[]> {
    const { getAssignmentsForEmployee: getForEmp } = await import('./assignmentEngineService')
    return getForEmp(employeeId, userAccount)
  },

  /**
   * Get assignment activity logs for Manager / Owner feeds
   */
  async getActivityLogs() {
    return getAssignmentActivityLogs()
  },

  /**
   * Get personal shoot tasks for Photographer / Videographer
   */
  async getPersonalShootTasks(userName: string, userEmailOrEmpId: string, role: string) {
    return getPersonalShootTasks(userName, userEmailOrEmpId, role)
  },

  /**
   * Get personal editing tasks for Photo Editor, Video Editor, or Album Designer
   */
  async getPersonalEditingTasks(userName: string, userEmailOrEmpId: string, roleCategory: 'photo' | 'video' | 'album') {
    return getPersonalEditingTasks(userName, userEmailOrEmpId, roleCategory)
  },

  async acceptAssignment(assignmentId: string, userName: string) {
    const { acceptAssignment: acceptEngine } = await import('./assignmentEngineService')
    return acceptEngine(assignmentId, userName)
  },

  async declineAssignment(assignmentId: string, userName: string, reason: string, notes?: string) {
    const { declineAssignment: declineEngine } = await import('./assignmentEngineService')
    return declineEngine(assignmentId, userName, reason, notes)
  },

  async completeShootAssignment(assignmentId: string, userName: string, dataCollection: { memoryCardReturned: boolean; remarks?: string }) {
    const { completeShootAssignment: completeEngine } = await import('./assignmentEngineService')
    return completeEngine(assignmentId, userName, dataCollection)
  },

  /**
   * Assign team members to a specific service inside an event of a Work Order
   */
  async assignTeamToService(params: {
    workOrderId: string
    eventId: string
    serviceId: string
    assignedMembers: { employee_id: string; employee_name: string; role_title: string }[]
    assignedBy?: string
  }): Promise<{ success: boolean; message: string }> {
    const { workOrderId, eventId, serviceId, assignedMembers, assignedBy = 'Manager' } = params

    const workOrders = getLocalWorkOrders()
    const woIndex = workOrders.findIndex((w) => w.id === workOrderId)
    if (woIndex === -1) {
      return { success: false, message: 'Work Order not found.' }
    }

    const wo = workOrders[woIndex]
    const event = (wo.events || []).find((e) => e.id === eventId)
    if (!event) {
      return { success: false, message: 'Event not found in Work Order.' }
    }

    const service = (event.services || []).find((s) => s.id === serviceId)
    if (!service) {
      return { success: false, message: 'Service not found in Event.' }
    }

    // Update work order service assigned team
    const updatedTeam: WorkOrderTeamAssignment[] = assignedMembers.map((m) => ({
      id: `${serviceId}:${m.employee_id}`,
      service_id: serviceId,
      employee_id: m.employee_id,
      employee_name: m.employee_name,
      role_title: m.role_title,
    }))
    service.assigned_team = updatedTeam
    wo.updated_at = new Date().toISOString()
    saveLocalWorkOrders(workOrders)

    // Build assignment records for Supabase team_assignments table
    const now = new Date().toISOString()
    const recordsToUpsert: AssignmentRecord[] = assignedMembers.map((m) => {
      const id = `${workOrderId}:${eventId}:${serviceId}:${m.employee_id}`
      const isEditor = m.role_title.toLowerCase().includes('editor') || m.role_title.toLowerCase().includes('album')
      const taskType = m.role_title.toLowerCase().includes('video')
        ? isEditor ? 'editing' : 'videography'
        : m.role_title.toLowerCase().includes('album')
        ? 'album_design'
        : isEditor ? 'editing' : 'photography'

      return {
        id,
        work_order_id: wo.id,
        work_order_number: wo.work_order_number,
        customer_name: wo.customer_name,
        customer_mobile: wo.mobile || '',
        event_id: event.id,
        event_type: event.event_type_name || wo.event_type,
        event_date: event.event_date || wo.booking_date || '',
        event_time: service.start_time ? `${service.start_time} - ${service.end_time}` : event.event_time || '',
        venue: event.venue || wo.venue || 'Studio / On Location',
        google_map_link: event.google_map_link || wo.google_map_link || undefined,
        service_id: service.id,
        service_name: service.service_name,
        role_title: m.role_title,
        task_type: taskType,
        assigned_to_id: m.employee_id,
        assigned_to_name: m.employee_name,
        assigned_by: assignedBy,
        assigned_at: now,
        status: 'assigned',
        created_at: now,
        updated_at: now,
      }
    })

    if (isCloudConfigured() && recordsToUpsert.length > 0) {
      try {
        await supabase.from(TABLE).upsert(recordsToUpsert, { onConflict: 'id' })
      } catch (e) {
        console.warn('[AssignmentService] Cloud assignment upsert failed:', e)
      }
    }

    // Trigger local & cloud notifications
    assignedMembers.forEach((member) => {
      addNotification({
        title: 'New Service Assignment',
        message: `You have been assigned to ${service.service_name} for Work Order ${wo.work_order_number}`,
        type: 'assignment',
        target_role: member.role_title.toLowerCase(),
        work_order_number: wo.work_order_number,
      })
    })

    // Dispatch global sync event
    window.dispatchEvent(new CustomEvent('workOrdersUpdated'))

    return { success: true, message: `Successfully assigned ${assignedMembers.length} team member(s).` }
  },

  /**
   * Reassign a staff member on a service
   */
  async reassignTeamMember(params: {
    workOrderId: string
    eventId: string
    serviceId: string
    oldEmployeeId: string
    newMember: { employee_id: string; employee_name: string; role_title: string }
    assignedBy?: string
  }): Promise<{ success: boolean; message: string }> {
    const { workOrderId, eventId, serviceId, oldEmployeeId, newMember, assignedBy = 'Manager' } = params

    const workOrders = getLocalWorkOrders()
    const woIndex = workOrders.findIndex((w) => w.id === workOrderId)
    if (woIndex === -1) return { success: false, message: 'Work Order not found.' }

    const wo = workOrders[woIndex]
    const event = (wo.events || []).find((e) => e.id === eventId)
    if (!event) return { success: false, message: 'Event not found.' }

    const service = (event.services || []).find((s) => s.id === serviceId)
    if (!service) return { success: false, message: 'Service not found.' }

    // Filter out old member and append new member
    const updatedTeam = (service.assigned_team || []).filter((m) => m.employee_id !== oldEmployeeId)
    updatedTeam.push({
      id: `${serviceId}:${newMember.employee_id}`,
      service_id: serviceId,
      employee_id: newMember.employee_id,
      employee_name: newMember.employee_name,
      role_title: newMember.role_title,
    })

    return this.assignTeamToService({
      workOrderId,
      eventId,
      serviceId,
      assignedMembers: updatedTeam.map((m) => ({
        employee_id: m.employee_id,
        employee_name: m.employee_name,
        role_title: m.role_title || 'Staff',
      })),
      assignedBy,
    })
  },

  /**
   * Remove assignment from a service
   */
  async removeAssignment(params: {
    workOrderId: string
    eventId: string
    serviceId: string
    employeeId: string
  }): Promise<{ success: boolean; message: string }> {
    const { workOrderId, eventId, serviceId, employeeId } = params

    const workOrders = getLocalWorkOrders()
    const woIndex = workOrders.findIndex((w) => w.id === workOrderId)
    if (woIndex === -1) return { success: false, message: 'Work Order not found.' }

    const wo = workOrders[woIndex]
    const event = (wo.events || []).find((e) => e.id === eventId)
    if (!event) return { success: false, message: 'Event not found.' }

    const service = (event.services || []).find((s) => s.id === serviceId)
    if (!service) return { success: false, message: 'Service not found.' }

    service.assigned_team = (service.assigned_team || []).filter((m) => m.employee_id !== employeeId)
    wo.updated_at = new Date().toISOString()
    saveLocalWorkOrders(workOrders)

    // Remove from Supabase
    const assignmentId = `${workOrderId}:${eventId}:${serviceId}:${employeeId}`
    if (isCloudConfigured()) {
      try {
        await supabase.from(TABLE).delete().eq('id', assignmentId)
      } catch (e) {
        console.warn('[AssignmentService] Cloud assignment delete failed:', e)
      }
    }

    window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
    return { success: true, message: 'Team member removed from assignment.' }
  },

  /**
   * Update assignment status directly (State machine transition)
   */
  async updateStatus(
    taskId: string,
    workOrderId: string,
    workOrderNumber: string,
    taskTitle: string,
    userName: string,
    newStatus: CanonicalAssignmentStatus,
    notes?: string,
    rejectionReason?: string
  ): Promise<void> {
    const stageMap: Record<CanonicalAssignmentStatus, any> = {
      pending_assignment: 'assigned',
      assigned: 'assigned',
      accepted: 'picked_up',
      declined: 'rejected',
      in_progress: 'in_progress',
      started: 'in_progress',
      completed: 'completed',
      submitted: 'ready_for_review',
      approved: 'completed',
      rejected: 'rejected',
    }

    await updateAssignmentStage({
      taskId,
      workOrderId,
      workOrderNumber,
      taskTitle,
      userName,
      newStage: stageMap[newStatus] || 'assigned',
      notes,
      rejectionReason,
    })
  },

  /**
   * Calculate Staff Availability for a target date
   */
  async getStaffAvailability(targetDate: string): Promise<StaffAvailabilityItem[]> {
    const employees = (await fetchAllEmployeesFromCloud()) || []
    const allAssignments = await loadAssignmentRecords()

    const targetFormatted = targetDate.slice(0, 10)

    const result: StaffAvailabilityItem[] = employees.map((emp) => {
      const name = emp.full_name || emp.employee_name || emp.username || ''
      const empAssignments = allAssignments.filter((a) => {
        const matchesStaff = a.assigned_to_id === emp.id || (name && a.assigned_to_name.toLowerCase() === name.toLowerCase())
        const matchesDate = a.event_date ? a.event_date.slice(0, 10) === targetFormatted : false
        const isActive = a.status !== 'rejected'
        return matchesStaff && matchesDate && isActive
      })

      const isBusy = empAssignments.length > 0

      return {
        employee: emp,
        is_available: !isBusy,
        assigned_count_today: empAssignments.length,
        assignments_today: empAssignments,
        status_label: isBusy ? 'Assigned (Busy)' : 'Available',
      }
    })

    return result
  },

  /**
   * Calculate total Staff Workload metrics across active projects
   */
  async getStaffWorkload(): Promise<StaffWorkloadSummary[]> {
    const employees = (await fetchAllEmployeesFromCloud()) || []
    const allAssignments = await loadAssignmentRecords()

    return employees.map((emp) => {
      const name = emp.full_name || emp.employee_name || emp.username || ''
      const empAssignments = allAssignments.filter(
        (a) => a.assigned_to_id === emp.id || (name && a.assigned_to_name.toLowerCase() === name.toLowerCase())
      )

      const pending_acceptances = empAssignments.filter((a) => a.status === 'assigned').length
      const active_shoots = empAssignments.filter(
        (a) => (a.task_type === 'photography' || a.task_type === 'videography') && (a.status === 'accepted' || a.status === 'started' || a.status === 'in_progress')
      ).length
      const active_editing = empAssignments.filter(
        (a) => (a.task_type === 'editing' || a.task_type === 'album_design') && (a.status === 'accepted' || a.status === 'started' || a.status === 'in_progress' || a.status === 'submitted')
      ).length
      const completed = empAssignments.filter((a) => a.status === 'completed' || a.status === 'approved').length

      return {
        employee_id: emp.id,
        employee_name: name || 'Staff Member',
        job_role: emp.job_role || (emp.job_roles && emp.job_roles[0]) || 'Staff',
        department: emp.department || 'Production',
        total_assignments: empAssignments.length,
        pending_acceptances,
        active_shoots,
        active_editing,
        completed,
      }
    })
  },
}
