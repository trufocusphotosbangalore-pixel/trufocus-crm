import { addNotification } from '@/services/notificationService'
import { getLocalWorkOrders } from '@/services/supabase/workOrders'
import { supabase } from '@/services/supabase/client'
import { broadcastCloudSync, isCloudConfigured } from '@/services/cloudSyncService'
import type {
  AssignmentActivityLog,
  AssignmentStage,
  PersonalEditingTask,
  PersonalShootTask,
  TaskCategory,
} from '@/types/personalQueue'

export type CanonicalAssignmentStatus =
  | 'pending_assignment'
  | 'assigned'
  | 'accepted'
  | 'declined'
  | 'started'
  | 'in_progress'
  | 'completed'
  | 'submitted'
  | 'approved'
  | 'rejected'

export interface AssignmentRecord {
  id: string
  work_order_id: string
  work_order_number: string
  customer_name: string
  customer_mobile: string
  event_id: string
  event_type: string
  event_date: string
  event_time: string
  venue: string
  google_map_link?: string
  service_id: string
  service_name: string
  role_title: string
  task_type: TaskCategory
  assigned_to_id: string
  assigned_to_name: string
  assigned_by: string
  assigned_at: string
  accepted_at?: string
  started_at?: string
  completed_at?: string
  submitted_at?: string
  approved_at?: string
  status: CanonicalAssignmentStatus
  completion_notes?: string
  rejection_reason?: string
  memory_card_status?: 'pending' | 'submitted' | 'na'
  created_at?: string
  updated_at?: string
}

import { saveLocalWorkOrders } from '@/services/supabase/workOrders'

const TABLE = 'team_assignments'
const ASSIGNMENTS_STORAGE_KEY = 'trufocus_crm_team_assignments_v1'
let memoryAssignments: AssignmentRecord[] = []

function loadAssignmentsFromLocalStorage(): AssignmentRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error loading local team assignments:', e)
  }
  return []
}

function saveAssignmentsToLocalStorage(records: AssignmentRecord[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(records))
  } catch (e) {
    console.error('Error saving local team assignments:', e)
  }
}

function broadcastAssignmentsUpdatedEvent(): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('trufocus_assignments_updated'))
      window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
    } catch (e) {
      console.error('Error broadcasting assignment update event:', e)
    }
  }
}

function syncAssignmentToWorkOrders(rec: AssignmentRecord): void {
  try {
    const workOrders = getLocalWorkOrders()
    let updated = false

    workOrders.forEach((wo, woIndex) => {
      if (rec.work_order_id && wo.id !== rec.work_order_id && wo.work_order_number !== rec.work_order_number) {
        return
      }

      let allShootServicesCompleted = true
      let hasAnyServices = false

      wo.events?.forEach((event) => {
        if (rec.event_id && event.id !== rec.event_id) return
        event.services?.forEach((service) => {
          if (rec.service_id && service.id !== rec.service_id) return
          service.assigned_team?.forEach((member) => {
            if (member.employee_id === rec.assigned_to_id || member.id?.includes(rec.assigned_to_id)) {
              (member as any).assignment_status = rec.status
              ;(member as any).accepted_at = rec.accepted_at
              ;(member as any).rejection_reason = rec.rejection_reason
              updated = true
            }
          })
        })
      })

      // Evaluate whether all events and services for this work order have completed shoot
      wo.events?.forEach((event) => {
        event.services?.forEach((service) => {
          hasAnyServices = true
          const team = service.assigned_team || []
          const serviceCompleted = team.length > 0 && team.every((m: any) => {
            const st = (m.assignment_status || m.status || '').toLowerCase()
            return st === 'completed' || st === 'submitted' || st === 'approved'
          })
          if (!serviceCompleted) {
            allShootServicesCompleted = false
          }
        })
      })

      if (hasAnyServices && allShootServicesCompleted) {
        wo.production_completed = true
        wo.production_completed_at = new Date().toISOString()
        wo.production_completed_by = rec.assigned_to_name || 'Crew Member'
        updated = true
      }

      if (updated) {
        workOrders[woIndex] = { ...wo, updated_at: new Date().toISOString() }
      }
    })

    if (updated) {
      saveLocalWorkOrders(workOrders)
    }
  } catch (e) {
    console.error('Error syncing assignment to Work Orders:', e)
  }
}

function normalize(value?: string | null): string {
  return (value || '').toLowerCase().trim()
}

function toTaskCategory(roleTitle: string, serviceName: string): TaskCategory {
  const role = normalize(roleTitle)
  const service = normalize(serviceName)

  if (role.includes('video') && !role.includes('editor')) return 'videography'
  if (role.includes('photo') && !role.includes('editor')) return 'photography'
  if (role.includes('album')) return 'album_design'
  if (role.includes('video editor') || service.includes('video')) return 'editing'
  if (role.includes('photo editor') || service.includes('photo')) return 'editing'

  return 'photography'
}

function buildAssignmentId(workOrderId: string, eventId: string, serviceId: string, employeeId: string): string {
  return `${workOrderId}:${eventId}:${serviceId}:${employeeId}`
}

function canonicalToStage(status: CanonicalAssignmentStatus): AssignmentStage {
  switch (status) {
    case 'accepted':
      return 'picked_up'
    case 'started':
      return 'in_progress'
    case 'submitted':
      return 'ready_for_review'
    case 'completed':
    case 'approved':
      return 'completed'
    case 'rejected':
      return 'rejected'
    default:
      return 'assigned'
  }
}

function stageToCanonical(stage: AssignmentStage): CanonicalAssignmentStatus {
  switch (stage) {
    case 'picked_up':
      return 'accepted'
    case 'in_progress':
      return 'started'
    case 'ready_for_review':
      return 'submitted'
    case 'completed':
      return 'completed'
    case 'rejected':
      return 'rejected'
    default:
      return 'assigned'
  }
}

function deriveAssignmentsFromWorkOrders(): AssignmentRecord[] {
  const now = new Date().toISOString()
  const workOrders = getLocalWorkOrders().filter((w) => !w.deleted_at && w.status !== 'deleted')
  const derived: AssignmentRecord[] = []

  workOrders.forEach((wo) => {
    wo.events?.forEach((event) => {
      event.services?.forEach((service) => {
        const team = service.assigned_team || []
        team.forEach((member) => {
          const id = buildAssignmentId(wo.id, event.id, service.id, member.employee_id)
          const taskType = toTaskCategory(member.role_title || '', service.service_name || '')

          derived.push({
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
            role_title: member.role_title || 'Crew Member',
            task_type: taskType,
            assigned_to_id: member.employee_id,
            assigned_to_name: member.employee_name,
            assigned_by: 'Manager',
            assigned_at: wo.created_at,
            status: 'assigned',
            created_at: now,
            updated_at: now,
          })
        })
      })
    })
  })

  return derived
}

function mergeAssignmentState(derived: AssignmentRecord[], existing: AssignmentRecord[]): AssignmentRecord[] {
  const existingById = new Map(existing.map((r) => [r.id, r]))
  return derived.map((d) => {
    const current = existingById.get(d.id)
    if (!current) return d
    return {
      ...d,
      assigned_by: current.assigned_by || d.assigned_by,
      assigned_at: current.assigned_at || d.assigned_at,
      status: current.status || d.status,
      accepted_at: current.accepted_at,
      started_at: current.started_at,
      completed_at: current.completed_at,
      submitted_at: current.submitted_at,
      approved_at: current.approved_at,
      completion_notes: current.completion_notes,
      rejection_reason: current.rejection_reason,
      memory_card_status: current.memory_card_status,
      created_at: current.created_at || d.created_at,
      updated_at: current.updated_at || d.updated_at,
    }
  })
}

function identityMatches(record: AssignmentRecord, userName: string, userEmailOrEmpId: string): boolean {
  const idQ = normalize(userName)
  const emailQ = normalize(userEmailOrEmpId)
  const recName = normalize(record.assigned_to_name)
  const recId = normalize(record.assigned_to_id)

  return Boolean(
    (idQ && (recName === idQ || recName.includes(idQ) || idQ.includes(recName))) ||
    (emailQ && (recId === emailQ || recId.includes(emailQ) || emailQ.includes(recId)))
  )
}

async function readCloudAssignments(): Promise<AssignmentRecord[] | null> {
  if (!isCloudConfigured()) return null
  try {
    const { data, error } = await supabase.from(TABLE).select('*').order('updated_at', { ascending: false })
    if (error) {
      console.warn('[AssignmentEngine] Could not read cloud assignments:', error.message)
      return null
    }
    return (data || []) as AssignmentRecord[]
  } catch (e) {
    console.warn('[AssignmentEngine] Cloud read failed:', e)
    return null
  }
}

async function upsertCloudAssignments(records: AssignmentRecord[]): Promise<boolean> {
  if (!isCloudConfigured()) return false
  if (records.length === 0) return true
  try {
    const payload = records.map((r) => ({ ...r, updated_at: new Date().toISOString() }))
    const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: 'id' })
    if (error) {
      console.warn('[AssignmentEngine] Could not upsert cloud assignments:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.warn('[AssignmentEngine] Cloud upsert failed:', e)
    return false
  }
}

export async function loadAssignmentRecords(): Promise<AssignmentRecord[]> {
  const derived = deriveAssignmentsFromWorkOrders()
  const localSaved = loadAssignmentsFromLocalStorage()
  const cloud = await readCloudAssignments()

  const existingToMerge = [...(cloud || []), ...localSaved, ...memoryAssignments]
  const merged = mergeAssignmentState(derived, existingToMerge)

  const derivedIds = new Set(derived.map((d) => d.id))
  for (const item of existingToMerge) {
    if (!derivedIds.has(item.id) && !merged.some((m) => m.id === item.id)) {
      merged.push(item)
    }
  }

  memoryAssignments = merged
  saveAssignmentsToLocalStorage(merged)

  if (cloud) {
    const cloudIds = new Set(cloud.map((r) => r.id))
    const missing = merged.filter((r) => !cloudIds.has(r.id))
    if (missing.length > 0) {
      await upsertCloudAssignments(missing)
    }
  }

  return merged
}

export async function getAssignmentsForEmployee(
  employeeId: string,
  userAccount?: { id?: string; employee_id?: string; employee_name?: string; full_name?: string; username?: string }
): Promise<AssignmentRecord[]> {
  const records = await loadAssignmentRecords()
  const empIdNorm = normalize(employeeId)
  const userAccountEmpId = normalize(userAccount?.employee_id)
  const userAccountId = normalize(userAccount?.id)
  const nameNorm = normalize(userAccount?.employee_name || userAccount?.full_name || userAccount?.username)

  return records.filter((r) => {
    const assignedId = normalize(r.assigned_to_id)
    const assignedName = normalize(r.assigned_to_name)

    if (assignedId && (assignedId === empIdNorm || assignedId === userAccountEmpId || assignedId === userAccountId)) {
      return true
    }
    if (nameNorm && (assignedName === nameNorm || assignedName.includes(nameNorm) || nameNorm.includes(assignedName))) {
      return true
    }
    return false
  })
}

export async function getAssignmentActivityLogs(): Promise<AssignmentActivityLog[]> {
  const records = await loadAssignmentRecords()
  return records
    .map((r) => ({
      id: r.id,
      work_order_id: r.work_order_id,
      work_order_number: r.work_order_number,
      customer_name: r.customer_name,
      customer_mobile: r.customer_mobile,
      task_type: r.task_type,
      title: `${r.service_name} (${r.event_type})`,
      event_date: r.event_date,
      event_time: r.event_time,
      venue: r.venue,
      google_map_link: r.google_map_link,
      assigned_to_id: r.assigned_to_id,
      assigned_to_name: r.assigned_to_name,
      assigned_by: r.assigned_by,
      assigned_at: r.assigned_at,
      accepted_at: r.accepted_at,
      started_at: r.started_at,
      completed_at: r.completed_at,
      current_stage: canonicalToStage(r.status),
      completion_notes: r.completion_notes,
      rejection_reason: r.rejection_reason,
      memory_card_status: r.memory_card_status,
    }))
    .sort((a, b) => {
      const at = new Date(a.completed_at || a.started_at || a.accepted_at || a.assigned_at).getTime()
      const bt = new Date(b.completed_at || b.started_at || b.accepted_at || b.assigned_at).getTime()
      return bt - at
    })
}

export async function getPersonalShootTasks(
  userName: string,
  userEmailOrEmpId: string,
  role: string
): Promise<PersonalShootTask[]> {
  const records = await loadAssignmentRecords()
  const roleNorm = normalize(role)

  const shoots = records.filter((r) => {
    if (!identityMatches(r, userName, userEmailOrEmpId)) return false
    if (roleNorm === 'photographer') return r.task_type === 'photography'
    if (roleNorm === 'videographer') return r.task_type === 'videography'
    return false
  })

  return shoots.map((r) => ({
    id: r.id,
    work_order_id: r.work_order_id,
    work_order_number: r.work_order_number,
    customer_name: r.customer_name,
    customer_mobile: r.customer_mobile,
    event_type: r.event_type,
    event_date: r.event_date,
    event_time: r.event_time,
    venue: r.venue,
    google_map_link: r.google_map_link,
    assigned_service_id: r.service_id,
    service_name: r.service_name,
    role_title: r.role_title,
    stage: canonicalToStage(r.status),
    assigned_team_members: [{ id: r.assigned_to_id, name: r.assigned_to_name, role: r.role_title }],
    accepted_at: r.accepted_at,
    started_at: r.started_at,
    completed_at: r.completed_at,
    completion_notes: r.completion_notes,
    rejection_reason: r.rejection_reason,
    memory_card_submitted: r.memory_card_status === 'submitted',
  }))
}

export async function getPersonalEditingTasks(
  userName: string,
  userEmailOrEmpId: string,
  roleCategory: 'photo' | 'video' | 'album'
): Promise<PersonalEditingTask[]> {
  const records = await loadAssignmentRecords()

  const filtered = records.filter((r) => {
    if (!identityMatches(r, userName, userEmailOrEmpId)) return false
    const role = normalize(r.role_title)

    if (roleCategory === 'photo') {
      return role.includes('photo editor') || (r.task_type === 'editing' && normalize(r.service_name).includes('photo'))
    }
    if (roleCategory === 'video') {
      return role.includes('video editor') || (r.task_type === 'editing' && normalize(r.service_name).includes('video'))
    }
    return role.includes('album') || r.task_type === 'album_design'
  })

  return filtered.map((r) => ({
    id: r.id,
    work_order_id: r.work_order_id,
    work_order_number: r.work_order_number,
    customer_name: r.customer_name,
    deliverable_name: `${r.service_name} (${r.event_type})`,
    category: roleCategory === 'photo' ? 'photo_editing' : roleCategory === 'video' ? 'video_editing' : 'album_design',
    due_date: r.event_date || 'TBD',
    priority: 'medium',
    stage: canonicalToStage(r.status),
    assigned_to_id: r.assigned_to_id,
    assigned_to_name: r.assigned_to_name,
    assigned_by: r.assigned_by,
    assigned_at: r.assigned_at,
    accepted_at: r.accepted_at,
    started_at: r.started_at,
    completed_at: r.completed_at,
    progress_percent:
      r.status === 'approved' || r.status === 'completed'
        ? 100
        : r.status === 'submitted'
        ? 85
        : r.status === 'started'
        ? 50
        : r.status === 'accepted'
        ? 20
        : 0,
    notes: r.completion_notes,
  }))
}

export async function updateAssignmentStage(params: {
  taskId: string
  workOrderId: string
  workOrderNumber: string
  taskTitle: string
  userName: string
  newStage: AssignmentStage
  notes?: string
  rejectionReason?: string
}): Promise<void> {
  const { taskId, workOrderId, workOrderNumber, taskTitle, userName, newStage, notes, rejectionReason } = params
  const records = await loadAssignmentRecords()
  const now = new Date().toISOString()

  const idx = records.findIndex((r) => r.id === taskId)
  const nextStatus = stageToCanonical(newStage)

  const base: AssignmentRecord = idx >= 0
    ? { ...records[idx] }
    : {
        id: taskId,
        work_order_id: workOrderId,
        work_order_number: workOrderNumber,
        customer_name: '',
        customer_mobile: '',
        event_id: '',
        event_type: 'Event',
        event_date: '',
        event_time: '',
        venue: '',
        service_id: '',
        service_name: taskTitle,
        role_title: 'Crew Member',
        task_type: 'photography',
        assigned_to_id: userName,
        assigned_to_name: userName,
        assigned_by: 'Manager',
        assigned_at: now,
        status: 'assigned',
        created_at: now,
        updated_at: now,
      }

  base.status = nextStatus
  base.updated_at = now

  if (nextStatus === 'accepted') base.accepted_at = now
  if (nextStatus === 'started') base.started_at = now
  if (nextStatus === 'submitted') base.submitted_at = now
  if (nextStatus === 'completed' || nextStatus === 'approved') base.completed_at = now

  if (notes) {
    base.completion_notes = notes
    if (nextStatus === 'completed') {
      base.memory_card_status = notes.includes('[Memory Card Handed Over]') ? 'submitted' : 'pending'
    }
  }

  if (rejectionReason) {
    base.rejection_reason = rejectionReason
  }

  if (idx >= 0) {
    records[idx] = base
  } else {
    records.unshift(base)
  }

  memoryAssignments = records
  await upsertCloudAssignments([base])
  broadcastCloudSync(TABLE, base)

  if (newStage === 'picked_up') {
    addNotification({
      title: 'Assignment Picked Up / Accepted',
      message: `${userName} accepted ${taskTitle} for ${workOrderNumber}`,
      type: 'acceptance',
      target_role: 'manager',
      work_order_number: workOrderNumber,
    })
  } else if (newStage === 'rejected') {
    addNotification({
      title: 'Assignment Rejected',
      message: `${userName} rejected ${taskTitle} for ${workOrderNumber}. Reason: ${rejectionReason || 'N/A'}`,
      type: 'status_change',
      target_role: 'manager',
      work_order_number: workOrderNumber,
    })
  } else if (newStage === 'in_progress') {
    addNotification({
      title: 'Work Started',
      message: `${userName} started ${taskTitle} for ${workOrderNumber}`,
      type: 'status_change',
      target_role: 'manager',
      work_order_number: workOrderNumber,
    })
  } else if (newStage === 'ready_for_review') {
    addNotification({
      title: 'Ready for Review / QC',
      message: `${userName} submitted ${taskTitle} for ${workOrderNumber} for QC Review`,
      type: 'status_change',
      target_role: 'manager',
      work_order_number: workOrderNumber,
    })
  } else if (newStage === 'completed') {
    addNotification({
      title: 'Task Completed',
      message: `${userName} completed ${taskTitle} for ${workOrderNumber}`,
      type: 'completion',
      target_role: 'manager',
      work_order_number: workOrderNumber,
    })
  }
}

export async function acceptAssignment(assignmentId: string, userName: string): Promise<void> {
  const records = await loadAssignmentRecords()
  const rec = records.find((r) => r.id === assignmentId || r.id.includes(assignmentId) || assignmentId.includes(r.id))
  if (!rec) {
    console.warn('[acceptAssignment] Record not found:', assignmentId)
    return
  }

  const now = new Date().toISOString()
  rec.status = 'accepted'
  rec.accepted_at = now
  rec.updated_at = now

  memoryAssignments = records
  saveAssignmentsToLocalStorage(records)
  syncAssignmentToWorkOrders(rec)

  await upsertCloudAssignments([rec])
  broadcastCloudSync(TABLE, rec)
  broadcastAssignmentsUpdatedEvent()

  addNotification({
    title: 'Assignment Accepted',
    message: `${userName} accepted ${rec.role_title} for ${rec.work_order_number} (${rec.customer_name})`,
    type: 'acceptance',
    target_role: 'manager',
    work_order_number: rec.work_order_number,
  })
}

export async function declineAssignment(assignmentId: string, userName: string, reason: string, notes?: string): Promise<void> {
  const records = await loadAssignmentRecords()
  const rec = records.find((r) => r.id === assignmentId || r.id.includes(assignmentId) || assignmentId.includes(r.id))
  if (!rec) {
    console.warn('[declineAssignment] Record not found:', assignmentId)
    return
  }

  const now = new Date().toISOString()
  rec.status = 'declined'
  rec.rejection_reason = notes ? `${reason} - ${notes}` : reason
  rec.updated_at = now

  memoryAssignments = records
  saveAssignmentsToLocalStorage(records)
  syncAssignmentToWorkOrders(rec)

  await upsertCloudAssignments([rec])
  broadcastCloudSync(TABLE, rec)
  broadcastAssignmentsUpdatedEvent()

  addNotification({
    title: '🚨 Assignment Declined by Crew Member',
    message: `${userName} DECLINED ${rec.role_title} for ${rec.work_order_number} (${rec.customer_name}). Reason: ${reason}`,
    type: 'status_change',
    target_role: 'manager',
    work_order_number: rec.work_order_number,
  })
}

export async function completeShootAssignment(
  assignmentId: string,
  userName: string,
  dataCollection: { memoryCardReturned: boolean; remarks?: string }
): Promise<void> {
  const records = await loadAssignmentRecords()
  const rec = records.find((r) => r.id === assignmentId || r.id.includes(assignmentId) || assignmentId.includes(r.id))
  if (!rec) {
    console.warn('[completeShootAssignment] Record not found:', assignmentId)
    return
  }

  const now = new Date().toISOString()
  rec.status = 'completed'
  rec.completed_at = now
  rec.memory_card_status = dataCollection.memoryCardReturned ? 'submitted' : 'pending'
  if (dataCollection.remarks) {
    rec.completion_notes = dataCollection.remarks
  }
  rec.updated_at = now

  memoryAssignments = records
  saveAssignmentsToLocalStorage(records)
  syncAssignmentToWorkOrders(rec)

  await upsertCloudAssignments([rec])
  broadcastCloudSync(TABLE, rec)
  broadcastAssignmentsUpdatedEvent()

  addNotification({
    title: 'Shoot Completed',
    message: `${userName} marked Shoot Completed for ${rec.work_order_number} (${rec.customer_name}). Memory Cards: ${dataCollection.memoryCardReturned ? 'Returned' : 'Pending'}.`,
    type: 'completion',
    target_role: 'manager',
    work_order_number: rec.work_order_number,
  })
}