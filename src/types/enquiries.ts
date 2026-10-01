import type { BaseEntity } from './common'

// ─── Enums ────────────────────────────────────────────────────────────────────

export type EnquiryStatus =
  | 'new'
  | 'contacted'
  | 'quotation_sent'
  | 'customer_reviewing'
  | 'negotiation'
  | 'follow_up'
  | 'booked'
  | 'completed'
  | 'rejected'
  | 'lost'
  | 'converted'
  | 'deleted'

export type EnquirySource =
  | 'website'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'google'
  | 'google_business_profile'
  | 'referral'
  | 'walk_in'
  | 'phone_call'
  | 'manual_entry'
  | 'other'

export type EventType =
  | 'wedding'
  | 'reception'
  | 'engagement'
  | 'haldi'
  | 'mehendi'
  | 'sangeet'
  | 'birthday'
  | 'baby_shower'
  | 'naming_ceremony'
  | 'housewarming'
  | 'corporate_event'
  | 'studio_shoot'
  | 'other'

export type ContactMethod = 'whatsapp' | 'phone' | 'email'

// ─── Main Entity ──────────────────────────────────────────────────────────────

export interface Enquiry extends BaseEntity {
  enquiry_number: string
  customer_name: string
  mobile: string
  alternate_mobile: string | null
  email: string | null
  event_type: EventType
  event_date: string | null
  event_time: string | null
  venue: string | null
  location: string | null
  budget: number | null
  source: EnquirySource
  status: EnquiryStatus
  assigned_to: string | null
  notes: string | null
  preferred_contact_method: ContactMethod
  quotation_id?: string | null
  quotation_number?: string | null
  quotation_status?: string | null
  converted_to_work_order?: boolean
  work_order_id?: string | null
  work_order_number?: string | null
  deleted_at: string | null
  deleted_by?: string | null
  delete_reason?: string | null
  // Joined fields
  assigned_to_name?: string | null
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface EnquiryFormData {
  customer_name: string
  mobile: string
  alternate_mobile: string
  email: string
  event_type: EventType | ''
  event_date: string
  event_time: string
  venue: string
  location: string
  budget: string
  source: EnquirySource | ''
  status: EnquiryStatus
  assigned_to: string
  notes: string
  preferred_contact_method: ContactMethod
}

export interface EnquiryFilters {
  search: string
  status: EnquiryStatus | 'all'
  source: EnquirySource | 'all'
  event_type: EventType | 'all'
  date_range: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom' | 'all'
  date_from: string
  date_to: string
}

// ─── Label Maps ──────────────────────────────────────────────────────────────

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  quotation_sent: 'Quotation Sent',
  customer_reviewing: 'Customer Reviewing',
  negotiation: 'Negotiation',
  follow_up: 'Follow Up',
  booked: 'Booked',
  completed: 'Completed',
  rejected: 'Rejected',
  lost: 'Lost',
  converted: 'Converted to Work Order',
  deleted: 'Deleted (Trash)',
}

export const ENQUIRY_SOURCE_LABELS: Record<EnquirySource, string> = {
  website: 'Website',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  google: 'Google',
  google_business_profile: 'Google Business',
  referral: 'Referral',
  walk_in: 'Walk In',
  phone_call: 'Phone Call',
  manual_entry: 'Manual Entry',
  other: 'Other',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Wedding',
  reception: 'Reception',
  engagement: 'Engagement',
  haldi: 'Haldi',
  mehendi: 'Mehendi',
  sangeet: 'Sangeet',
  birthday: 'Birthday',
  baby_shower: 'Baby Shower',
  naming_ceremony: 'Naming Ceremony',
  housewarming: 'Housewarming',
  corporate_event: 'Corporate Event',
  studio_shoot: 'Studio Shoot',
  other: 'Other',
}

export const STATUS_COLORS: Record<EnquiryStatus, { bg: string; text: string; dot: string }> = {
  new:                { bg: 'bg-blue-500/15',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  contacted:          { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',   dot: 'bg-cyan-400' },
  quotation_sent:     { bg: 'bg-violet-500/15',  text: 'text-violet-400', dot: 'bg-violet-400' },
  customer_reviewing: { bg: 'bg-orange-500/15',  text: 'text-orange-400', dot: 'bg-orange-400' },
  negotiation:        { bg: 'bg-amber-500/15',   text: 'text-amber-400',  dot: 'bg-amber-400' },
  follow_up:          { bg: 'bg-yellow-500/15',  text: 'text-yellow-400', dot: 'bg-yellow-400' },
  booked:             { bg: 'bg-green-500/15',   text: 'text-green-400',  dot: 'bg-green-400' },
  completed:          { bg: 'bg-emerald-700/20', text: 'text-emerald-400',dot: 'bg-emerald-500' },
  rejected:           { bg: 'bg-red-500/15',     text: 'text-red-400',    dot: 'bg-red-400' },
  lost:               { bg: 'bg-gray-500/15',    text: 'text-gray-400',   dot: 'bg-gray-500' },
  converted:          { bg: 'bg-purple-500/15',  text: 'text-purple-400', dot: 'bg-purple-400' },
  deleted:            { bg: 'bg-red-500/15',     text: 'text-red-400',    dot: 'bg-red-500' },
}
