import { broadcastPaymentSync } from '@/hooks/useRealtimeSync'
import { getLocalWorkOrders } from '@/services/supabase/workOrders'
import type {
  ClientRequest,
  RequestCategory,
  RequestPriority,
  RequestStatus,
  RequestMessage,
  RequestAttachment,
} from '@/types/clientRequests'
import { getTeamMembers } from '@/services/teamStore'

const STORAGE_KEY = 'trufocus_crm_client_requests_v1'

const DEFAULT_CLIENT_REQUESTS: ClientRequest[] = []

export function getClientRequests(): ClientRequest[] {
  let list: ClientRequest[] = []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) list = JSON.parse(raw)
    else list = DEFAULT_CLIENT_REQUESTS
  } catch (e) {
    console.error(e)
    list = DEFAULT_CLIENT_REQUESTS
  }

  const activeWOs = getLocalWorkOrders().filter((w) => !w.deleted_at && w.status !== 'deleted')
  const activeIds = new Set(activeWOs.map((w) => w.id))
  const activeWOnums = new Set(activeWOs.map((w) => w.work_order_number))

  return list.filter(
    (r) => activeIds.has(r.work_order_id) || activeWOnums.has(r.work_order_number)
  )
}

export function saveClientRequests(requests: ClientRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
    broadcastPaymentSync()
  } catch (e) {
    console.error(e)
  }
}

/**
 * Auto-assignment helper based on request category
 */
export function determineAutoAssignee(category: RequestCategory): { id?: string; name?: string } {
  const team = getTeamMembers()
  const cat = category.toLowerCase()

  if (cat.includes('photo')) {
    const editor = team.find((m) => m.department === 'Editing' || (m.job_roles && m.job_roles.includes('Photo Editor')))
    if (editor) return { id: editor.id, name: `${editor.full_name} (${editor.job_role})` }
  }
  if (cat.includes('video')) {
    const editor = team.find((m) => (m.job_roles && m.job_roles.includes('Video Editor')) || m.department === 'Videography')
    if (editor) return { id: editor.id, name: `${editor.full_name} (${editor.job_role})` }
  }
  if (cat.includes('payment') || cat.includes('invoice')) {
    const acc = team.find((m) => m.department === 'Accounts' || (m.job_roles && m.job_roles.includes('Accountant')))
    if (acc) return { id: acc.id, name: `${acc.full_name} (${acc.job_role})` }
  }

  // Fallback to first active team member
  if (team.length > 0) {
    return { id: team[0].id, name: `${team[0].full_name} (${team[0].job_role})` }
  }

  return {}
}

export function createClientRequest(data: {
  work_order_id: string
  work_order_number: string
  customer_name: string
  customer_mobile: string
  category: RequestCategory
  subject: string
  description: string
  priority: RequestPriority
  preferred_contact_method?: 'whatsapp' | 'phone' | 'email'
  attachments?: RequestAttachment[]
}): ClientRequest {
  const current = getClientRequests()
  const seq = current.length + 1
  const reqNumber = `REQ-2026-${String(seq).padStart(4, '0')}`
  const now = new Date().toISOString()

  const assignee = determineAutoAssignee(data.category)

  const newRequest: ClientRequest = {
    id: `req-${Date.now()}`,
    request_number: reqNumber,
    work_order_id: data.work_order_id,
    work_order_number: data.work_order_number,
    customer_id: `cust-${data.work_order_id}`,
    customer_name: data.customer_name,
    customer_mobile: data.customer_mobile,
    category: data.category,
    subject: data.subject,
    description: data.description,
    priority: data.priority,
    status: assignee.id ? 'assigned' : 'new',
    assigned_to_id: assignee.id,
    assigned_to_name: assignee.name,
    preferred_contact_method: data.preferred_contact_method || 'whatsapp',
    attachments: data.attachments || [],
    messages: [
      {
        id: `msg-${Date.now()}`,
        request_id: `req-${Date.now()}`,
        sender_type: 'customer',
        sender_name: data.customer_name,
        message_text: data.description,
        created_at: now,
      },
    ],
    history: [],
    unread_by_staff: true,
    unread_by_customer: false,
    created_at: now,
    updated_at: now,
  }

  saveClientRequests([newRequest, ...current])
  return newRequest
}

export function updateRequestStatus(
  requestId: string,
  newStatus: RequestStatus,
  changedBy = 'Studio Staff'
): void {
  const current = getClientRequests()
  const idx = current.findIndex((r) => r.id === requestId)
  if (idx === -1) return

  const req = current[idx]
  const prevStatus = req.status
  if (prevStatus === newStatus) return

  const now = new Date().toISOString()
  req.status = newStatus
  req.updated_at = now
  req.unread_by_customer = true

  req.history.push({
    id: `hist-${Date.now()}`,
    request_id: requestId,
    previous_status: prevStatus,
    new_status: newStatus,
    changed_by: changedBy,
    changed_at: now,
  })

  current[idx] = req
  saveClientRequests(current)
}

export function assignRequestEmployee(
  requestId: string,
  employeeId: string,
  employeeName: string
): void {
  const current = getClientRequests()
  const idx = current.findIndex((r) => r.id === requestId)
  if (idx === -1) return

  const req = current[idx]
  req.assigned_to_id = employeeId
  req.assigned_to_name = employeeName
  if (req.status === 'new') req.status = 'assigned'
  req.updated_at = new Date().toISOString()

  current[idx] = req
  saveClientRequests(current)
}

export function addRequestMessage(
  requestId: string,
  senderType: 'customer' | 'staff',
  senderName: string,
  messageText: string,
  senderRole?: string
): void {
  const current = getClientRequests()
  const idx = current.findIndex((r) => r.id === requestId)
  if (idx === -1) return

  const req = current[idx]
  const now = new Date().toISOString()

  const newMessage: RequestMessage = {
    id: `msg-${Date.now()}`,
    request_id: requestId,
    sender_type: senderType,
    sender_name: senderName,
    sender_role: senderRole,
    message_text: messageText,
    created_at: now,
  }

  req.messages.push(newMessage)
  req.updated_at = now

  if (senderType === 'customer') {
    req.unread_by_staff = true
  } else {
    req.unread_by_customer = true
    if (req.status === 'new' || req.status === 'assigned') {
      req.status = 'in_progress'
    }
  }

  current[idx] = req
  saveClientRequests(current)
}
