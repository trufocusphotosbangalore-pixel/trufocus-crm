export type DeliverableStatus =
  | 'not_started'
  | 'in_progress'
  | 'ready_for_review'
  | 'client_approval'
  | 'completed'
  | 'delivered'
  // Backward compatibility alias types
  | 'pending'
  | 'assigned'
  | 'editing'
  | 'review'
  | 'for_review'
  | 'done'

export type DeliverablePriority = 'low' | 'medium' | 'high' | 'urgent'

export type ClientApprovalStatus =
  | 'not_sent'
  | 'sent_for_approval'
  | 'approved'
  | 'changes_requested'

export interface GalleryLink {
  url: string
  password?: string
  expiryDate?: string
  qrCodeUrl?: string
}

export interface DeliverableComment {
  id: string
  deliverable_id: string
  user_name: string
  role: string
  content: string
  created_at: string
}

export interface DeliverableActivityLog {
  id: string
  deliverable_id: string
  action: string
  user_name: string
  timestamp: string
}

export interface PostProductionItem {
  id: string
  work_order_id: string
  work_order_number: string
  customer_name: string
  mobile: string
  event_type: string
  deliverable_name: string
  specifications: string
  assigned_editor_name: string | null
  assigned_editor_id: string | null
  priority: DeliverablePriority
  due_date: string | null
  delivered_date?: string | null
  status: DeliverableStatus
  progress_percent: number
  approval_status: ClientApprovalStatus
  gallery?: GalleryLink
  notes?: string
  created_at: string
  updated_at: string
}

export const STATUS_LABELS: Record<string, string> = {
  not_started:      'Not Started',
  in_progress:      'In Progress',
  ready_for_review: 'Internal Review',
  client_approval:  'Client Approval',
  completed:         'Completed',
  delivered:         'Delivered',
  // Backward compatibility
  pending:          'Not Started',
  assigned:         'Not Started',
  editing:          'In Progress',
  review:           'Internal Review',
  for_review:       'Internal Review',
  done:             'Completed',
}

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  not_started:      { bg: 'bg-gray-100 border border-gray-200',      text: 'text-gray-700 font-bold',    dot: 'bg-gray-400' },
  in_progress:      { bg: 'bg-amber-50 border border-amber-200',     text: 'text-amber-700 font-bold',   dot: 'bg-amber-500' },
  ready_for_review: { bg: 'bg-yellow-50 border border-yellow-200',   text: 'text-yellow-800 font-bold',  dot: 'bg-yellow-500' },
  client_approval:  { bg: 'bg-blue-50 border border-blue-200',       text: 'text-blue-700 font-bold',    dot: 'bg-blue-500' },
  completed:        { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700 font-bold', dot: 'bg-emerald-500' },
  delivered:        { bg: 'bg-purple-50 border border-purple-200',   text: 'text-purple-700 font-bold',  dot: 'bg-purple-600' },
  // Backward compatibility
  pending:          { bg: 'bg-gray-100 border border-gray-200',      text: 'text-gray-700 font-bold',    dot: 'bg-gray-400' },
  assigned:         { bg: 'bg-gray-100 border border-gray-200',      text: 'text-gray-700 font-bold',    dot: 'bg-gray-400' },
  editing:          { bg: 'bg-amber-50 border border-amber-200',     text: 'text-amber-700 font-bold',   dot: 'bg-amber-500' },
  review:           { bg: 'bg-yellow-50 border border-yellow-200',   text: 'text-yellow-800 font-bold',  dot: 'bg-yellow-500' },
  for_review:       { bg: 'bg-yellow-50 border border-yellow-200',   text: 'text-yellow-800 font-bold',  dot: 'bg-yellow-500' },
  done:             { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700 font-bold', dot: 'bg-emerald-500' },
}

export const PRIORITY_COLORS: Record<DeliverablePriority, { bg: string; text: string }> = {
  low:    { bg: 'bg-gray-100 text-gray-700',     text: 'Low' },
  medium: { bg: 'bg-blue-50 text-blue-700',     text: 'Medium' },
  high:   { bg: 'bg-amber-50 text-amber-700',   text: 'High' },
  urgent: { bg: 'bg-red-50 text-red-700 border border-red-200', text: 'Urgent' },
}

export const TEAM_MEMBERS = [
  'Amit Patel',
  'Priya Verma',
  'Suresh Menon',
  'Anish Kumar',
  'Mahesh Babu',
  'Ram Sharma',
  'Ravi Kumar',
  'Neha Singh',
  'Vikram Sethi',
]
