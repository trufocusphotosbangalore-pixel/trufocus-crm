export type DocumentCategory =
  | 'Contracts'
  | 'Quotations'
  | 'Invoices'
  | 'Receipts'
  | 'ID Proofs'
  | 'Reference Images'
  | 'Event Permissions'
  | 'Audio Files'
  | 'Video Files'
  | 'Design Files'
  | 'Venue References'
  | 'Inspiration Photos'
  | 'Invitation Cards'
  | 'Vendor Documents'
  | 'Special Instructions'
  | 'Miscellaneous'

export type DocumentModule =
  | 'enquiries'
  | 'work_orders'
  | 'client_portal'
  | 'team'
  | 'finances'
  | 'client_requests'
  | 'post_production'

export interface CrmDocumentRecord {
  id: string
  file_name: string
  file_size: number
  file_type: string
  extension: string
  category: DocumentCategory
  module: DocumentModule
  related_id: string
  related_number?: string
  file_url: string
  storage_path?: string
  uploaded_by: string
  uploaded_at: string
  shared_with_client: boolean
  notes?: string
}

export const ALL_DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'Contracts',
  'Quotations',
  'Invoices',
  'Receipts',
  'ID Proofs',
  'Reference Images',
  'Event Permissions',
  'Audio Files',
  'Video Files',
  'Design Files',
  'Venue References',
  'Inspiration Photos',
  'Invitation Cards',
  'Vendor Documents',
  'Special Instructions',
  'Miscellaneous',
]

export const SUPPORTED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx',
  'jpg', 'jpeg', 'png', 'webp', 'heic',
  'mp4', 'mov',
  'zip', 'rar',
  'psd', 'ai', 'cdr',
] as const
