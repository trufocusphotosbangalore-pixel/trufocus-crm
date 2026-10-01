export type RequestCategory =
  | 'Photo Editing Request'
  | 'Video Editing Request'
  | 'Album Design Changes'
  | 'Photo Selection'
  | 'Gallery Issue'
  | 'Download Issue'
  | 'Payment Query'
  | 'Invoice Request'
  | 'Contract Query'
  | 'Event Schedule Change'
  | 'Additional Deliverables'
  | 'Suggestion'
  | 'Complaint'
  | 'General Question'
  | 'Photo Request'
  | 'Video Request'
  | 'Album Design'
  | 'Photo Editing'
  | 'Video Editing'
  | 'Event Schedule'
  | 'Other'

export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent'

export type RequestStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'waiting_for_customer'
  | 'resolved'
  | 'closed'

export interface RequestAttachment {
  id: string
  file_name: string
  file_size_mb: number
  file_url: string
  uploaded_at: string
}

export interface RequestMessage {
  id: string
  request_id: string
  sender_type: 'customer' | 'staff'
  sender_name: string
  sender_role?: string
  message_text: string
  attachments?: RequestAttachment[]
  created_at: string
}

export interface RequestStatusHistory {
  id: string
  request_id: string
  previous_status: RequestStatus
  new_status: RequestStatus
  changed_by: string
  changed_at: string
}

export interface ClientRequest {
  id: string
  request_number: string // e.g. REQ-2026-0001
  work_order_id: string
  work_order_number: string
  customer_id: string
  customer_name: string
  customer_mobile: string
  category: RequestCategory
  subject: string
  description: string
  priority: RequestPriority
  status: RequestStatus
  assigned_to_id?: string
  assigned_to_name?: string
  preferred_contact_method: 'whatsapp' | 'phone' | 'email'
  attachments: RequestAttachment[]
  messages: RequestMessage[]
  history: RequestStatusHistory[]
  unread_by_staff: boolean
  unread_by_customer: boolean
  created_at: string
  updated_at: string
}

export const REQUEST_CATEGORY_LIST: RequestCategory[] = [
  'Photo Editing Request',
  'Video Editing Request',
  'Album Design Changes',
  'Photo Selection',
  'Gallery Issue',
  'Download Issue',
  'Payment Query',
  'Invoice Request',
  'Contract Query',
  'Event Schedule Change',
  'Additional Deliverables',
  'Suggestion',
  'Complaint',
  'General Question',
  'Other',
]

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'New',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  waiting_for_customer: 'Waiting for Customer',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const REQUEST_STATUS_COLORS: Record<RequestStatus, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-50 border border-blue-200', text: 'text-blue-700' },
  assigned: { bg: 'bg-[#5B3FD9]/10 border border-[#5B3FD9]/20', text: 'text-[#5B3FD9]' },
  in_progress: { bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-700' },
  waiting_for_customer: { bg: 'bg-purple-50 border border-purple-200', text: 'text-purple-700' },
  resolved: { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700' },
  closed: { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-600' },
}

export const REQUEST_PRIORITY_COLORS: Record<RequestPriority, { bg: string; text: string }> = {
  low: { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-600' },
  medium: { bg: 'bg-blue-50 border border-blue-200', text: 'text-blue-700' },
  high: { bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-700' },
  urgent: { bg: 'bg-rose-50 border border-rose-200', text: 'text-rose-700' },
}
