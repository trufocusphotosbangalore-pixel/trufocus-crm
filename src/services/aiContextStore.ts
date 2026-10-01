import { loadBusinessProfile } from './businessProfileStore'
import { getLocalWorkOrders } from './supabase/workOrders'
import { fetchEnquiriesLocal } from './supabase/enquiries'
import { getTeamMembers } from './teamStore'
import { loadSettingsFromStorage } from './settingsStore'
import { getPayments } from './financeStore'

export function getCRMContextSummary(): string {
  try {
    const biz = loadBusinessProfile()
    const workOrders = getLocalWorkOrders()
    const enquiries = fetchEnquiriesLocal()
    const team = getTeamMembers()
    const settings = loadSettingsFromStorage()
    const payments = getPayments()

    const activeWorkOrders = workOrders.filter((w) => w.status !== 'completed' && w.status !== 'cancelled')
    const activeEnquiries = enquiries.filter((e) => e.status !== 'converted' && e.status !== 'lost' && e.status !== 'rejected')

    const summaryParts: string[] = []

    // 1. Business Profile
    summaryParts.push(
      `BUSINESS PROFILE:\nName: ${biz.business_name || 'Trufocus Photography'}\nTagline: ${biz.tagline || 'Your Event, Online and On Point.'}\nPhone: ${biz.primary_mobile}\nEmail: ${biz.email}\nWebsite: ${biz.website}\nAddress: ${biz.city}, ${biz.state}\nGST: ${biz.gst_number || 'N/A'}`
    )

    // 2. Active Work Orders Summary
    summaryParts.push(
      `WORK ORDERS (${activeWorkOrders.length} Active / ${workOrders.length} Total):\n` +
      activeWorkOrders
        .slice(0, 8)
        .map(
          (w) =>
            `- [${w.work_order_number}] Client: ${w.customer_name} | Project: ${w.project_name} | Type: ${w.event_type} | Status: ${w.status} | Net: ₹${w.payment?.net_amount || 0} | Balance: ₹${w.payment?.balance_amount || 0}`
        )
        .join('\n')
    )

    // 3. Active Enquiries
    summaryParts.push(
      `ENQUIRIES (${activeEnquiries.length} Active Pending / ${enquiries.length} Total):\n` +
      activeEnquiries
        .slice(0, 8)
        .map(
          (e: any) =>
            `- [${e.enquiry_number}] ${e.customer_name} (${e.mobile}) | Event: ${e.event_type} | Date: ${e.event_date || 'TBD'} | Budget: ${e.budget_tier || 'N/A'} | Status: ${e.status}`
        )
        .join('\n')
    )

    // 4. Team Members & Roles
    summaryParts.push(
      `TEAM MEMBERS (${team.length} Staff):\n` +
      team
        .map(
          (t: any) =>
            `- ${t.full_name} (${t.job_role || (t.job_roles && t.job_roles[0]) || 'Staff'}, ${t.department || 'Production'}) - Phone: ${t.phone || t.mobile || t.whatsapp_number || 'N/A'}`
        )
        .join('\n')
    )

    // 5. Active Master Services & Deliverables
    const activeServicesList = settings.services.filter((s) => s.is_active).map((s) => s.name).join(', ')
    const activeDeliverablesList = settings.deliverables.filter((d) => d.is_active).map((d) => d.name).join(', ')
    summaryParts.push(
      `MASTER SERVICES: ${activeServicesList}\nMASTER DELIVERABLES: ${activeDeliverablesList}`
    )

    // 6. Finances Summary
    summaryParts.push(
      `FINANCES OVERVIEW:\nTotal Payments Tracked: ${payments.length} ledger items\nRecent Transactions: ${payments.slice(0, 5).map((p: any) => `₹${p.amount} (${p.payment_mode}) for ${p.customer_name}`).join('; ')}`
    )

    // 7. Document Attachments
    try {
      const rawDocs = localStorage.getItem('trufocus_crm_documents_v1')
      if (rawDocs) {
        const docs = JSON.parse(rawDocs)
        summaryParts.push(
          `UPLOADED CRM DOCUMENTS & ATTACHMENTS (${docs.length} Files):\n` +
          docs
            .slice(0, 10)
            .map(
              (d: any) =>
                `- File: "${d.file_name}" | Category: ${d.category} | Related WO: ${d.related_number || d.related_id} | Uploaded by: ${d.uploaded_by} | Size: ${(d.file_size / 1024).toFixed(0)} KB | Notes: ${d.notes || 'N/A'}`
            )
            .join('\n')
        )
      }
    } catch {
      // ignore
    }

    return summaryParts.join('\n\n')
  } catch (e: any) {
    console.error('Error compiling CRM context:', e)
    return 'CRM Context unavailable.'
  }
}
