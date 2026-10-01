import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { WorkOrder } from '@/types/workOrders'
import { loadBusinessProfile } from './businessProfileStore'
import { saveStoredPDFRecord, getLatestPDFVersion } from './pdfStorageService'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'

export type DocumentType = 'quotation' | 'invoice' | 'receipt'

export interface PDFGeneratorOptions {
  receiptNumber?: string
  receiptAmount?: number
  paymentMode?: string
  transactionId?: string
  receivedBy?: string
  version?: number
}

/**
 * Builds HTML template string for document (Quotation Proposal, Invoice, or Receipt)
 */
export function buildDocumentHTML(
  type: DocumentType,
  wo: WorkOrder,
  options?: PDFGeneratorOptions
): string {
  const profile = loadBusinessProfile()
  const todayDate = formatDate(new Date().toISOString())
  const cleanWoNo = wo.work_order_number || 'WO-2025-614'

  const packageAmount = typeof wo.payment?.package_amount === 'number'
    ? wo.payment.package_amount
    : parseFloat(wo.payment?.package_amount || '0') || 150000

  const discountAmount = typeof wo.payment?.discount_amount === 'number'
    ? wo.payment.discount_amount
    : parseFloat(wo.payment?.discount_amount || '0') || 0

  const subtotal = Math.max(0, packageAmount - discountAmount)
  const isGstApplicable = wo.payment?.gst_applicable ?? false
  const gstRate = isGstApplicable ? (wo.payment?.gst_percent ?? profile.gst_percentage ?? 18) : 0
  const gstAmount = isGstApplicable ? Math.round((subtotal * gstRate) / 100) : 0
  const grandTotal = subtotal + gstAmount

  const amountPaid = (wo.payment?.ledger || []).reduce(
    (sum, item) => sum + (parseFloat(String(item.amount)) || 0),
    0
  ) || options?.receiptAmount || (wo.payment_status === 'fully_paid' ? grandTotal : 15000)

  const balanceDue = Math.max(0, grandTotal - amountPaid)
  const primaryColor = profile.primary_color || '#5B3FD9'

  let docTitle = ''
  let docNumber = ''

  if (type === 'quotation') {
    docTitle = 'OFFICIAL QUOTATION & PROPOSAL'
    docNumber = `${profile.quotation_prefix || 'QT-'}${cleanWoNo.replace(/\D/g, '') || '2025-614'}`
  } else if (type === 'invoice') {
    docTitle = 'TAX INVOICE'
    docNumber = `${profile.invoice_prefix || 'INV-'}${cleanWoNo.replace(/\D/g, '') || '2025-614'}`
  } else {
    docTitle = 'PAYMENT RECEIPT'
    docNumber = options?.receiptNumber || `${profile.receipt_prefix || 'RCPT-'}${Math.floor(1000 + Math.random() * 9000)}`
  }

  // ─── Dynamic Extraction for Events ───
  const eventsList = (wo.events && wo.events.length > 0)
    ? wo.events.map((e) => ({
        name: (e as any).name || e.event_type_name || wo.event_type || 'Main Event',
        event_date: e.event_date || wo.booking_date || new Date().toISOString().split('T')[0],
        time: (e as any).time || e.event_time || '6:00 PM – 11:00 PM',
        venue: e.venue || wo.venue || 'Indiranagar Grand Residency',
      }))
    : [
        {
          name: wo.event_type || 'Wedding & Reception Shoot',
          event_date: wo.booking_date || new Date().toISOString().split('T')[0],
          time: '6:00 PM – 11:00 PM',
          venue: wo.venue || 'Indiranagar Grand Residency',
        },
      ]

  // ─── Dynamic Extraction for Services ───
  const rawServices = (wo.events || []).flatMap((e) => e.services || [])
  const servicesList = rawServices.length > 0
    ? rawServices.map((s) => ({
        title: `${s.service_name || 'Photography Service'} (${s.quantity || 1} Staff)`,
        desc: s.remarks || 'Professional coverage & equipment',
      }))
    : [
        { title: 'Traditional Photography', desc: '1 Main Lead Photographer' },
        { title: 'Candid Photography', desc: '2 Senior Candid Photographers' },
        { title: 'Traditional Videography', desc: '1 Main Lead Videographer' },
        { title: 'Candid Cinematography', desc: '1 Senior Cinematographer' },
        { title: 'Drone Aerial Coverage', desc: '4K Aerial Drone Operator' },
        { title: 'Live Streaming & Spot Mixing', desc: 'Full HD Live Stream Setup' },
      ]

  // ─── Dynamic Extraction for Deliverables ───
  const rawDeliverables = wo.deliverables || []
  const deliverablesList = rawDeliverables.length > 0
    ? rawDeliverables.map((d) => ({
        title: d.name || 'Deliverable Item',
        specs: d.notes || (d.due_date ? `Due Date: ${d.due_date}` : 'High Quality Output'),
      }))
    : [
        { title: 'Unlimited High Resolution Photos', specs: 'Color graded JPEG & RAW formats' },
        { title: '150 Premium Edited Photos', specs: 'Skin retouching & magazine style finish' },
        { title: 'Cinematic Highlight Film (4–5 Minutes)', specs: '4K Ultra HD resolution' },
        { title: 'Full Length Wedding Film', specs: 'Multi-cam edit with audio' },
        { title: 'Instagram Teaser Reel (30 Seconds)', specs: 'Optimized 9:16 vertical video' },
        { title: 'Premium Photo Album (30 Sheets)', specs: 'Flush mount leatherette finish' },
        { title: 'Online Customer Gallery', specs: '6 Months cloud validity' },
        { title: 'Raw Data Drive Delivery', specs: 'Portable SSD / Hard Disk' },
      ]

  // ─── Dynamic Extraction for Payment Schedule ───
  const paymentSchedule = [
    {
      installment: 'Booking Advance',
      dueDate: wo.created_at ? formatDate(wo.created_at) : 'Today',
      amount: Math.round(grandTotal * 0.2),
      status: amountPaid >= Math.round(grandTotal * 0.2) ? 'Received' : 'Pending',
    },
    {
      installment: 'Before Event Shoot',
      dueDate: eventsList[0]?.event_date ? formatDate(eventsList[0].event_date) : 'Before Event',
      amount: Math.round(grandTotal * 0.4),
      status: amountPaid >= Math.round(grandTotal * 0.6) ? 'Received' : 'Pending',
    },
    {
      installment: 'Main Event Day',
      dueDate: eventsList[0]?.event_date ? formatDate(eventsList[0].event_date) : 'Event Day',
      amount: Math.round(grandTotal * 0.3),
      status: amountPaid >= Math.round(grandTotal * 0.9) ? 'Received' : 'Pending',
    },
    {
      installment: 'Final Media Delivery',
      dueDate: wo.final_delivery_date ? formatDate(wo.final_delivery_date) : 'Delivery Date',
      amount: Math.round(grandTotal * 0.1),
      status: amountPaid >= grandTotal ? 'Received' : 'Pending',
    },
  ]

  const brandName = profile.brand_name || profile.business_name || 'Trufocus Photos'
  const parentLine = profile.parent_company_line || 'A Brand of Chaaya AI Technologies Private Limited'
  const legalName = profile.legal_company_name || 'Chaaya AI Technologies Private Limited'

  // ─── IF QUOTATION: RENDER PREMIUM WEDDING & EVENT PROPOSAL ───
  if (type === 'quotation') {
    return `
    <div id="pdf-document-root" style="width: 780px; padding: 40px; background: #ffffff; color: #1e293b; font-family: 'Inter', system-ui, -apple-system, sans-serif; box-sizing: border-box;">
      <!-- Cover Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${primaryColor}; padding-bottom: 24px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          ${
            profile.logo_url && profile.logo_url.trim().length > 0
              ? `<img src="${profile.logo_url}" alt="Logo" style="max-height: 60px; max-width: 180px; object-fit: contain;" />`
              : ''
          }
          <div>
            <div style="font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase;">${brandName}</div>
            <div style="font-size: 11px; color: ${primaryColor}; font-weight: 700; margin-top: 2px;">${parentLine}</div>
          </div>
        </div>

        <div style="text-align: right;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #ffffff; background: ${primaryColor}; padding: 6px 14px; border-radius: 10px; display: inline-block; margin-bottom: 6px; letter-spacing: 0.5px; box-shadow: 0 2px 8px ${primaryColor}40;">
            ${docTitle}
          </div>
          <div style="font-size: 16px; font-weight: 900; font-family: monospace; color: #0f172a;">${docNumber}</div>
          <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 2px;">Date: ${todayDate}</div>
        </div>
      </div>

      <!-- Business Details (Left) & Customer Details (Right) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
        <!-- Left: Studio Details -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${primaryColor}; margin-bottom: 8px; letter-spacing: 0.5px;">Studio & Legal Information</div>
          <div style="font-size: 14px; font-weight: 900; color: #0f172a;">${brandName}</div>
          <div style="font-size: 11px; font-weight: 700; color: ${primaryColor}; margin-bottom: 6px;">${parentLine}</div>
          <div style="font-size: 11px; color: #475569; line-height: 1.6;">
            <strong>Legal Co:</strong> ${legalName}<br/>
            📍 ${profile.address_line_1 || 'Studio Premises'}, ${profile.city || 'Bangalore'} ${profile.pincode || ''}<br/>
            <strong>GSTIN:</strong> ${profile.gst_number || '29AAAAA0000A1Z5'}<br/>
            📞 <strong>Helpline:</strong> ${profile.primary_mobile || '+91 98765 43210'}<br/>
            ✉ <strong>Email:</strong> ${profile.email || 'contact@trufocusphotos.com'}
          </div>
        </div>

        <!-- Right: Client Details -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${primaryColor}; margin-bottom: 8px; letter-spacing: 0.5px;">Client & Event Details</div>
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">${wo.customer_name}</div>
          <div style="font-size: 11px; color: #475569; line-height: 1.6;">
            <strong>Project:</strong> ${wo.project_name}<br/>
            <strong>Work Order #:</strong> <span style="font-family: monospace; font-weight: 700; color: ${primaryColor};">${cleanWoNo}</span><br/>
            📞 <strong>Mobile:</strong> ${wo.mobile}<br/>
            🎉 <strong>Event Type:</strong> ${wo.event_type} (${wo.city || 'Bangalore'})<br/>
            📅 <strong>Event Date:</strong> ${eventsList[0]?.event_date ? formatDate(eventsList[0].event_date) : todayDate}<br/>
            📍 <strong>Venue:</strong> ${wo.venue || 'Indiranagar Grand Residency'}
          </div>
        </div>
      </div>

      <!-- Package Summary Card -->
      <div style="background: linear-gradient(135deg, ${primaryColor}0D, #f8fafc); border: 2px solid ${primaryColor}30; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: ${primaryColor}; margin-bottom: 12px; letter-spacing: 0.5px;">
          💎 ${wo.event_type} Photography Package Summary
        </div>

        <div style="display: grid; grid-template-columns: repeat(${isGstApplicable ? 4 : 3}, 1fr); gap: 12px; margin-bottom: 14px;">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Package Price</div>
            <div style="font-size: 14px; font-weight: 800; font-family: monospace; color: #0f172a; margin-top: 4px;">${formatCurrency(packageAmount, 'INR')}</div>
          </div>

          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Discount</div>
            <div style="font-size: 14px; font-weight: 800; font-family: monospace; color: #dc2626; margin-top: 4px;">${discountAmount > 0 ? '- ' + formatCurrency(discountAmount, 'INR') : '₹0'}</div>
          </div>

          ${
            isGstApplicable
              ? `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">GST (${gstRate}%)</div>
            <div style="font-size: 14px; font-weight: 800; font-family: monospace; color: #475569; margin-top: 4px;">${formatCurrency(gstAmount, 'INR')}</div>
          </div>
          `
              : ''
          }

          <div style="background: ${primaryColor}15; border: 1.5px solid ${primaryColor}; border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; font-weight: 800; color: ${primaryColor}; text-transform: uppercase;">Grand Total</div>
            <div style="font-size: 15px; font-weight: 900; font-family: monospace; color: ${primaryColor}; margin-top: 4px;">${formatCurrency(grandTotal, 'INR')}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 800; color: #065f46;">✔ Advance Received:</span>
            <span style="font-size: 14px; font-weight: 900; font-family: monospace; color: #10B981;">${formatCurrency(amountPaid, 'INR')}</span>
          </div>

          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 800; color: #991b1b;">⚠ Balance Due:</span>
            <span style="font-size: 14px; font-weight: 900; font-family: monospace; color: #EF4444;">${formatCurrency(balanceDue, 'INR')}</span>
          </div>
        </div>
      </div>

      <!-- Event Schedule Table -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
          📅 Event Shoot Schedule
        </div>
        <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background: #f1f5f9; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569; text-align: left;">
              <th style="padding: 10px 14px;">Event Name</th>
              <th style="padding: 10px 14px;">Date</th>
              <th style="padding: 10px 14px;">Time</th>
              <th style="padding: 10px 14px;">Venue Location</th>
            </tr>
          </thead>
          <tbody>
            ${eventsList
              .map(
                (ev) => `
              <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">${ev.name}</td>
                <td style="padding: 10px 14px; font-weight: 600; color: #334155;">${formatDate(ev.event_date)}</td>
                <td style="padding: 10px 14px; color: #475569;">${ev.time || 'Full Day Coverage'}</td>
                <td style="padding: 10px 14px; color: #475569;">${ev.venue || wo.venue || 'Indiranagar Grand Residency'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <!-- Services Included & Deliverables (2 Cols) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
        <!-- Services -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: ${primaryColor}; margin-bottom: 12px;">
            📷 Services Included
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${servicesList
              .map(
                (srv) => `
              <div style="display: flex; items-center: flex-start; gap: 8px; font-size: 11px; color: #334155;">
                <span style="color: #10b981; font-weight: 900;">✓</span>
                <div>
                  <strong style="color: #0f172a;">${srv.title}</strong><br/>
                  <span style="font-size: 10px; color: #64748b;">${srv.desc}</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Deliverables -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: ${primaryColor}; margin-bottom: 12px;">
            🎁 Package Deliverables
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${deliverablesList
              .map(
                (del) => `
              <div style="display: flex; items-center: flex-start; gap: 8px; font-size: 11px; color: #334155;">
                <span style="color: #10b981; font-weight: 900;">✓</span>
                <div>
                  <strong style="color: #0f172a;">${del.title}</strong><br/>
                  <span style="font-size: 10px; color: #64748b;">${del.specs}</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>

      <!-- Payment Schedule Table -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 10px;">
          💳 Payment Installment Schedule
        </div>
        <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background: #f1f5f9; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569; text-align: left;">
              <th style="padding: 10px 14px;">Installment Stage</th>
              <th style="padding: 10px 14px;">Due Date</th>
              <th style="padding: 10px 14px;">Amount</th>
              <th style="padding: 10px 14px; text-align: right;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${paymentSchedule
              .map(
                (ps) => `
              <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">${ps.installment}</td>
                <td style="padding: 10px 14px; color: #475569;">${ps.dueDate}</td>
                <td style="padding: 10px 14px; font-family: monospace; font-weight: 700; color: #0f172a;">${formatCurrency(ps.amount, 'INR')}</td>
                <td style="padding: 10px 14px; text-align: right;">
                  <span style="font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px; ${
                    ps.status === 'Received'
                      ? 'background: #ecfdf5; color: #059669;'
                      : 'background: #fef3c7; color: #b45309;'
                  }">
                    ${ps.status}
                  </span>
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <!-- Terms & Conditions -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 8px;">
          📜 Proposal Terms & Conditions
        </div>
        <div style="font-size: 10px; color: #475569; line-height: 1.6;">
          • Booking advance is required to lock event dates and is non-refundable upon date confirmation.<br/>
          • Final high-resolution edited media and albums will be delivered after full balance payment clearance.<br/>
          • Edited photos and cinematic highlight films will be delivered within the agreed studio timeline.<br/>
          • Online Customer Gallery is valid for 6 months from the initial publishing date.<br/>
          • Additional coverage hours or extra album sheet additions will be charged as per standard studio rates.
        </div>
      </div>

      <!-- Client Acceptance & Signatures -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; padding-top: 10px;">
        <div style="text-align: center; background: #f8fafc; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="border-bottom: 1px solid #cbd5e1; height: 30px; margin-bottom: 6px; font-size: 11px; font-weight: 700; color: #5B3FD9;">${profile.business_name}</div>
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Prepared By</div>
        </div>

        <div style="text-align: center; background: #f8fafc; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="border-bottom: 1px solid #cbd5e1; height: 30px; margin-bottom: 6px; font-size: 11px; font-weight: 700; color: #0f172a;">${profile.owner_name}</div>
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Approved By</div>
        </div>

        <div style="text-align: center; background: #f8fafc; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="border-bottom: 1px dashed #cbd5e1; height: 30px; margin-bottom: 6px; font-size: 11px; font-weight: 700; color: #64748b; font-style: italic;">${wo.customer_name}</div>
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Client Acceptance Signature</div>
        </div>
      </div>

      <!-- Bottom Assistance Contact Footer -->
      <div style="border-top: 2px solid ${primaryColor}; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #475569; font-weight: 600;">
        <div>Need Assistance? 📞 <strong>90711 14965</strong></div>
        <div>✉ <strong>info@trufocusphotos.com</strong></div>
        <div>🌐 <strong>www.trufocus.photos</strong></div>
        <div style="color: ${primaryColor}; font-weight: 800;">Instagram: @trufocus.photos</div>
      </div>
    </div>
    `
  }

  // ─── IF INVOICE OR RECEIPT: RENDER CLEAN TAX DOCUMENT ───
  return `
    <div id="pdf-document-root" style="width: 750px; padding: 36px; background: #ffffff; color: #1e293b; font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          ${
            profile.logo_url && profile.logo_url.trim().length > 0
              ? `<img src="${profile.logo_url}" alt="Logo" style="max-height: 50px; max-width: 160px; object-fit: contain;" />`
              : ''
          }
          <div>
            <div style="font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase;">${brandName}</div>
            <div style="font-size: 11px; font-weight: 700; color: ${primaryColor}; margin-top: 1px;">${parentLine}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: ${primaryColor}; background: ${primaryColor}15; padding: 4px 10px; border-radius: 8px; display: inline-block; margin-bottom: 6px;">${docTitle}</div>
          <div style="font-size: 16px; font-weight: 800; font-family: monospace; color: #0f172a;">${docNumber}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Date: ${todayDate}</div>
        </div>
      </div>

      <!-- Info Cards Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; letter-spacing: 0.5px;">Business & Legal Entity Details</div>
          <div style="font-size: 13px; font-weight: 900; color: #0f172a;">${brandName}</div>
          <div style="font-size: 11px; font-weight: 700; color: ${primaryColor}; margin-bottom: 4px;">${parentLine}</div>
          <div style="font-size: 11px; color: #475569; line-height: 1.5;">
            <strong>Legal Co:</strong> ${legalName}<br/>
            📍 ${profile.address_line_1 || 'Studio Premises'}, ${profile.city || 'Bangalore'} ${profile.pincode || ''}<br/>
            <strong>GSTIN:</strong> ${profile.gst_number || '29AAAAA0000A1Z5'} | <strong>PAN:</strong> ${profile.pan_number || 'AAAAA0000A'}<br/>
            <strong>Phone:</strong> ${profile.primary_mobile || '+91 98765 43210'} | <strong>Email:</strong> ${profile.email || 'contact@trufocusphotos.com'}
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; letter-spacing: 0.5px;">Customer Details (Bill To)</div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${wo.customer_name}</div>
          <div style="font-size: 11px; color: #475569; line-height: 1.5;">
            <strong>Project:</strong> ${wo.project_name}<br/>
            <strong>Work Order #:</strong> ${cleanWoNo}<br/>
            <strong>Mobile:</strong> ${wo.mobile}<br/>
            <strong>Event Type:</strong> ${wo.event_type} (${wo.city || 'Bangalore'})<br/>
            <strong>Venue:</strong> ${wo.venue || 'As per booking schedule'}
          </div>
        </div>
      </div>

      <!-- Details Table -->
      ${
        type === 'receipt'
          ? `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569;">
            <th style="padding: 10px 14px; text-align: left;">Receipt No</th>
            <th style="padding: 10px 14px; text-align: left;">Payment Mode</th>
            <th style="padding: 10px 14px; text-align: left;">Transaction ID</th>
            <th style="padding: 10px 14px; text-align: left;">Date</th>
            <th style="padding: 10px 14px; text-align: right;">Amount Received</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <td style="padding: 12px 14px; font-family: monospace; font-weight: 700;">${docNumber}</td>
            <td style="padding: 12px 14px;">${options?.paymentMode || 'UPI / Online'}</td>
            <td style="padding: 12px 14px; font-family: monospace;">${options?.transactionId || 'TXN-' + Math.floor(100000 + Math.random() * 900000)}</td>
            <td style="padding: 12px 14px;">${todayDate}</td>
            <td style="padding: 12px 14px; text-align: right; font-family: monospace; font-weight: 800; color: ${primaryColor}; font-size: 13px;">${formatCurrency(options?.receiptAmount || amountPaid, 'INR')}</td>
          </tr>
        </tbody>
      </table>
      `
          : `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569;">
            <th style="padding: 10px 14px; text-align: left;">Service / Deliverable Description</th>
            <th style="padding: 10px 14px; text-align: left;">Details</th>
            <th style="padding: 10px 14px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <td style="padding: 12px 14px;"><strong>${wo.event_type} Photography & Videography Package</strong></td>
            <td style="padding: 12px 14px;">High-resolution photography, cinematic teaser & raw data delivery</td>
            <td style="padding: 12px 14px; text-align: right; font-family: monospace; font-weight: 700;">${formatCurrency(packageAmount, 'INR')}</td>
          </tr>
          ${
            discountAmount > 0
              ? `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <td style="padding: 12px 14px;"><strong>Booking Discount</strong></td>
            <td style="padding: 12px 14px;">Promotional discount applied</td>
            <td style="padding: 12px 14px; text-align: right; font-family: monospace; color: #dc2626;">- ${formatCurrency(discountAmount, 'INR')}</td>
          </tr>
          `
              : ''
          }
        </tbody>
      </table>
      `
      }

      <!-- Totals Breakdown -->
      <div style="margin-left: auto; width: 280px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; color: #475569;">
          <span>Package Subtotal:</span>
          <span style="font-family: monospace; font-weight: 700;">${formatCurrency(subtotal, 'INR')}</span>
        </div>
        ${
          isGstApplicable
            ? `
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; color: #475569;">
          <span>GST (${gstRate}%):</span>
          <span style="font-family: monospace; font-weight: 700;">${formatCurrency(gstAmount, 'INR')}</span>
        </div>
        `
            : ''
        }
        <div style="display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; font-weight: 900; color: ${primaryColor}; border-top: 2px solid ${primaryColor}; border-bottom: 2px solid ${primaryColor}; margin-top: 4px;">
          <span>Total Amount:</span>
          <span style="font-family: monospace;">${formatCurrency(grandTotal, 'INR')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; color: #059669; font-weight: 700; margin-top: 4px;">
          <span>Amount Paid:</span>
          <span style="font-family: monospace;">${formatCurrency(amountPaid, 'INR')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; color: #dc2626; font-weight: 800;">
          <span>Balance Due:</span>
          <span style="font-family: monospace;">${formatCurrency(balanceDue, 'INR')}</span>
        </div>
      </div>

      <!-- Banking & UPI Details -->
      <div style="background: ${primaryColor}0D; border: 1px solid ${primaryColor}30; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <div style="font-weight: 800; color: ${primaryColor}; font-size: 11px; margin-bottom: 6px; text-transform: uppercase;">Bank Transfer & UPI Deposit Information</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; color: #334155;">
          <div><strong>Bank Name:</strong> ${profile.bank_name}</div>
          <div><strong>A/C Holder:</strong> ${profile.account_holder}</div>
          <div><strong>A/C Number:</strong> ${profile.account_number}</div>
          <div><strong>IFSC Code:</strong> ${profile.ifsc_code}</div>
          <div><strong>Branch:</strong> ${profile.branch}</div>
          <div><strong>UPI VPA ID:</strong> ${profile.upi_id}</div>
        </div>
      </div>

      <!-- Footer Signatures -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="font-size: 10px; color: #64748b; max-width: 450px; line-height: 1.4;">
          <strong>Terms & Conditions:</strong><br/>
          1. Booking deposit is non-refundable.<br/>
          2. Final high-resolution media will be delivered after full balance payment clearance.<br/>
          3. Subject to Bangalore jurisdiction. Thank you for choosing Trufocus Studio!
        </div>
        <div style="text-align: center; width: 160px;">
          <div style="border-bottom: 1px solid #94a3b8; height: 32px; margin-bottom: 6px;"></div>
          <div style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase;">Authorized Signatory<br/>${profile.business_name}</div>
        </div>
      </div>
    </div>
  `
}

/**
 * Validates a generated PDF Blob according to strict PDF standards (%PDF- header, size > 0)
 */
export async function validatePDFBlob(blob: Blob): Promise<boolean> {
  if (!blob || blob.size === 0) return false

  try {
    const buffer = await blob.slice(0, 10).arrayBuffer()
    const header = new TextDecoder('ascii').decode(buffer)
    return header.startsWith('%PDF-')
  } catch (e) {
    console.error('PDF validation failed:', e)
    return false
  }
}

/**
 * Generates a binary PDF Blob (%PDF-1.4) using html2canvas & jsPDF
 */
export async function generateBinaryPDFBlob(
  type: DocumentType,
  wo: WorkOrder,
  options?: PDFGeneratorOptions
): Promise<Blob> {
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '-9999px'
  container.innerHTML = buildDocumentHTML(type, wo, options)
  document.body.appendChild(container)

  try {
    const targetEl = container.querySelector('#pdf-document-root') as HTMLElement
    if (!targetEl) throw new Error('Target document element not found')

    // Wait for all images to complete loading before canvas snapshot
    const images = Array.from(targetEl.querySelectorAll('img'))
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth !== 0) {
              resolve()
            } else {
              img.onload = () => resolve()
              img.onerror = () => resolve()
            }
          })
      )
    )

    const canvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)

    const blob = pdf.output('blob')
    document.body.removeChild(container)

    return blob
  } catch (err) {
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
    throw err
  }
}

/**
 * Downloads a generated PDF document directly to browser
 */
export async function downloadDocumentPDF(
  type: DocumentType,
  wo: WorkOrder,
  options?: PDFGeneratorOptions
): Promise<void> {
  const loadingToast = toast.loading('Generating proposal PDF document...')

  try {
    const cleanWoNo = wo.work_order_number || 'WO-2025-614'
    const currentVersion = getLatestPDFVersion(cleanWoNo, type) + 1

    let fileName = ''
    let docNumber = ''

    if (type === 'quotation') {
      docNumber = `QT-${cleanWoNo.replace(/\D/g, '') || '2025-614'}`
      fileName = `Quotation-${cleanWoNo}.pdf`
    } else if (type === 'invoice') {
      docNumber = `INV-${cleanWoNo.replace(/\D/g, '') || '2025-614'}`
      fileName = `Invoice-${cleanWoNo}.pdf`
    } else {
      docNumber = options?.receiptNumber || `RCPT-${Math.floor(1000 + Math.random() * 9000)}`
      fileName = `Receipt-${docNumber}.pdf`
    }

    const pdfBlob = await generateBinaryPDFBlob(type, wo, { ...options, version: currentVersion })

    // Strict PDF Validation
    const isValid = await validatePDFBlob(pdfBlob)
    if (!isValid || pdfBlob.size === 0) {
      toast.dismiss(loadingToast)
      toast.error('Unable to generate PDF. Please try again.')
      return
    }

    // Save record to storage history
    saveStoredPDFRecord({
      type,
      work_order_id: wo.id,
      work_order_number: cleanWoNo,
      doc_number: docNumber,
      file_name: fileName,
      version: currentVersion,
    })

    // Trigger browser download
    const blobUrl = URL.createObjectURL(pdfBlob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000)

    toast.dismiss(loadingToast)
    toast.success(`🎉 Downloaded ${fileName}!`)
  } catch (err) {
    console.error('Error downloading PDF:', err)
    toast.dismiss(loadingToast)
    toast.error('Unable to generate PDF. Please try again.')
  }
}

/**
 * Previews a generated valid PDF document in a new browser tab
 */
export async function previewDocumentPDF(
  type: DocumentType,
  wo: WorkOrder,
  options?: PDFGeneratorOptions
): Promise<void> {
  const loadingToast = toast.loading('Preparing PDF proposal preview...')

  try {
    const pdfBlob = await generateBinaryPDFBlob(type, wo, options)

    // Strict PDF Validation
    const isValid = await validatePDFBlob(pdfBlob)
    if (!isValid || pdfBlob.size === 0) {
      toast.dismiss(loadingToast)
      toast.error('Unable to generate PDF. Please try again.')
      return
    }

    const blobUrl = URL.createObjectURL(pdfBlob)
    const win = window.open(blobUrl, '_blank')

    if (!win) {
      toast.dismiss(loadingToast)
      toast.error('Pop-up blocked. Please allow pop-ups to preview the PDF.')
      return
    }

    toast.dismiss(loadingToast)
    toast.success('Opened PDF proposal in new tab!')
  } catch (err) {
    console.error('Error previewing PDF:', err)
    toast.dismiss(loadingToast)
    toast.error('Unable to generate PDF. Please try again.')
  }
}
