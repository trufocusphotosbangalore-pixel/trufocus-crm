import { supabase } from './client'
import { canUserPerformDelete } from '@/services/permissionService'
import { logAIPermissionAudit } from '@/services/aiPermissionService'
import { pushEntityToCloud } from '@/services/cloudSyncService'
import type { Enquiry, EnquiryFormData, EnquiryFilters } from '@/types/enquiries'
import type { ApiResponse, PaginatedResult, SortConfig } from '@/types/common'

const TABLE = 'enquiries'
const LOCAL_STORAGE_ENQ_KEY = 'trufocus_crm_enquiries_v1'

// ─── Local Storage Helpers ───────────────────────────────────────────────────

const INITIAL_DEMO_ENQUIRY: Enquiry = {
  id: 'enq-demo-001',
  enquiry_number: 'ENQ-2026-001',
  customer_name: 'Ananya Sharma & Rahul Verma',
  mobile: '+91 98765 43210',
  alternate_mobile: '',
  email: 'ananya.rahul@example.com',
  event_type: 'wedding',
  event_date: '2026-11-14',
  event_time: '16:00',
  venue: 'The Leela Palace, Bengaluru',
  location: 'Bengaluru',
  budget: 145000,
  source: 'website',
  status: 'quotation_sent',
  assigned_to: 'usr-admin',
  notes: 'Client requested drone coverage and candid wedding film.',
  preferred_contact_method: 'whatsapp',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'usr-admin',
  deleted_at: null,
}

function deduplicateEnquiries(items: Enquiry[]): Enquiry[] {
  const byEnquiryNumber = new Map<string, Enquiry>()

  // Sort latest updated first so most recent state wins
  const sorted = [...items].sort((a, b) => {
    const timeA = new Date(a.updated_at || a.created_at || 0).getTime()
    const timeB = new Date(b.updated_at || b.created_at || 0).getTime()
    return timeB - timeA
  })

  sorted.forEach((item) => {
    const key = item.enquiry_number ? item.enquiry_number.trim().toUpperCase() : item.id
    if (!byEnquiryNumber.has(key)) {
      byEnquiryNumber.set(key, item)
    }
  })

  return Array.from(byEnquiryNumber.values())
}

export function fetchEnquiriesLocal(): Enquiry[] {
  let list: Enquiry[] = []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ENQ_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) list = parsed
    }
  } catch (e) {
    console.error('Error loading local enquiries', e)
  }

  if (list.length === 0) {
    list = [INITIAL_DEMO_ENQUIRY]
  }

  // Auto-sync any Quotations that exist in localStorage but are missing from Enquiries list
  try {
    const rawQtn = localStorage.getItem('trufocus_crm_quotations_v1')
    if (rawQtn) {
      const qtns = JSON.parse(rawQtn)
      if (Array.isArray(qtns)) {
        let added = false
        qtns.forEach((q: any) => {
          const seqStr = q.quotation_number ? q.quotation_number.replace(/\D/g, '').slice(-3) : '001'
          const expectedEnqNo = q.enquiry_number || `ENQ-${new Date().getFullYear()}-${seqStr}`

          const exists = list.some(
            (e) =>
              (q.enquiry_id && e.id === q.enquiry_id) ||
              (q.enquiry_number && e.enquiry_number.toUpperCase() === q.enquiry_number.toUpperCase()) ||
              (q.quotation_number && e.quotation_number === q.quotation_number) ||
              (expectedEnqNo && e.enquiry_number.toUpperCase() === expectedEnqNo.toUpperCase()) ||
              (q.id && e.quotation_id === q.id)
          )

          if (!exists && q.quotation_number) {
            const statusMap: Record<string, any> = {
              accepted: 'booked',
              rejected: 'rejected',
              sent: 'quotation_sent',
              change_requested: 'customer_reviewing',
              viewed: 'customer_reviewing',
            }

            const synthEnquiry: Enquiry = {
              id: q.enquiry_id || `enq-${q.id || Date.now()}`,
              enquiry_number: expectedEnqNo,
              customer_name: q.customer_name || 'Client',
              mobile: q.mobile || '+91 98765 43210',
              alternate_mobile: null,
              email: q.email || null,
              event_type: (q.event_type?.toLowerCase().includes('wedding') ? 'wedding' : 'wedding') as any,
              event_date: q.events?.[0]?.event_date || null,
              event_time: q.events?.[0]?.event_time || null,
              venue: q.events?.[0]?.venue || null,
              location: null,
              budget: q.final_amount || q.package_amount || 85000,
              source: 'website',
              status: statusMap[q.status] || 'quotation_sent',
              assigned_to: 'usr-admin',
              notes: `[Quotation ${q.quotation_number}]: Auto-synced proposal`,
              preferred_contact_method: 'whatsapp',
              quotation_id: q.id,
              quotation_number: q.quotation_number,
              quotation_status: q.status,
              created_at: q.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              created_by: 'usr-admin',
              deleted_at: null,
            }
            list.unshift(synthEnquiry)
            added = true
          }
        })
        if (added) {
          list = deduplicateEnquiries(list)
          saveLocalEnquiries(list)
        }
      }
    }
  } catch (e) {
    console.warn('[Enquiries] Error syncing quotation entries into enquiries:', e)
  }

  const cleanList = deduplicateEnquiries(list)
  if (cleanList.length !== list.length) {
    saveLocalEnquiries(cleanList)
  }

  return cleanList
}

export function saveLocalEnquiries(enquiries: Enquiry[]): void {
  const deduped = deduplicateEnquiries(enquiries)
  try {
    localStorage.setItem(LOCAL_STORAGE_ENQ_KEY, JSON.stringify(deduped))
    pushEntityToCloud('enquiries', 'main', deduped)
  } catch (e) {
    console.error('Failed saving local enquiries', e)
  }
}

// ─── Date Range Boundaries ───────────────────────────────────────────────────

function getDateRange(range: EnquiryFilters['date_range']): { from: string; to: string } | null {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (range) {
    case 'today':
      return { from: today.toISOString(), to: new Date(today.getTime() + 86400000).toISOString() }
    case 'yesterday': {
      const y = new Date(today.getTime() - 86400000)
      return { from: y.toISOString(), to: today.toISOString() }
    }
    case 'this_week': {
      const day = today.getDay()
      const weekStart = new Date(today.getTime() - day * 86400000)
      return { from: weekStart.toISOString(), to: new Date().toISOString() }
    }
    case 'this_month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: monthStart.toISOString(), to: new Date().toISOString() }
    }
    default:
      return null
  }
}

// ─── Fetch Enquiries ──────────────────────────────────────────────────────────

export async function fetchEnquiries(
  filters: EnquiryFilters,
  sort: SortConfig,
  page: number,
  pageSize: number
): Promise<PaginatedResult<Enquiry>> {
  // 1. Try Supabase first if available
  try {
    const { data, error, count } = await supabase
      .from(TABLE)
      .select('*, assigned_to_profile:profiles!enquiries_assigned_to_fkey(full_name)', { count: 'exact' })
      .is('deleted_at', null)

    if (!error && data && data.length > 0) {
      let items: Enquiry[] = data.map((row: any) => ({
        ...row,
        assigned_to_name: (row.assigned_to_profile as { full_name: string } | null)?.full_name ?? null,
        assigned_to_profile: undefined,
      }))

      // Apply Filters
      if (filters.search.trim()) {
        const s = filters.search.trim().toLowerCase()
        items = items.filter(e =>
          e.customer_name.toLowerCase().includes(s) ||
          e.mobile.toLowerCase().includes(s) ||
          (e.email && e.email.toLowerCase().includes(s)) ||
          (e.location && e.location.toLowerCase().includes(s)) ||
          e.enquiry_number.toLowerCase().includes(s)
        )
      }
      if (filters.status !== 'all') items = items.filter(e => e.status === filters.status)
      if (filters.source !== 'all') items = items.filter(e => e.source === filters.source)
      if (filters.event_type !== 'all') items = items.filter(e => e.event_type === filters.event_type)

      const total = count ?? items.length
      const from = (page - 1) * pageSize
      const paginatedItems = items.slice(from, from + pageSize)

      return {
        items: paginatedItems,
        meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      }
    }
  } catch (e) {
    console.warn('[Enquiries] Supabase fetch error or table not ready, using local store:', e)
  }

  // 2. Local Central Database Fallback
  let all = fetchEnquiriesLocal().filter(e => !e.deleted_at)

  // Filter: Search
  if (filters.search.trim()) {
    const s = filters.search.trim().toLowerCase()
    all = all.filter(e =>
      e.customer_name.toLowerCase().includes(s) ||
      e.mobile.toLowerCase().includes(s) ||
      (e.email && e.email.toLowerCase().includes(s)) ||
      (e.location && e.location.toLowerCase().includes(s)) ||
      e.enquiry_number.toLowerCase().includes(s)
    )
  }

  // Filter: Status
  if (filters.status !== 'all') {
    all = all.filter(e => e.status === filters.status)
  }

  // Filter: Source
  if (filters.source !== 'all') {
    all = all.filter(e => e.source === filters.source)
  }

  // Filter: Event Type
  if (filters.event_type !== 'all') {
    all = all.filter(e => e.event_type === filters.event_type)
  }

  // Filter: Date Range
  if (filters.date_range !== 'all') {
    const range = getDateRange(filters.date_range)
    if (range) {
      all = all.filter(e => e.created_at >= range.from && e.created_at <= range.to)
    }
  }

  // Sorting
  all.sort((a, b) => {
    const valA = (a as any)[sort.field] ?? ''
    const valB = (b as any)[sort.field] ?? ''
    if (sort.direction === 'asc') return valA > valB ? 1 : -1
    return valA < valB ? 1 : -1
  })

  // Pagination
  const total = all.length
  const from = (page - 1) * pageSize
  const items = all.slice(from, from + pageSize)

  return {
    items,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  }
}

// ─── Create Enquiry ───────────────────────────────────────────────────────────

export async function createEnquiry(
  form: EnquiryFormData,
  userId: string
): Promise<ApiResponse<Enquiry>> {
  const existing = fetchEnquiriesLocal()

  // Check for duplicate mobile
  const duplicate = existing.find(e => e.mobile.replace(/\D/g, '') === form.mobile.replace(/\D/g, '') && !e.deleted_at)
  if (duplicate) {
    return {
      data: null,
      error: `An enquiry already exists for this mobile number (${duplicate.enquiry_number}).`,
    }
  }

  // Sequential Enquiry Number
  const year = new Date().getFullYear()
  let maxNum = 0
  existing.forEach(e => {
    const match = e.enquiry_number.match(/ENQ-\d+-(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num) && num > maxNum) maxNum = num
    }
  })
  const nextNum = maxNum + 1
  const seqStr = nextNum.toString().padStart(4, '0')
  const enquiryNumber = `ENQ-${year}-${seqStr}`
  const now = new Date().toISOString()

  const newEntry: Enquiry = {
    id: `enq-${Date.now()}`,
    enquiry_number: enquiryNumber,
    customer_name: form.customer_name.trim(),
    mobile: form.mobile.trim(),
    alternate_mobile: form.alternate_mobile?.trim() || null,
    email: form.email?.trim() || null,
    event_type: form.event_type || 'wedding',
    event_date: form.event_date || null,
    event_time: form.event_time || null,
    venue: form.venue?.trim() || null,
    location: form.location?.trim() || null,
    budget: form.budget ? parseFloat(form.budget) : null,
    source: form.source || 'manual_entry',
    status: form.status || 'new',
    assigned_to: form.assigned_to || null,
    assigned_to_name: 'Unassigned',
    notes: form.notes?.trim() || null,
    preferred_contact_method: form.preferred_contact_method || 'whatsapp',
    deleted_at: null,
    created_by: userId,
    created_at: now,
    updated_at: now,
  }

  const updatedList = [newEntry, ...existing]
  saveLocalEnquiries(updatedList)

  // Attempt Supabase insert in background
  try {
    await supabase.from(TABLE).insert(newEntry)
  } catch (e) {
    console.warn('Background Supabase insert skipped:', e)
  }

  return { data: newEntry, error: null }
}

// ─── Update Enquiry ───────────────────────────────────────────────────────────

export async function updateEnquiry(
  id: string,
  form: Partial<EnquiryFormData> | Partial<Enquiry>
): Promise<ApiResponse<Enquiry>> {
  const existing = fetchEnquiriesLocal()
  const target = existing.find(e => e.id === id)

  if (!target) {
    return { data: null, error: 'Enquiry not found' }
  }

  const updatedWO: Enquiry = {
    ...target,
    ...form,
    customer_name: form.customer_name !== undefined ? form.customer_name.trim() : target.customer_name,
    mobile: form.mobile !== undefined ? form.mobile.trim() : target.mobile,
    email: form.email !== undefined ? (form.email ? form.email.trim() : null) : target.email,
    event_type: (form.event_type ? form.event_type : target.event_type) as any,
    source: (form.source ? form.source : target.source) as any,
    event_date: form.event_date !== undefined ? form.event_date : target.event_date,
    venue: form.venue !== undefined ? (form.venue ? form.venue.trim() : null) : target.venue,
    location: form.location !== undefined ? (form.location ? form.location.trim() : null) : target.location,
    budget: form.budget !== undefined ? (typeof form.budget === 'number' ? form.budget : (form.budget ? parseFloat(String(form.budget)) : null)) : target.budget,
    status: form.status !== undefined ? form.status : target.status,
    notes: form.notes !== undefined ? (form.notes ? form.notes.trim() : null) : target.notes,
    updated_at: new Date().toISOString(),
  }

  const updatedList = existing.map(e => e.id === id ? updatedWO : e)
  saveLocalEnquiries(updatedList)

  try {
    await supabase.from(TABLE).update(updatedWO).eq('id', id)
  } catch (e) {
    console.warn('Background Supabase update skipped:', e)
  }

  return { data: updatedWO, error: null }
}

import { logLoginAudit } from '@/services/employeeService'

// ─── Delete & Restore Enquiry ──────────────────────────────────────────────────

export function softDeleteEnquiry(
  id: string,
  deletedBy = 'Admin',
  reason = ''
): { success: boolean; message: string; isConverted?: boolean; workOrderNumber?: string } {
  if (!canUserPerformDelete('enquiries')) {
    logAIPermissionAudit({
      user_id: 'usr-security',
      user_name: deletedBy,
      role: 'Restricted',
      module: 'enquiries',
      requested_action: 'delete',
      prompt_text: `Attempted delete Enquiry ${id}`,
      allowed: false,
      reason: "Permission Denied: Only Owner and Administrator can delete Enquiries.",
    })
    return {
      success: false,
      message: "Permission Denied: You don't have permission to delete Enquiries. Please contact an Administrator or Owner.",
    }
  }

  const existing = fetchEnquiriesLocal()
  const targetIndex = existing.findIndex((e) => e.id === id || e.enquiry_number === id)

  if (targetIndex === -1) {
    return { success: false, message: 'Enquiry not found.' }
  }

  const enq = existing[targetIndex]

  // Converted Enquiry Protection
  if (enq.converted_to_work_order || enq.work_order_id || enq.status === 'converted') {
    const woNum = enq.work_order_number || 'WO-2025-614'
    return {
      success: false,
      isConverted: true,
      workOrderNumber: woNum,
      message: `This enquiry has already been converted into Work Order ${woNum} and cannot be deleted.`,
    }
  }

  const now = new Date().toISOString()
  enq.deleted_at = now
  enq.status = 'deleted'
  enq.deleted_by = deletedBy
  enq.delete_reason = reason

  existing[targetIndex] = enq

  try {
    saveLocalEnquiries(existing)
    window.dispatchEvent(new CustomEvent('enquiriesUpdated'))
    logLoginAudit(
      'Enquiry Deleted',
      deletedBy,
      enq.enquiry_number,
      `Soft deleted enquiry ${enq.enquiry_number} for customer '${enq.customer_name}'. Reason: ${reason || 'N/A'}`
    )
  } catch (e) {
    console.error('Error soft deleting enquiry:', e)
  }

  return { success: true, message: `🗑 Enquiry ${enq.enquiry_number} has been soft deleted.` }
}

export function restoreEnquiry(
  id: string,
  restoredBy = 'Admin'
): { success: boolean; message: string } {
  const existing = fetchEnquiriesLocal()
  const targetIndex = existing.findIndex((e) => e.id === id || e.enquiry_number === id)

  if (targetIndex === -1) {
    return { success: false, message: 'Enquiry not found.' }
  }

  const enq = existing[targetIndex]
  enq.deleted_at = null
  enq.status = 'new'
  delete enq.deleted_by
  delete enq.delete_reason

  existing[targetIndex] = enq

  try {
    saveLocalEnquiries(existing)
    window.dispatchEvent(new CustomEvent('enquiriesUpdated'))
    logLoginAudit(
      'Enquiry Restored',
      restoredBy,
      enq.enquiry_number,
      `Restored enquiry ${enq.enquiry_number} (${enq.customer_name}) from Trash`
    )
  } catch (e) {
    console.error('Error restoring enquiry:', e)
  }

  return { success: true, message: `↺ Enquiry ${enq.enquiry_number} has been restored!` }
}

export function hardDeleteEnquiry(
  id: string,
  deletedBy = 'Admin'
): { success: boolean; message: string } {
  if (!canUserPerformDelete('enquiries')) {
    logAIPermissionAudit({
      user_id: 'usr-security',
      user_name: deletedBy,
      role: 'Restricted',
      module: 'enquiries',
      requested_action: 'delete',
      prompt_text: `Attempted hard delete Enquiry ${id}`,
      allowed: false,
      reason: "Permission Denied: Only Owner and Administrator can delete Enquiries.",
    })
    return {
      success: false,
      message: "Permission Denied: You don't have permission to delete Enquiries. Please contact an Administrator or Owner.",
    }
  }

  const existing = fetchEnquiriesLocal()
  const target = existing.find((e) => e.id === id || e.enquiry_number === id)

  if (!target) {
    return { success: false, message: 'Enquiry not found.' }
  }

  const updatedList = existing.filter((e) => e.id !== id && e.enquiry_number !== id)

  try {
    saveLocalEnquiries(updatedList)
    window.dispatchEvent(new CustomEvent('enquiriesUpdated'))
    logLoginAudit(
      'Enquiry Permanently Deleted',
      deletedBy,
      target.enquiry_number,
      `Permanently hard-deleted enquiry ${target.enquiry_number} (${target.customer_name})`
    )
  } catch (e) {
    console.error('Error hard deleting enquiry:', e)
  }

  return { success: true, message: `❌ Permanently deleted enquiry ${target.enquiry_number}.` }
}

export function fetchDeletedEnquiries(): Enquiry[] {
  return fetchEnquiriesLocal().filter((e) => e.deleted_at !== null || e.status === 'deleted')
}

export async function deleteEnquiry(id: string): Promise<ApiResponse<null>> {
  softDeleteEnquiry(id, 'Admin')
  return { data: null, error: null }
}

// ─── Export CSV Helpers ───────────────────────────────────────────────────────

export function exportToCSV(enquiries: Enquiry[]): string {
  const headers = [
    'Enquiry No', 'Customer Name', 'Mobile', 'Email', 'Event Type',
    'Event Date', 'Location', 'Budget', 'Source', 'Status',
    'Assigned To', 'Received Date',
  ]

  const rows = enquiries.map((e) => [
    e.enquiry_number,
    e.customer_name,
    e.mobile,
    e.email ?? '',
    e.event_type,
    e.event_date ?? '',
    e.location ?? '',
    e.budget?.toString() ?? '',
    e.source,
    e.status,
    e.assigned_to_name ?? '',
    new Date(e.created_at).toLocaleDateString(),
  ])

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
