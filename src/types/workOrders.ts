import type { BaseEntity } from './common'
import type { EventType, EnquirySource } from './enquiries'

export type { EventType, EnquirySource }

// ─── Enums ────────────────────────────────────────────────────────────────────

export type WorkOrderStatus =
  | 'upcoming' | 'todays_shoot' | 'ongoing' | 'in_progress' | 'editing'
  | 'album_design' | 'ready_for_delivery' | 'completed' | 'delivered' | 'cancelled' | 'deleted' | 'archived'

export type PaymentStatus =
  | 'pending' | 'advance_received' | 'partially_paid' | 'fully_paid' | 'refunded'

export type ContractStatus = 'pending' | 'accepted' | 'signed' | 'expired'

export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'card' | 'other'

// ─── Label Maps ───────────────────────────────────────────────────────────────

export const WO_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  upcoming:           'Upcoming',
  todays_shoot:       "Today's Shoot",
  ongoing:            'Ongoing',
  in_progress:        'In Progress',
  editing:            'Editing',
  album_design:       'Album Design',
  ready_for_delivery: 'Ready for Delivery',
  completed:          'Completed',
  delivered:          'Delivered',
  cancelled:          'Cancelled',
  deleted:            'Deleted (Trash)',
  archived:           'Archived',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending:          'Pending',
  advance_received: 'Advance Received',
  partially_paid:   'Partially Paid',
  fully_paid:       'Fully Paid',
  refunded:         'Refunded',
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  pending:  'Pending',
  accepted: 'Accepted',
  signed:   'Signed',
  expired:  'Expired',
}

export const PAYMENT_MODE_LABELS: Record<string, string> = {
  cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer',
  cheque: 'Cheque', card: 'Card', other: 'Other',
}

// ─── Status Colors ────────────────────────────────────────────────────────────

export const WO_STATUS_COLORS: Record<WorkOrderStatus, { bg: string; text: string; dot: string }> = {
  upcoming:           { bg: 'bg-amber-50 border border-amber-200',    text: 'text-amber-800',     dot: 'bg-amber-500' },
  todays_shoot:       { bg: 'bg-sky-50 border border-sky-200',        text: 'text-sky-700',       dot: 'bg-sky-500' },
  ongoing:            { bg: 'bg-emerald-50 border border-emerald-200',text: 'text-emerald-700',  dot: 'bg-emerald-500' },
  in_progress:        { bg: 'bg-emerald-50 border border-emerald-200',text: 'text-emerald-700',  dot: 'bg-emerald-500' },
  editing:            { bg: 'bg-purple-50 border border-purple-200',  text: 'text-purple-700',    dot: 'bg-purple-500' },
  album_design:       { bg: 'bg-indigo-50 border border-indigo-200',  text: 'text-indigo-700',    dot: 'bg-indigo-500' },
  ready_for_delivery: { bg: 'bg-cyan-50 border border-cyan-200',      text: 'text-cyan-700',      dot: 'bg-cyan-500' },
  completed:          { bg: 'bg-emerald-100 border border-emerald-300', text: 'text-emerald-900',  dot: 'bg-emerald-600' },
  delivered:          { bg: 'bg-emerald-100 border border-emerald-300', text: 'text-emerald-900',  dot: 'bg-emerald-600' },
  cancelled:          { bg: 'bg-rose-50 border border-rose-200',      text: 'text-rose-700',      dot: 'bg-rose-500' },
  deleted:            { bg: 'bg-gray-100 border border-gray-200',    text: 'text-gray-500',      dot: 'bg-gray-400' },
  archived:           { bg: 'bg-slate-100 border border-slate-300',  text: 'text-slate-700',     dot: 'bg-slate-500' },
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string }> = {
  pending:          { bg: 'bg-amber-50 border border-amber-200',  text: 'text-amber-700' },
  advance_received: { bg: 'bg-blue-50 border border-blue-200',    text: 'text-blue-700' },
  partially_paid:   { bg: 'bg-indigo-50 border border-indigo-200',text: 'text-indigo-700' },
  fully_paid:       { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700' },
  refunded:         { bg: 'bg-red-50 border border-red-200',      text: 'text-red-700' },
}

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, { bg: string; text: string }> = {
  pending:  { bg: 'bg-gray-100 border border-gray-200',    text: 'text-gray-600' },
  accepted: { bg: 'bg-blue-50 border border-blue-200',    text: 'text-blue-700' },
  signed:   { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700' },
  expired:  { bg: 'bg-red-50 border border-red-200',      text: 'text-red-700' },
}

// ─── Event & Service Entities ─────────────────────────────────────────────────

export interface WorkOrderTeamAssignment {
  id: string
  service_id: string
  employee_id: string
  employee_name: string
  role_title?: string
  notes?: string
}

export interface WorkOrderService {
  id: string
  event_id: string
  service_id: string
  service_name: string
  quantity: number
  start_time: string
  end_time: string
  remarks: string
  status?: string
  assigned_team: WorkOrderTeamAssignment[]
}

export interface WorkOrderEvent {
  id: string
  work_order_id: string
  event_type_id: string
  event_type_name: string
  event_date: string
  event_time: string
  venue: string
  google_map_link: string
  notes: string
  services: WorkOrderService[]
  sort_order?: number
}

// ─── Deliverable Entity ───────────────────────────────────────────────────────

export interface WorkOrderDeliverable {
  id: string
  work_order_id: string
  deliverable_id: string
  name: string
  is_included: boolean
  is_delivered: boolean
  notes?: string
  due_date?: string
}

// ─── Payment Ledger Entity ────────────────────────────────────────────────────

export interface WorkOrderPaymentLedger {
  id: string
  work_order_id?: string
  payment_date: string
  amount: number
  payment_mode: string
  transaction_ref: string
  received_by: string
  notes: string
  receipt_url?: string
  created_at?: string
}

export interface WorkOrderPaymentSummary {
  package_amount: number
  discount_amount: number
  gst_applicable?: boolean
  gst_percent: number
  gst_amount: number
  net_amount: number
  grand_total?: number
  total_amount?: number
  amount_received: number
  balance_amount: number
  payment_status: PaymentStatus
  ledger: WorkOrderPaymentLedger[]
}

// ─── Contract Entity ──────────────────────────────────────────────────────────

export interface WorkOrderContract {
  title: string
  agreement_number: string
  agreement_date: string
  valid_until: string
  customer_signature: string
  studio_signature: string
  terms_content: string // Rich Text HTML
  status: ContractStatus
}

// ─── Main Work Order Entity ──────────────────────────────────────────────────

export interface CustomerAcknowledgement {
  id: string
  work_order_id: string
  acknowledged: boolean
  acknowledged_at: string | null
  customer_name: string
  device?: string
  browser?: string
  ip_address?: string
  created_at?: string
}

export interface ProjectGallery {
  id: string
  work_order_id: string
  gallery_name: string
  gallery_url: string
  gallery_password?: string
  status: 'not_published' | 'published' | 'expired'
  publish_date: string
  expiry_date?: string
  created_by?: string
  updated_at?: string
}

export interface WorkOrder extends BaseEntity {
  work_order_number: string
  project_name: string
  customer_name: string
  mobile: string
  whatsapp_number: string | null
  alternate_mobile: string | null
  email: string | null
  event_type: string // Main event type label
  booking_date: string | null
  source: EnquirySource | null
  enquiry_id: string | null
  venue: string | null
  city: string | null
  google_map_link: string | null
  notes: string | null
  status: WorkOrderStatus
  payment_status: PaymentStatus
  contract_status: ContractStatus
  progress_percent: number
  package_total?: number
  amount_received?: number
  balance_due?: number
  pinterest_link: string | null
  special_instructions: string | null
  contract_url: string | null
  contract_accepted_at: string | null
  final_delivery_date: string | null
  album_delivery_date: string | null
  is_draft: boolean

  // Archive Control Flags
  is_archived?: boolean
  archived_at?: string | null
  archived_by?: string | null
  archive_reason?: string | null

  // Production Completion Control Flag
  production_completed?: boolean
  production_completed_at?: string | null
  production_completed_by?: string | null

  // Relational hierarchy
  events: WorkOrderEvent[]
  deliverables: WorkOrderDeliverable[]
  payment: WorkOrderPaymentSummary
  contract?: WorkOrderContract
  gallery?: ProjectGallery
  acknowledgement?: CustomerAcknowledgement
  activity_logs?: { id: string; action: string; user: string; date: string; details: string }[]
}

// ─── Wizard Form Types ────────────────────────────────────────────────────────

export interface WizardTeamAssignment {
  employee_id: string
  employee_name: string
  role_title?: string
}

export interface WizardServiceForm {
  id: string
  service_id: string
  service_name: string
  quantity: number
  start_time: string
  end_time: string
  remarks: string
  assigned_team: WizardTeamAssignment[]
}

export interface WizardEventForm {
  id: string
  event_type_id: string
  event_type_name: string
  event_date: string
  event_time: string
  venue: string
  google_map_link: string
  notes: string
  services: WizardServiceForm[]
}

export interface WizardDeliverableItem {
  deliverable_id: string
  name: string
  is_included: boolean
  notes: string
}

export interface WizardPaymentData {
  package_amount: string
  discount_amount: string
  gst_applicable?: boolean
  gst_percent: string
  ledger: WorkOrderPaymentLedger[]
}

export interface WizardContractData {
  title: string
  agreement_number: string
  agreement_date: string
  valid_until: string
  customer_signature: string
  studio_signature: string
  terms_content: string
}

export interface WorkOrderWizardData {
  // Step 1 – Overview
  project_name: string
  customer_name: string
  mobile: string
  whatsapp_number: string
  alternate_mobile: string
  email: string
  event_type: string
  booking_date: string
  source: EnquirySource | ''
  venue: string
  city: string
  google_map_link: string
  notes: string
  // Step 2 – Events & Services
  events: WizardEventForm[]
  // Step 3 – Deliverables
  deliverables: WizardDeliverableItem[]
  // Step 4 – Payments
  payment: WizardPaymentData
  // Step 5 – Contract
  contract: WizardContractData
  // Step 6 – Moodboard
  pinterest_link: string
  special_instructions: string
  // Step 7 – Calendar
  final_delivery_date: string
  album_delivery_date: string
}

export const DEFAULT_WIZARD_DATA: WorkOrderWizardData = {
  project_name: '', customer_name: '', mobile: '', whatsapp_number: '',
  alternate_mobile: '', email: '', event_type: '', booking_date: '',
  source: '', venue: '', city: '', google_map_link: '', notes: '',
  events: [],
  deliverables: [],
  payment: {
    package_amount: '0',
    discount_amount: '0',
    gst_applicable: false,
    gst_percent: '18',
    ledger: [],
  },
  contract: {
    title: 'Standard Photography & Videography Agreement',
    agreement_number: '',
    agreement_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    customer_signature: '',
    studio_signature: 'Trufocus Studio Manager',
    terms_content: `<h2>1. Booking & Retainer</h2><p>A non-refundable retainer fee of <strong>25%</strong> is required upon signing this contract to secure the shoot date(s).</p>`,
  },
  pinterest_link: '', special_instructions: '',
  final_delivery_date: '', album_delivery_date: '',
}

export function workOrderToWizardData(wo: WorkOrder): WorkOrderWizardData {
  return {
    project_name: wo.project_name || '',
    customer_name: wo.customer_name || '',
    mobile: wo.mobile || '',
    whatsapp_number: wo.whatsapp_number || '',
    alternate_mobile: wo.alternate_mobile || '',
    email: wo.email || '',
    event_type: wo.event_type || '',
    booking_date: wo.booking_date || '',
    source: wo.source || '',
    venue: wo.venue || '',
    city: wo.city || '',
    google_map_link: wo.google_map_link || '',
    notes: wo.notes || '',
    events: (wo.events || []).map((e) => ({
      id: e.id,
      event_type_id: e.event_type_id || '',
      event_type_name: e.event_type_name || e.event_type_id || 'Event',
      event_date: e.event_date || '',
      event_time: e.event_time || '',
      venue: e.venue || '',
      google_map_link: e.google_map_link || '',
      notes: e.notes || '',
      services: (e.services || []).map((s) => ({
        id: s.id,
        service_id: s.service_id,
        service_name: s.service_name,
        quantity: s.quantity,
        start_time: s.start_time || '09:00',
        end_time: s.end_time || '18:00',
        remarks: s.remarks || '',
        assigned_team: (s.assigned_team || []).map((t) => ({
          employee_id: t.employee_id,
          employee_name: t.employee_name,
          role_title: t.role_title,
        })),
      })),
    })),
    deliverables: (wo.deliverables || []).map((d) => ({
      deliverable_id: d.deliverable_id || d.id,
      name: d.name,
      is_included: d.is_included ?? true,
      notes: d.notes || '',
    })),
    payment: {
      package_amount: String(wo.payment?.package_amount ?? '0'),
      discount_amount: String(wo.payment?.discount_amount ?? '0'),
      gst_applicable: wo.payment?.gst_applicable ?? false,
      gst_percent: String(wo.payment?.gst_percent ?? '18'),
      ledger: wo.payment?.ledger ?? [],
    },
    contract: {
      title: wo.contract?.title || 'Standard Photography Agreement',
      agreement_number: wo.contract?.agreement_number || '',
      agreement_date: wo.contract?.agreement_date || new Date().toISOString().split('T')[0],
      valid_until: wo.contract?.valid_until || '',
      customer_signature: wo.contract?.customer_signature || '',
      studio_signature: wo.contract?.studio_signature || '',
      terms_content: wo.contract?.terms_content || '<h2>Agreement Terms</h2>',
    },
    pinterest_link: wo.pinterest_link || '',
    special_instructions: wo.special_instructions || '',
    final_delivery_date: wo.final_delivery_date || '',
    album_delivery_date: wo.album_delivery_date || '',
  }
}

export function wizardDataToWorkOrderUpdates(data: WorkOrderWizardData, existing?: WorkOrder): Partial<WorkOrder> {
  const packageAmt = parseFloat(data.payment?.package_amount || '0') || 0
  const discountAmt = parseFloat(data.payment?.discount_amount || '0') || 0
  const gstPct = parseFloat(data.payment?.gst_percent || '0') || 0
  const gstApplicable = Boolean(data.payment?.gst_applicable)
  const ledger = data.payment?.ledger || existing?.payment?.ledger || []

  return {
    project_name: data.project_name?.trim() || existing?.project_name || '',
    customer_name: data.customer_name?.trim() || existing?.customer_name || '',
    mobile: data.mobile?.trim() || existing?.mobile || '',
    whatsapp_number: data.whatsapp_number?.trim() || null,
    alternate_mobile: data.alternate_mobile?.trim() || null,
    email: data.email?.trim() || null,
    event_type: data.event_type || existing?.event_type || 'Wedding',
    booking_date: data.booking_date || existing?.booking_date || null,
    source: data.source || existing?.source || null,
    venue: data.venue?.trim() || null,
    city: data.city?.trim() || null,
    google_map_link: data.google_map_link?.trim() || null,
    notes: data.notes?.trim() || null,
    pinterest_link: data.pinterest_link?.trim() || null,
    special_instructions: data.special_instructions?.trim() || null,
    final_delivery_date: data.final_delivery_date || null,
    album_delivery_date: data.album_delivery_date || null,
    events: (data.events || []).map((ev, idx) => ({
      id: ev.id || `ev-${Date.now()}-${idx}`,
      work_order_id: existing?.id || '',
      event_type_id: ev.event_type_id || '',
      event_type_name: ev.event_type_name || ev.event_type_id || 'Event',
      event_date: ev.event_date || '',
      event_time: ev.event_time || '',
      venue: ev.venue || '',
      google_map_link: ev.google_map_link || '',
      notes: ev.notes || '',
      services: (ev.services || []).map((s, sidx) => ({
        id: s.id || `srv-${Date.now()}-${sidx}`,
        event_id: ev.id || '',
        service_id: s.service_id || '',
        service_name: s.service_name || 'Service',
        quantity: s.quantity || 1,
        start_time: s.start_time || '09:00',
        end_time: s.end_time || '18:00',
        remarks: s.remarks || '',
        assigned_team: (s.assigned_team || []).map((t, tidx) => ({
          id: (t as any).id || `tm-${Date.now()}-${tidx}`,
          service_id: (t as any).service_id || s.id || '',
          employee_id: t.employee_id,
          employee_name: t.employee_name,
          role_title: t.role_title || '',
        })),
      })),
    })),
    deliverables: (data.deliverables || []).map((d, didx) => ({
      id: d.deliverable_id || `del-${Date.now()}-${didx}`,
      work_order_id: existing?.id || '',
      deliverable_id: d.deliverable_id || '',
      name: d.name || 'Deliverable',
      is_included: d.is_included ?? true,
      is_delivered: false,
      notes: d.notes || '',
    })),
    payment: {
      package_amount: packageAmt,
      discount_amount: discountAmt,
      gst_applicable: gstApplicable,
      gst_percent: gstPct,
      gst_amount: 0,
      net_amount: 0,
      amount_received: 0,
      balance_amount: 0,
      payment_status: existing?.payment_status || 'pending',
      ledger: ledger,
    },
    contract: {
      title: data.contract?.title || existing?.contract?.title || 'Standard Photography Agreement',
      agreement_number: data.contract?.agreement_number || existing?.contract?.agreement_number || '',
      agreement_date: data.contract?.agreement_date || existing?.contract?.agreement_date || new Date().toISOString().split('T')[0],
      valid_until: data.contract?.valid_until || existing?.contract?.valid_until || '',
      customer_signature: data.contract?.customer_signature || existing?.contract?.customer_signature || '',
      studio_signature: data.contract?.studio_signature || existing?.contract?.studio_signature || 'Trufocus Director',
      terms_content: data.contract?.terms_content || existing?.contract?.terms_content || '<h2>Agreement Terms</h2>',
      status: data.contract?.customer_signature ? 'signed' : (existing?.contract?.status || 'pending'),
    },
  }
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface WorkOrderFilters {
  search: string
  status: WorkOrderStatus | 'all'
  event_type: string | 'all'
  payment_status: PaymentStatus | 'all'
  date_range: 'today' | 'this_week' | 'this_month' | 'all'
}
