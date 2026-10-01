import type { BaseEntity } from './common'

export type QuotationStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'change_requested'
  | 'accepted'
  | 'rejected'
  | 'expired'

export type DiscountType = 'fixed' | 'percentage'

export interface QuotationServiceItem {
  id: string
  service_id: string
  service_name: string
  description?: string
  quantity: number
  start_time?: string
  end_time?: string
  remarks?: string
  included: boolean
}

export interface QuotationEventItem {
  id: string
  event_type_name: string
  event_date: string
  event_time?: string
  venue?: string
  google_map_link?: string
  notes?: string
  services: QuotationServiceItem[]
}

export interface QuotationDeliverableItem {
  id: string
  name: string
  notes?: string
  is_included: boolean
}

export interface QuotationPaymentTerm {
  id?: string
  installment: string
  percentage?: number
  amount: number
  due_description?: string
}

export interface QuotationTimelineEvent {
  id: string
  timestamp: string
  action: 'created' | 'sent' | 'viewed' | 'change_requested' | 'accepted' | 'rejected' | 'work_order_created'
  actor: 'admin' | 'customer' | 'system'
  actor_name?: string
  notes?: string
}

export interface Quotation extends BaseEntity {
  quotation_number: string // e.g. QTN-2026-001
  enquiry_id?: string | null
  enquiry_number?: string | null
  customer_name: string
  mobile: string
  whatsapp_number?: string | null
  email?: string | null
  event_type: string // Main event label e.g. "Wedding & Reception"
  valid_until?: string | null
  status: QuotationStatus
  
  // Commercial Package-Based Pricing Fields
  package_amount: number
  discount_type: DiscountType
  discount_value: number
  discount_amount: number
  final_amount: number // package_amount - discount_amount

  // Internal breakdown for events & deliverables
  events: QuotationEventItem[]
  deliverables: QuotationDeliverableItem[]
  
  payment_terms?: QuotationPaymentTerm[]
  terms_conditions?: string
  notes?: string | null
  
  // Link to Work Order once accepted
  converted_to_work_order?: boolean
  work_order_id?: string | null
  work_order_number?: string | null
  
  sent_at?: string | null
  viewed_at?: string | null
  change_requested_at?: string | null
  accepted_at?: string | null
  rejected_at?: string | null
  decline_reason?: string | null
  change_requested_notes?: string | null

  // Timeline activity audit trail
  timeline?: QuotationTimelineEvent[]
}

export interface QuotationFormData {
  enquiry_id?: string
  enquiry_number?: string
  customer_name: string
  mobile: string
  whatsapp_number: string
  email: string
  event_type: string
  valid_until: string
  status: QuotationStatus
  package_amount: number | string
  discount_type: DiscountType
  discount_value: number | string
  discount_amount: number | string
  final_amount: number | string
  events: QuotationEventItem[]
  deliverables: QuotationDeliverableItem[]
  payment_terms: QuotationPaymentTerm[]
  terms_conditions: string
  notes: string
}

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: 'Draft',
  sent: 'Quotation Sent',
  viewed: 'Viewed by Client',
  change_requested: 'Changes Requested',
  accepted: 'Quotation Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
}

export const QUOTATION_STATUS_COLORS: Record<QuotationStatus, { bg: string; text: string; dot: string }> = {
  draft:            { bg: 'bg-gray-100 border border-gray-200',    text: 'text-gray-700',    dot: 'bg-gray-400' },
  sent:             { bg: 'bg-blue-50 border border-blue-200',      text: 'text-blue-700',    dot: 'bg-blue-500' },
  viewed:           { bg: 'bg-purple-50 border border-purple-200',  text: 'text-purple-700',  dot: 'bg-purple-500' },
  change_requested: { bg: 'bg-amber-50 border border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  accepted:         { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected:         { bg: 'bg-rose-50 border border-rose-200',      text: 'text-rose-700',    dot: 'bg-rose-500' },
  expired:          { bg: 'bg-red-50 border border-red-200',        text: 'text-red-700',     dot: 'bg-red-500' },
}
