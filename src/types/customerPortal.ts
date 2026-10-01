export interface PortalModuleSettings {
  show_dashboard: boolean
  show_payments: boolean
  show_contract: boolean
  show_schedule: boolean
  show_moodboard: boolean
  show_gallery: boolean
  show_deliverables: boolean
  show_documents: boolean
  show_support: boolean
  enable_online_payments: boolean
}

export const DEFAULT_PORTAL_SETTINGS: PortalModuleSettings = {
  show_dashboard: true,
  show_payments: true,
  show_contract: true,
  show_schedule: true,
  show_moodboard: true,
  show_gallery: true,
  show_deliverables: true,
  show_documents: true,
  show_support: true,
  enable_online_payments: true,
}

export type TimelineStageId =
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

export interface TimelineStage {
  id: TimelineStageId
  label: string
  completed: boolean
  current: boolean
  date?: string
}

export const PORTAL_TIMELINE_STAGES: { id: TimelineStageId; label: string }[] = [
  { id: 'enquiry', label: 'Enquiry' },
  { id: 'quotation', label: 'Quotation' },
  { id: 'approved', label: 'Approved' },
  { id: 'advance_paid', label: 'Advance Paid' },
  { id: 'work_order', label: 'Work Order Created' },
  { id: 'shoot_completed', label: 'Shoot Completed' },
  { id: 'editing', label: 'Editing' },
  { id: 'album_design', label: 'Album Design' },
  { id: 'customer_approval', label: 'Customer Approval' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'completed', label: 'Completed' },
]

export interface PortalMoodboardItem {
  id: string
  portal_id: string
  type: 'image' | 'link' | 'note'
  url?: string
  notes?: string
  created_at: string
}

export interface PortalDocumentItem {
  id: string
  title: string
  category: 'quotation' | 'invoice' | 'agreement' | 'receipt' | 'album_proof'
  download_url: string
  file_size?: string
  date: string
}

export interface CustomerPortalData {
  id: string
  work_order_id: string
  work_order_number: string
  project_name: string
  customer_name: string
  mobile: string
  email?: string
  pin_code: string // 4 digit PIN e.g. "4827"
  share_link: string
  qr_code_url: string
  is_active: boolean
  is_expired: boolean
  settings: PortalModuleSettings
  created_at: string
}
