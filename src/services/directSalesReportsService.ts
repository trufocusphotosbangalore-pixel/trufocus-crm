import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { getDirectSalesInvoices } from '@/services/directSalesStore'
import { loadBusinessProfile } from '@/services/businessProfileStore'
import { formatDate } from '@/lib/utils'
import type { DirectSalesFilter } from '@/types/directSales'

export type DirectSalesReportType =
  | 'summary'
  | 'customer_ledger'
  | 'finance_ledger'
  | 'gst'
  | 'daily'
  | 'monthly'
  | 'expose_vs_podcast'
  | 'outstanding'
  | 'profit'
  | 'item_wise'

export interface DirectSalesReportData {
  title: string
  subtitle: string
  headers: string[]
  rows: (string | number)[][]
  summary: Record<string, string | number>
}

function isWithinRange(dateStr?: string, startDate?: string, endDate?: string): boolean {
  if (!dateStr) return true
  const d = new Date(dateStr).getTime()
  if (startDate && d < new Date(startDate).getTime()) return false
  if (endDate && d > new Date(endDate).getTime() + 86400000) return false
  return true
}

export function generateDirectSalesReport(type: DirectSalesReportType, filter?: DirectSalesFilter): DirectSalesReportData {
  const invoices = getDirectSalesInvoices().filter((inv) => {
    if (!isWithinRange(inv.created_at, filter?.startDate, filter?.endDate)) return false
    if (filter?.orderType && filter.orderType !== 'all' && inv.order_type !== filter.orderType) return false
    if (filter?.paymentStatus && filter.paymentStatus !== 'all' && inv.payment_status !== filter.paymentStatus) return false
    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase()
      if (
        !inv.invoice_number.toLowerCase().includes(q) &&
        !inv.customer_name.toLowerCase().includes(q) &&
        !(inv.mobile || '').includes(q)
      ) {
        return false
      }
    }
    return true
  })

  switch (type) {
    case 'summary': {
      const rows = invoices.map((inv) => [
        inv.invoice_number,
        formatDate(inv.created_at),
        inv.order_type === 'podcast' ? 'Podcast' : 'Studio Expose',
        inv.customer_name,
        inv.payment_mode.toUpperCase(),
        inv.payment_status.toUpperCase(),
        `₹${inv.subtotal_amount.toLocaleString()}`,
        `₹${inv.gst_amount.toLocaleString()}`,
        `₹${inv.total_amount.toLocaleString()}`,
        `₹${inv.amount_paid.toLocaleString()}`,
        `₹${inv.balance_due.toLocaleString()}`,
      ])

      const totalRevenue = invoices.reduce((sum, i) => sum + i.amount_paid, 0)
      const totalBilled = invoices.reduce((sum, i) => sum + i.total_amount, 0)
      const totalOutstanding = invoices.reduce((sum, i) => sum + i.balance_due, 0)
      const totalGst = invoices.reduce((sum, i) => sum + i.gst_amount, 0)

      return {
        title: 'Direct Sales Summary Report',
        subtitle: `Total Invoices: ${invoices.length} | Period: ${filter?.startDate || 'All Time'} to ${filter?.endDate || 'Present'}`,
        headers: ['Invoice #', 'Date', 'Type', 'Customer', 'Mode', 'Status', 'Subtotal', 'GST', 'Grand Total', 'Paid', 'Balance'],
        rows,
        summary: {
          'Total Invoices': invoices.length,
          'Total Gross Billed': `₹${totalBilled.toLocaleString()}`,
          'Total Revenue Collected': `₹${totalRevenue.toLocaleString()}`,
          'Total GST Collected': `₹${totalGst.toLocaleString()}`,
          'Total Balance Due': `₹${totalOutstanding.toLocaleString()}`,
        },
      }
    }

    case 'customer_ledger': {
      const rows = invoices.map((inv) => [
        inv.customer_name,
        inv.mobile || '—',
        inv.invoice_number,
        formatDate(inv.created_at),
        `₹${inv.total_amount.toLocaleString()}`,
        `₹${inv.amount_paid.toLocaleString()}`,
        `₹${inv.balance_due.toLocaleString()}`,
        inv.payment_status.toUpperCase(),
      ])

      const totalPaid = invoices.reduce((sum, i) => sum + i.amount_paid, 0)
      const totalDue = invoices.reduce((sum, i) => sum + i.balance_due, 0)

      return {
        title: 'Direct Sales Customer Ledger',
        subtitle: `Customer Statements & Payment Status`,
        headers: ['Customer Name', 'Mobile', 'Invoice #', 'Date', 'Invoice Total', 'Amount Paid', 'Balance Due', 'Status'],
        rows,
        summary: {
          'Customers Billed': invoices.length,
          'Total Received': `₹${totalPaid.toLocaleString()}`,
          'Total Outstanding': `₹${totalDue.toLocaleString()}`,
        },
      }
    }

    case 'finance_ledger': {
      const rows = invoices.map((inv) => [
        formatDate(inv.created_at),
        `POS-${inv.invoice_number}`,
        inv.customer_name,
        inv.order_type === 'podcast' ? 'Podcast Direct Sale' : 'Studio Expose Direct Sale',
        inv.payment_mode.toUpperCase(),
        `₹${inv.amount_paid.toLocaleString()}`,
      ])

      const totalReceived = invoices.reduce((sum, i) => sum + i.amount_paid, 0)

      return {
        title: 'Direct Sales Finance Ledger (Money IN)',
        subtitle: `Single Source of Truth Payment Receipts`,
        headers: ['Date', 'Receipt / Ref #', 'Customer Name', 'Service Category', 'Payment Mode', 'Amount Received'],
        rows,
        summary: {
          'Total Sales Receipts': invoices.length,
          'Total Cash/Bank Inflow': `₹${totalReceived.toLocaleString()}`,
        },
      }
    }

    case 'gst': {
      const rows = invoices.map((inv) => [
        inv.invoice_number,
        formatDate(inv.created_at),
        inv.customer_name,
        inv.gst_number || 'B2C Retail',
        inv.is_gst_included ? 'Included (Inclusive)' : 'Added (Exclusive)',
        `₹${inv.subtotal_amount.toLocaleString()}`,
        `₹${inv.gst_amount.toLocaleString()}`,
        `₹${inv.total_amount.toLocaleString()}`,
      ])

      const totalTaxable = invoices.reduce((sum, i) => sum + i.subtotal_amount, 0)
      const totalGst = invoices.reduce((sum, i) => sum + i.gst_amount, 0)
      const totalBilled = invoices.reduce((sum, i) => sum + i.total_amount, 0)

      return {
        title: 'Direct Sales GST Tax Report',
        subtitle: `GST Collection Breakdown for Tax Filing`,
        headers: ['Invoice #', 'Date', 'Customer Name', 'GSTIN / Type', 'Tax Application', 'Taxable Value', 'GST Amount', 'Invoice Total'],
        rows,
        summary: {
          'Taxable Invoices': invoices.length,
          'Total Taxable Turnover': `₹${totalTaxable.toLocaleString()}`,
          'Total Output GST': `₹${totalGst.toLocaleString()}`,
          'Total Invoice Value': `₹${totalBilled.toLocaleString()}`,
        },
      }
    }

    case 'daily': {
      const map = new Map<string, { date: string; count: number; total: number; paid: number }>()
      invoices.forEach((inv) => {
        const d = inv.created_at.split('T')[0]
        const curr = map.get(d) || { date: d, count: 0, total: 0, paid: 0 }
        curr.count += 1
        curr.total += inv.total_amount
        curr.paid += inv.amount_paid
        map.set(d, curr)
      })

      const rows = Array.from(map.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((r) => [formatDate(r.date), r.count, `₹${r.total.toLocaleString()}`, `₹${r.paid.toLocaleString()}`])

      const totalCollections = invoices.reduce((sum, i) => sum + i.amount_paid, 0)

      return {
        title: 'Daily Direct Sales Report',
        subtitle: `Daily POS Collections & Volume`,
        headers: ['Date', 'Invoices Count', 'Gross Billed', 'Collected Revenue'],
        rows,
        summary: {
          'Days Active': map.size,
          'Total Daily Collections': `₹${totalCollections.toLocaleString()}`,
        },
      }
    }

    case 'monthly': {
      const map = new Map<string, { month: string; count: number; total: number; paid: number }>()
      invoices.forEach((inv) => {
        const d = new Date(inv.created_at)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const monthName = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        const curr = map.get(key) || { month: monthName, count: 0, total: 0, paid: 0 }
        curr.count += 1
        curr.total += inv.total_amount
        curr.paid += inv.amount_paid
        map.set(key, curr)
      })

      const rows = Array.from(map.values()).map((r) => [
        r.month,
        r.count,
        `₹${r.total.toLocaleString()}`,
        `₹${r.paid.toLocaleString()}`,
      ])

      const totalRevenue = invoices.reduce((sum, i) => sum + i.amount_paid, 0)

      return {
        title: 'Monthly Direct Sales Report',
        subtitle: `Monthly POS Business Growth`,
        headers: ['Month', 'Invoices Count', 'Gross Billed', 'Revenue Collected'],
        rows,
        summary: {
          'Months Tracked': map.size,
          'Total Revenue': `₹${totalRevenue.toLocaleString()}`,
        },
      }
    }

    case 'expose_vs_podcast': {
      const exposeInvoices = invoices.filter((i) => i.order_type === 'studio_expose')
      const podcastInvoices = invoices.filter((i) => i.order_type === 'podcast')

      const exposeRevenue = exposeInvoices.reduce((sum, i) => sum + i.amount_paid, 0)
      const podcastRevenue = podcastInvoices.reduce((sum, i) => sum + i.amount_paid, 0)

      const rows = [
        ['Studio Expose (Walk-in & Rental)', exposeInvoices.length, `₹${exposeRevenue.toLocaleString()}`],
        ['Podcast Studio (Recording & Edits)', podcastInvoices.length, `₹${podcastRevenue.toLocaleString()}`],
      ]

      return {
        title: 'Studio Expose vs Podcast Revenue Report',
        subtitle: `Comparative Revenue Performance`,
        headers: ['Order Type / Business Vertical', 'Invoices Count', 'Revenue Collected'],
        rows,
        summary: {
          'Studio Expose Revenue': `₹${exposeRevenue.toLocaleString()}`,
          'Podcast Revenue': `₹${podcastRevenue.toLocaleString()}`,
          'Combined Revenue': `₹${(exposeRevenue + podcastRevenue).toLocaleString()}`,
        },
      }
    }

    case 'outstanding': {
      const outstanding = invoices.filter((i) => i.balance_due > 0)
      const rows = outstanding.map((inv) => [
        inv.invoice_number,
        formatDate(inv.created_at),
        inv.customer_name,
        inv.mobile || '—',
        `₹${inv.total_amount.toLocaleString()}`,
        `₹${inv.amount_paid.toLocaleString()}`,
        `₹${inv.balance_due.toLocaleString()}`,
      ])

      const totalBalance = outstanding.reduce((sum, i) => sum + i.balance_due, 0)

      return {
        title: 'Direct Sales Outstanding Report',
        subtitle: `Pending Customer Balances`,
        headers: ['Invoice #', 'Date', 'Customer Name', 'Mobile', 'Total Billed', 'Amount Paid', 'Balance Due'],
        rows,
        summary: {
          'Invoices Pending Payment': outstanding.length,
          'Total Outstanding Due': `₹${totalBalance.toLocaleString()}`,
        },
      }
    }

    case 'profit': {
      const totalRevenue = invoices.reduce((sum, i) => sum + i.amount_paid, 0)
      // Estimated 25% direct material/print/energy cost for POS sales
      const estimatedCost = Math.round(totalRevenue * 0.25)
      const netProfit = totalRevenue - estimatedCost
      const margin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0

      const rows = [
        ['Total Direct Sales Collected Revenue', `₹${totalRevenue.toLocaleString()}`],
        ['Estimated Direct Materials & Power Cost (25%)', `₹${estimatedCost.toLocaleString()}`],
        ['Net Studio Direct Sales Profit', `₹${netProfit.toLocaleString()}`],
        ['Direct Sales Profit Margin (%)', `${margin}%`],
      ]

      return {
        title: 'Direct Sales Profit & Margin Report',
        subtitle: `Profitability Analysis`,
        headers: ['Financial Metric', 'Amount (INR)'],
        rows,
        summary: {
          'Total Revenue': `₹${totalRevenue.toLocaleString()}`,
          'Net Profit': `₹${netProfit.toLocaleString()}`,
          'Profit Margin': `${margin}%`,
        },
      }
    }

    case 'item_wise': {
      const itemMap = new Map<string, { name: string; category: string; qty: number; revenue: number }>()

      invoices.forEach((inv) => {
        inv.items.forEach((item) => {
          const key = `${item.category_name}-${item.item_name}`
          const curr = itemMap.get(key) || { name: item.item_name, category: item.category_name, qty: 0, revenue: 0 }
          curr.qty += item.quantity
          curr.revenue += item.total_amount
          itemMap.set(key, curr)
        })
      })

      const rows = Array.from(itemMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .map((i) => [i.category, i.name, i.qty, `₹${i.revenue.toLocaleString()}`])

      const totalItemRevenue = Array.from(itemMap.values()).reduce((sum, i) => sum + i.revenue, 0)

      return {
        title: 'Item-Wise Sales & Volume Report',
        subtitle: `Service & Product Performance`,
        headers: ['Category', 'Item / Service Name', 'Total Qty Sold', 'Total Revenue Billed'],
        rows,
        summary: {
          'Unique Catalog Items Sold': itemMap.size,
          'Total Item Sales Revenue': `₹${totalItemRevenue.toLocaleString()}`,
        },
      }
    }

    default:
      return {
        title: 'Direct Sales Report',
        subtitle: '',
        headers: [],
        rows: [],
        summary: {},
      }
  }
}

// ─── Export Utilities ─────────────────────────────────────────────────────────

export function downloadDirectSalesReportCSV(report: DirectSalesReportData): void {
  let csvContent = `data:text/csv;charset=utf-8,`
  csvContent += `"${report.title}"\n`
  csvContent += `"${report.subtitle}"\n\n`

  if (report.headers.length > 0) {
    csvContent += report.headers.map((h) => `"${h}"`).join(',') + '\n'
  }

  report.rows.forEach((row) => {
    csvContent += row.map((cell) => `"${cell}"`).join(',') + '\n'
  })

  csvContent += '\nSUMMARY\n'
  Object.entries(report.summary).forEach(([k, v]) => {
    csvContent += `"${k}","${v}"\n`
  })

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function downloadDirectSalesReportPDF(report: DirectSalesReportData): Promise<void> {
  const profile = loadBusinessProfile()
  const studioName = profile.business_name || 'Trufocus Photography'

  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '-9999px'
  container.style.width = '800px'
  container.style.padding = '30px'
  container.style.backgroundColor = '#FFFFFF'
  container.style.fontFamily = 'Helvetica, Arial, sans-serif'
  container.style.color = '#111827'

  const summaryHtml = Object.entries(report.summary)
    .map(
      ([k, v]) =>
        `<div style="background:#F3F4F6; padding:10px 14px; border-radius:8px;"><span style="font-size:10px; color:#6B7280; font-weight:bold; display:block;">${k}</span><span style="font-size:14px; font-weight:bold; color:#111827;">${v}</span></div>`
    )
    .join('')

  const headersHtml = report.headers
    .map((h) => `<th style="padding:8px 10px; background:#5B3FD9; color:#FFFFFF; text-align:left; font-size:11px;">${h}</th>`)
    .join('')
  const rowsHtml = report.rows
    .map(
      (row) =>
        `<tr>${row.map((c) => `<td style="padding:8px 10px; border-bottom:1px solid #E5E7EB; font-size:11px;">${c}</td>`).join('')}</tr>`
    )
    .join('')

  container.innerHTML = `
    <div style="border-bottom:3px solid #5B3FD9; padding-bottom:15px; margin-bottom:20px;">
      <h1 style="font-size:22px; margin:0; color:#5B3FD9; font-weight:bold;">${studioName}</h1>
      <h2 style="font-size:16px; margin:6px 0 0 0; color:#111827;">${report.title}</h2>
      <p style="font-size:12px; margin:4px 0 0 0; color:#6B7280;">${report.subtitle}</p>
    </div>

    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-bottom:20px;">
      ${summaryHtml}
    </div>

    <table style="width:100%; border-collapse:collapse; margin-top:10px;">
      <thead><tr>${headersHtml}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `

  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true })
    document.body.removeChild(container)

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(`${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (e) {
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
    console.error(e)
  }
}

export function printDirectSalesReport(report: DirectSalesReportData): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const profile = loadBusinessProfile()
  const studioName = profile.business_name || 'Trufocus Photography'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #111827; }
          .header { border-bottom: 2px solid #5B3FD9; padding-bottom: 15px; margin-bottom: 20px; }
          .studio-title { font-size: 20px; font-weight: bold; color: #5B3FD9; }
          .report-title { font-size: 16px; font-weight: bold; margin-top: 5px; }
          .subtitle { font-size: 12px; color: #6B7280; margin-top: 3px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th, td { border: 1px solid #E5E7EB; padding: 8px 12px; text-align: left; }
          th { background-color: #5B3FD9; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #F8FAFC; }
          .summary-box { background: #F3F4F6; border-radius: 8px; padding: 15px; margin-top: 25px; border-left: 4px solid #5B3FD9; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
          .summary-item { font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="studio-title">${studioName}</div>
          <div class="report-title">${report.title}</div>
          <div class="subtitle">${report.subtitle}</div>
        </div>

        <table>
          <thead>
            <tr>
              ${report.headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${report.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>

        <div class="summary-box">
          <strong style="color: #5B3FD9; font-size: 13px;">REPORT SUMMARY HIGHLIGHTS</strong>
          <div class="summary-grid">
            ${Object.entries(report.summary)
              .map(([k, v]) => `<div class="summary-item"><span>${k}:</span> <strong style="color:#111827;">${v}</strong></div>`)
              .join('')}
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}
