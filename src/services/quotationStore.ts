import { supabase } from '@/services/supabase/client'
import { isCloudConfigured, pushEntityToCloud } from '@/services/cloudSyncService'
import { updateEnquiry, fetchEnquiriesLocal, saveLocalEnquiries } from '@/services/supabase/enquiries'
import { createWorkOrder } from '@/services/supabase/workOrders'
import type { Quotation, QuotationFormData } from '@/types/quotation'
import type { Enquiry } from '@/types/enquiries'
import type { WorkOrderWizardData } from '@/types/workOrders'

const TABLE = 'quotations'
const LOCAL_STORAGE_KEY = 'trufocus_crm_quotations_v1'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INITIAL_DEMO_QUOTATION: Quotation = {
  id: 'qtn-demo-001',
  quotation_number: 'QTN-2026-001',
  enquiry_id: 'enq-demo-001',
  enquiry_number: 'ENQ-2026-001',
  customer_name: 'Ananya Sharma & Rahul Verma',
  mobile: '+91 98765 43210',
  whatsapp_number: '+91 98765 43210',
  email: 'ananya.rahul@example.com',
  event_type: 'Grand Wedding & Reception',
  valid_until: '2026-09-30',
  status: 'sent',
  package_amount: 145000,
  discount_type: 'fixed',
  discount_value: 15000,
  discount_amount: 15000,
  final_amount: 130000,
  events: [
    {
      id: 'ev-demo-1',
      event_type_name: 'Haldi & Sangeet Ceremony',
      event_date: '2026-11-14',
      event_time: '16:00',
      venue: 'The Leela Palace Gardens, Bengaluru',
      services: [
        { id: 's1', service_id: 'srv-trad-photo', service_name: 'Traditional Photography', quantity: 1, included: true },
        { id: 's2', service_id: 'srv-cand-photo', service_name: 'Candid Photography', quantity: 1, included: true },
        { id: 's3', service_id: 'srv-cand-video', service_name: 'Cinematic Videography', quantity: 1, included: true },
      ],
    },
    {
      id: 'ev-demo-2',
      event_type_name: 'Grand Wedding & Muhurtham',
      event_date: '2026-11-15',
      event_time: '08:30',
      venue: 'The Leela Palace Grand Ballroom, Bengaluru',
      services: [
        { id: 's4', service_id: 'srv-trad-photo', service_name: 'Traditional Photography', quantity: 2, included: true },
        { id: 's5', service_id: 'srv-cand-photo', service_name: 'Candid Photography', quantity: 2, included: true },
        { id: 's6', service_id: 'srv-trad-video', service_name: 'Traditional Videography', quantity: 1, included: true },
        { id: 's7', service_id: 'srv-cand-video', service_name: 'Cinematic Feature Film', quantity: 1, included: true },
        { id: 's8', service_id: 'srv-drone', service_name: '4K Aerial Drone Coverage', quantity: 1, included: true },
      ],
    },
  ],
  deliverables: [
    { id: 'd1', name: 'Unlimited Color Graded High-Res Photos', is_included: true },
    { id: 'd2', name: '3-4 Min Cinematic Teaser Video', is_included: true },
    { id: 'd3', name: '20-30 Min Full Wedding Highlight Film', is_included: true },
    { id: 'd4', name: 'Two Premium 30-Sheet Flush Mount Albums', is_included: true },
    { id: 'd5', name: 'Cloud Online Client Gallery (1 Year Access)', is_included: true },
  ],
  payment_terms: [
    { installment: 'Booking Advance (20%)', amount: 26000, percentage: 20 },
    { installment: 'Before Shoot Date (60%)', amount: 78000, percentage: 60 },
    { installment: 'Final Delivery (20%)', amount: 26000, percentage: 20 },
  ],
  terms_conditions: `<ul>
    <li>A non-refundable booking advance of 20% is required to secure event dates.</li>
    <li>Balance 60% amount payable on or before the event date.</li>
    <li>Remaining 20% payable upon final delivery of albums and edited videos.</li>
    <li>Raw photos drive & digital access delivered within 7 working days.</li>
  </ul>`,
  notes: 'Client requested drone coverage for the outdoor Leela gardens Mandap.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'usr-admin',
  deleted_at: null,
  sent_at: new Date().toISOString(),
  timeline: [
    {
      id: 'tl-1',
      timestamp: new Date().toISOString(),
      action: 'created',
      actor: 'admin',
      actor_name: 'Trufocus Admin',
      notes: 'Initial event-wise quotation generated',
    },
    {
      id: 'tl-2',
      timestamp: new Date().toISOString(),
      action: 'sent',
      actor: 'admin',
      actor_name: 'Trufocus Admin',
      notes: 'Sent to client via WhatsApp',
    },
  ],
}

function getLocalQuotationsRaw(): Quotation[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.error('Failed reading local quotations', e)
  }
  return [INITIAL_DEMO_QUOTATION]
}

function saveLocalQuotationsRaw(items: Quotation[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items))
    pushEntityToCloud(TABLE, 'main', items)
  } catch (e) {
    console.error('Failed saving local quotations', e)
  }
}

function broadcastQuotationSync(quotation?: Quotation) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('trufocus_quotation_updated', { detail: quotation }))
  window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
  window.dispatchEvent(new CustomEvent('trufocus_portal_updated'))
}

// ─── Number Generator ─────────────────────────────────────────────────────────

export function generateQuotationNumber(): string {
  const existing = getLocalQuotationsRaw()
  const year = new Date().getFullYear()
  let maxNum = 0
  existing.forEach((q) => {
    const match = q.quotation_number?.match(/QTN-\d+-(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num) && num > maxNum) maxNum = num
    }
  })
  const nextNum = maxNum + 1
  return `QTN-${year}-${nextNum.toString().padStart(3, '0')}`
}

export function getQuotationPortalUrl(quotationNumber: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://trufocus.photos'
  return `${baseUrl}/portal/quotation/${encodeURIComponent(quotationNumber)}`
}

// ─── Primary Supabase CRUD Operations ─────────────────────────────────────────

export async function fetchQuotations(): Promise<Quotation[]> {
  if (isCloudConfigured()) {
    try {
      const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false })
      if (!error && data && data.length > 0) {
        const cloudItems: Quotation[] = data.map((row) => row.data || row)
        saveLocalQuotationsRaw(cloudItems)
        return cloudItems
      }
    } catch (e) {
      console.warn('[QuotationStore] Network exception fetching quotations from Supabase:', e)
    }
  }
  return getLocalQuotationsRaw()
}

export async function getQuotationById(id: string): Promise<Quotation | null> {
  if (!id) return null
  const all = await fetchQuotations()
  return all.find((q) => q.id === id || q.quotation_number === id) || null
}

export async function getQuotationByNumber(quotationNumber: string): Promise<Quotation | null> {
  if (!quotationNumber) return null
  const all = await fetchQuotations()
  return (
    all.find(
      (q) => q.quotation_number.toLowerCase() === quotationNumber.toLowerCase() || q.id === quotationNumber
    ) || null
  )
}

export async function getQuotationByEnquiryId(enquiryId: string): Promise<Quotation | null> {
  if (!enquiryId) return null
  const all = await fetchQuotations()
  return all.find((q) => q.enquiry_id === enquiryId) || null
}

export async function saveQuotation(quotation: Quotation): Promise<{ success: boolean; data?: Quotation; error?: string }> {
  const existing = getLocalQuotationsRaw()
  const idx = existing.findIndex((q) => q.id === quotation.id || q.quotation_number === quotation.quotation_number)

  let updatedList: Quotation[]
  if (idx >= 0) {
    updatedList = [...existing]
    updatedList[idx] = quotation
  } else {
    updatedList = [quotation, ...existing]
  }

  saveLocalQuotationsRaw(updatedList)

  if (isCloudConfigured()) {
    try {
      const { error } = await supabase.from(TABLE).upsert({
        id: quotation.id,
        data: quotation,
        updated_at: new Date().toISOString(),
      })
      if (error) console.warn('[QuotationStore] Supabase save notice:', error.message)
    } catch (e) {
      console.warn('[QuotationStore] Exception saving quotation to Supabase:', e)
    }
  }

  broadcastQuotationSync(quotation)
  return { success: true, data: quotation }
}

function createTimelineEvent(
  action: 'created' | 'sent' | 'viewed' | 'change_requested' | 'accepted' | 'rejected' | 'work_order_created',
  actor: 'admin' | 'customer' | 'system',
  actorName?: string,
  notes?: string
) {
  return {
    id: 'tl-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
    action,
    actor,
    actor_name: actorName,
    notes,
  }
}

export async function createQuotation(form: QuotationFormData, userId = 'usr-admin'): Promise<{ data?: Quotation; error?: string }> {
  const pkgAmt = parseFloat(String(form.package_amount || '0')) || 0
  const discVal = parseFloat(String(form.discount_value || '0')) || 0
  
  let discAmt = 0
  if (form.discount_type === 'percentage') {
    discAmt = (pkgAmt * discVal) / 100
  } else {
    discAmt = discVal
  }
  const finalAmt = Math.max(0, pkgAmt - discAmt)

  const quotationNumber = generateQuotationNumber()
  const now = new Date().toISOString()

  const initialTimeline = [
    createTimelineEvent('created', 'admin', 'Admin', 'Quotation draft created'),
  ]
  if (form.status === 'sent') {
    initialTimeline.push(createTimelineEvent('sent', 'admin', 'Admin', 'Quotation sent to client'))
  }

  const newQuotation: Quotation = {
    id: 'qtn-' + Date.now(),
    quotation_number: quotationNumber,
    enquiry_id: form.enquiry_id || null,
    enquiry_number: form.enquiry_number || null,
    customer_name: form.customer_name?.trim() || 'Client',
    mobile: form.mobile?.trim() || '',
    whatsapp_number: form.whatsapp_number?.trim() || form.mobile?.trim() || null,
    email: form.email?.trim() || null,
    event_type: form.event_type || 'Wedding',
    valid_until: form.valid_until || null,
    status: form.status || 'sent',
    package_amount: pkgAmt,
    discount_type: form.discount_type || 'fixed',
    discount_value: discVal,
    discount_amount: discAmt,
    final_amount: finalAmt,
    events: form.events || [],
    deliverables: form.deliverables || [],
    payment_terms: form.payment_terms || [
      { installment: 'Booking Advance (20%)', amount: Math.round(finalAmt * 0.2), percentage: 20 },
      { installment: 'Before Shoot Date (60%)', amount: Math.round(finalAmt * 0.6), percentage: 60 },
      { installment: 'Final Album & Video Delivery (20%)', amount: Math.round(finalAmt * 0.2), percentage: 20 },
    ],
    terms_conditions: form.terms_conditions || `<ul>
      <li>A non-refundable booking advance of 20% is required to secure event dates.</li>
      <li>Balance 60% amount payable on or before the event date.</li>
      <li>Remaining 20% payable upon final delivery of albums and edited videos.</li>
      <li>Raw photos drive & digital access delivered within 7 working days.</li>
    </ul>`,
    notes: form.notes || null,
    deleted_at: null,
    created_at: now,
    updated_at: now,
    created_by: userId,
    sent_at: form.status === 'sent' ? now : null,
    timeline: initialTimeline,
  }

  await saveQuotation(newQuotation)

  // Update Enquiry status if linked
  if (form.enquiry_id) {
    try {
      await updateEnquiry(form.enquiry_id, { status: 'quotation_sent' })
    } catch (e) {
      console.warn('[QuotationStore] Error updating enquiry status:', e)
    }
  }

  return { data: newQuotation }
}

export async function updateQuotation(id: string, updates: Partial<Quotation>, actorName = 'Admin'): Promise<{ data?: Quotation; error?: string }> {
  const existing = await getQuotationById(id)
  if (!existing) return { error: 'Quotation not found.' }

  const pkgAmt = updates.package_amount !== undefined
    ? parseFloat(String(updates.package_amount))
    : existing.package_amount

  const discType = updates.discount_type || existing.discount_type
  const discVal = updates.discount_value !== undefined
    ? parseFloat(String(updates.discount_value))
    : existing.discount_value

  let discAmt = 0
  if (discType === 'percentage') {
    discAmt = (pkgAmt * discVal) / 100
  } else {
    discAmt = discVal
  }
  const finalAmt = Math.max(0, pkgAmt - discAmt)

  const updatedTimeline = [...(existing.timeline || [])]
  if (updates.status && updates.status !== existing.status) {
    updatedTimeline.push(
      createTimelineEvent(
        updates.status === 'sent' ? 'sent' : 'created',
        'admin',
        actorName,
        `Quotation status updated to ${updates.status}`
      )
    )
  }

  const updated: Quotation = {
    ...existing,
    ...updates,
    package_amount: pkgAmt,
    discount_type: discType,
    discount_value: discVal,
    discount_amount: discAmt,
    final_amount: finalAmt,
    updated_at: new Date().toISOString(),
    timeline: updatedTimeline,
  }

  await saveQuotation(updated)
  return { data: updated }
}

// ─── Client Action Methods ────────────────────────────────────────────────────

// ─── Helper: Sync Linked Enquiry Status & Notes ─────────────────────────────

async function syncLinkedEnquiryStatus(
  qtn: Quotation,
  newEnquiryStatus: string,
  actionNote?: string
) {
  try {
    const allEnquiries: Enquiry[] = fetchEnquiriesLocal()
    let linked = allEnquiries.find(
      (e: Enquiry) => (qtn.enquiry_id && e.id === qtn.enquiry_id) || (qtn.enquiry_number && e.enquiry_number === qtn.enquiry_number)
    )

    if (!linked && qtn.mobile) {
      const targetMob = qtn.mobile.replace(/\D/g, '')
      if (targetMob && targetMob.length >= 8) {
        linked = allEnquiries.find((e: Enquiry) => e.mobile.replace(/\D/g, '') === targetMob)
      }
    }

    const timestampStr = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    const noteEntry = actionNote ? `[Quotation ${qtn.quotation_number} • ${timestampStr}]: ${actionNote}` : ''

    if (!linked) {
      // Auto-create missing Enquiry record for this Quotation
      const seqStr = qtn.quotation_number ? qtn.quotation_number.replace(/\D/g, '').slice(-3) : '001'
      const enquiryNumber = qtn.enquiry_number || `ENQ-${new Date().getFullYear()}-${seqStr}`
      
      const newEnquiry: Enquiry = {
        id: qtn.enquiry_id || `enq-${Date.now()}`,
        enquiry_number: enquiryNumber,
        customer_name: qtn.customer_name || 'Client',
        mobile: qtn.mobile || '+91 98765 43210',
        alternate_mobile: null,
        email: qtn.email || null,
        event_type: (qtn.event_type?.toLowerCase().includes('wedding') ? 'wedding' : 'wedding') as any,
        event_date: qtn.events[0]?.event_date || null,
        event_time: qtn.events[0]?.event_time || null,
        venue: qtn.events[0]?.venue || null,
        location: null,
        budget: qtn.final_amount || qtn.package_amount || 85000,
        source: 'website',
        status: newEnquiryStatus as any,
        assigned_to: 'usr-admin',
        notes: noteEntry || `[Quotation ${qtn.quotation_number}]: Proposal created`,
        preferred_contact_method: 'whatsapp',
        quotation_id: qtn.id,
        quotation_number: qtn.quotation_number,
        quotation_status: qtn.status,
        created_at: qtn.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'usr-admin',
        deleted_at: null,
      }

      const updatedList = [newEnquiry, ...allEnquiries]
      saveLocalEnquiries(updatedList)
    } else {
      let updatedNotes = linked.notes || ''
      if (noteEntry && !updatedNotes.includes(noteEntry)) {
        updatedNotes = updatedNotes ? `${updatedNotes}\n\n${noteEntry}` : noteEntry
      }

      await updateEnquiry(linked.id, {
        status: newEnquiryStatus as any,
        notes: updatedNotes,
        quotation_id: qtn.id,
        quotation_number: qtn.quotation_number,
        quotation_status: qtn.status as any,
      } as any)
    }
  } catch (e) {
    console.warn('[QuotationStore] Error syncing linked enquiry status:', e)
  }
}

export async function markQuotationViewed(quotationNumber: string): Promise<Quotation | null> {
  const qtn = await getQuotationByNumber(quotationNumber)
  if (!qtn) return null

  if (qtn.status === 'sent' || qtn.status === 'draft') {
    const now = new Date().toISOString()
    const updatedTimeline = [
      ...(qtn.timeline || []),
      createTimelineEvent('viewed', 'customer', qtn.customer_name, 'Client viewed proposal online'),
    ]
    const updated: Quotation = {
      ...qtn,
      status: 'viewed',
      viewed_at: now,
      updated_at: now,
      timeline: updatedTimeline,
    }
    await saveQuotation(updated)
    await syncLinkedEnquiryStatus(updated, 'customer_reviewing', 'Proposal opened & viewed by client online')
    return updated
  }
  return qtn
}

export async function acceptQuotation(quotationNumber: string, acceptedBy?: string): Promise<{ success: boolean; quotation?: Quotation; message: string }> {
  const qtn = await getQuotationByNumber(quotationNumber)
  if (!qtn) return { success: false, message: 'Quotation not found.' }

  if (qtn.status === 'rejected') {
    return { success: false, message: 'Cannot accept a quotation that has already been declined/rejected.' }
  }
  if (qtn.status === 'accepted') {
    return { success: true, quotation: qtn, message: 'Quotation is already accepted.' }
  }

  const now = new Date().toISOString()
  const actorName = acceptedBy || qtn.customer_name
  const updatedTimeline = [
    ...(qtn.timeline || []),
    createTimelineEvent('accepted', 'customer', actorName, 'Quotation officially accepted by client'),
  ]

  const updated: Quotation = {
    ...qtn,
    status: 'accepted',
    accepted_at: now,
    customer_name: actorName,
    updated_at: now,
    timeline: updatedTimeline,
  }

  await saveQuotation(updated)

  // Sync Linked Enquiry -> BOOKED
  await syncLinkedEnquiryStatus(updated, 'booked', `🎉 PROPOSAL ACCEPTED by client (${actorName}). Enquiry converted to BOOKED!`)

  // Automatically attempt Work Order creation
  try {
    await createWorkOrderFromQuotation(updated.id)
  } catch (e) {
    console.warn('[QuotationStore] Background Work Order creation skipped:', e)
  }

  return { success: true, quotation: updated, message: '🎉 Quotation accepted successfully! Enquiry updated to Booked.' }
}

export async function declineQuotation(quotationNumber: string, reason?: string, declinedBy?: string): Promise<{ success: boolean; quotation?: Quotation; message: string }> {
  const qtn = await getQuotationByNumber(quotationNumber)
  if (!qtn) return { success: false, message: 'Quotation not found.' }

  if (qtn.status === 'accepted') {
    return { success: false, message: 'Cannot decline a quotation that has already been accepted.' }
  }
  if (qtn.status === 'rejected') {
    return { success: true, quotation: qtn, message: 'Quotation is already declined.' }
  }

  const now = new Date().toISOString()
  const actorName = declinedBy || qtn.customer_name
  const updatedTimeline = [
    ...(qtn.timeline || []),
    createTimelineEvent('rejected', 'customer', actorName, reason ? `Declined: ${reason}` : 'Quotation declined by client'),
  ]

  const updated: Quotation = {
    ...qtn,
    status: 'rejected',
    rejected_at: now,
    decline_reason: reason || null,
    updated_at: now,
    timeline: updatedTimeline,
  }

  await saveQuotation(updated)

  // Sync Linked Enquiry -> REJECTED
  const noteText = reason ? `❌ PROPOSAL DECLINED by client (${actorName}). Reason: ${reason}` : `❌ PROPOSAL DECLINED by client (${actorName}).`
  await syncLinkedEnquiryStatus(updated, 'rejected', noteText)

  return { success: true, quotation: updated, message: 'Quotation declined. Enquiry status updated to Rejected.' }
}

export async function requestQuotationChanges(quotationNumber: string, feedback: string, requestedBy?: string): Promise<{ success: boolean; quotation?: Quotation; message: string }> {
  const qtn = await getQuotationByNumber(quotationNumber)
  if (!qtn) return { success: false, message: 'Quotation not found.' }

  if (qtn.status === 'accepted') {
    return { success: false, message: 'Quotation is already accepted.' }
  }

  const now = new Date().toISOString()
  const actorName = requestedBy || qtn.customer_name
  const updatedTimeline = [
    ...(qtn.timeline || []),
    createTimelineEvent('change_requested', 'customer', actorName, `Requested changes: ${feedback}`),
  ]

  const updated: Quotation = {
    ...qtn,
    status: 'change_requested',
    change_requested_at: now,
    change_requested_notes: feedback,
    updated_at: now,
    timeline: updatedTimeline,
  }

  await saveQuotation(updated)

  // Sync Linked Enquiry -> REVISE PROPOSAL / CUSTOMER REVIEWING
  await syncLinkedEnquiryStatus(updated, 'customer_reviewing', `📝 REVISION REQUESTED by client (${actorName}): "${feedback}"`)

  return { success: true, quotation: updated, message: 'Revision request submitted to Trufocus team. Enquiry status updated.' }
}

// ─── Work Order Creation from Accepted Quotation ──────────────────────────────

export async function createWorkOrderFromQuotation(quotationId: string, userId = 'usr-admin'): Promise<{ success: boolean; workOrder?: any; error?: string }> {
  const qtn = await getQuotationById(quotationId)
  if (!qtn) return { success: false, error: 'Quotation not found.' }

  if (qtn.converted_to_work_order && qtn.work_order_id) {
    return { success: true, workOrder: { id: qtn.work_order_id, work_order_number: qtn.work_order_number } }
  }

  const wizardData: WorkOrderWizardData = {
    project_name: `${qtn.customer_name} - ${qtn.event_type}`,
    customer_name: qtn.customer_name,
    mobile: qtn.mobile,
    whatsapp_number: qtn.whatsapp_number || qtn.mobile,
    alternate_mobile: '',
    email: qtn.email || '',
    event_type: qtn.event_type,
    booking_date: qtn.events[0]?.event_date || new Date().toISOString().split('T')[0],
    source: 'website',
    venue: qtn.events[0]?.venue || '',
    city: '',
    google_map_link: '',
    notes: qtn.notes || '',
    events: (qtn.events || []).map((e) => ({
      id: e.id || 'ev-' + Date.now(),
      event_type_id: '',
      event_type_name: e.event_type_name,
      event_date: e.event_date,
      event_time: e.event_time || '',
      venue: e.venue || '',
      google_map_link: e.google_map_link || '',
      notes: e.notes || '',
      services: (e.services || []).map((s) => ({
        id: s.id || 'srv-' + Date.now(),
        service_id: s.service_id,
        service_name: s.service_name,
        quantity: s.quantity || 1,
        start_time: s.start_time || '09:00',
        end_time: s.end_time || '18:00',
        remarks: s.remarks || '',
        assigned_team: [],
      })),
    })),
    deliverables: (qtn.deliverables || []).map((d) => ({
      deliverable_id: d.id,
      name: d.name,
      is_included: d.is_included,
      notes: d.notes || '',
    })),
    payment: {
      package_amount: String(qtn.package_amount),
      discount_amount: String(qtn.discount_amount),
      gst_applicable: false,
      gst_percent: '18',
      ledger: [],
    },
    contract: {
      title: 'Photography & Videography Service Agreement',
      agreement_number: `AGR-${qtn.quotation_number.replace(/\D/g, '')}`,
      agreement_date: new Date().toISOString().split('T')[0],
      valid_until: '',
      customer_signature: qtn.customer_name,
      studio_signature: 'Trufocus Director',
      terms_content: qtn.terms_conditions || '<h2>Agreement Terms</h2>',
    },
    pinterest_link: '',
    special_instructions: '',
    final_delivery_date: '',
    album_delivery_date: '',
  }

  const { data: createdWO, error } = await createWorkOrder(wizardData, userId, false)
  if (error || !createdWO) {
    return { success: false, error: error || 'Failed to create Work Order.' }
  }

  const updatedTimeline = [
    ...(qtn.timeline || []),
    createTimelineEvent('work_order_created', 'admin', 'Admin', `Work Order ${createdWO.work_order_number} created`),
  ]

  const updatedQtn: Quotation = {
    ...qtn,
    converted_to_work_order: true,
    work_order_id: createdWO.id,
    work_order_number: createdWO.work_order_number,
    updated_at: new Date().toISOString(),
    timeline: updatedTimeline,
  }

  await saveQuotation(updatedQtn)

  if (qtn.enquiry_id) {
    try {
      await updateEnquiry(qtn.enquiry_id, {
        converted_to_work_order: true,
        work_order_id: createdWO.id,
        work_order_number: createdWO.work_order_number,
        status: 'converted',
      })
    } catch (e) {
      console.warn('[QuotationStore] Error updating enquiry to converted:', e)
    }
  }

  return { success: true, workOrder: createdWO }
}

// ─── WhatsApp Message Generator ───────────────────────────────────────────────

export function generateWhatsAppQuotationMessage(quotation: Quotation): string {
  const portalUrl = getQuotationPortalUrl(quotation.quotation_number)
  return `Hello ${quotation.customer_name},

Thank you for choosing Trufocus.photos.

We have prepared your photography & videography package based on your event requirements.

Package Value: ₹${quotation.package_amount.toLocaleString('en-IN')}
Special Discount: ₹${quotation.discount_amount.toLocaleString('en-IN')}
Final Package: ₹${quotation.final_amount.toLocaleString('en-IN')}

You can view the complete quotation and package inclusions here:
${portalUrl}

Please review and let us know if you would like any changes.

Regards,
TRUFOCUS.PHOTOS
Your Event, Online and On Point.`
}
