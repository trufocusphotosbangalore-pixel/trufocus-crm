import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import {
  getPayments,
  getProjectExpenses,
  getTeamPayouts,
  getCompanyExpenses,
  getWorkOrderFinanceGroups,
} from '@/services/financeStore'
import { loadBusinessProfile } from '@/services/businessProfileStore'
import { formatDate } from '@/lib/utils'

export type ReportType =
  | 'customer_receipts'
  | 'project_expenses'
  | 'freelancer_payments'
  | 'travel_expenses'
  | 'profit_and_loss'
  | 'outstanding_receipts'
  | 'customer_statement'

export interface ReportFilter {
  startDate?: string
  endDate?: string
  customerName?: string
  workOrderNumber?: string
}

export interface ReportData {
  title: string
  subtitle: string
  headers: string[]
  rows: (string | number)[][]
  summary: Record<string, string | number>
}

// ─── Filter Utilities ─────────────────────────────────────────────────────────

function isWithinDateRange(dateStr?: string, startDate?: string, endDate?: string): boolean {
  if (!dateStr) return true
  const d = new Date(dateStr).getTime()
  if (startDate && d < new Date(startDate).getTime()) return false
  if (endDate && d > new Date(endDate).getTime() + 86400000) return false
  return true
}

// ─── Report Data Generators ───────────────────────────────────────────────────

export function generateCustomerReceiptsReport(filter?: ReportFilter): ReportData {
  const allPayments = getPayments()
  const filtered = allPayments.filter((p) => {
    if (!isWithinDateRange(p.payment_date, filter?.startDate, filter?.endDate)) return false
    if (filter?.customerName && !p.customer_name.toLowerCase().includes(filter.customerName.toLowerCase())) return false
    if (filter?.workOrderNumber && !p.work_order_number.toLowerCase().includes(filter.workOrderNumber.toLowerCase())) return false
    return true
  })

  const rows = filtered.map((p) => [
    p.receipt_number,
    formatDate(p.payment_date || new Date().toISOString()),
    p.work_order_number,
    p.customer_name,
    (p.payment_mode || 'upi').toUpperCase(),
    p.transaction_ref || '—',
    `₹${p.amount.toLocaleString()}`,
  ])

  const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0)

  return {
    title: 'Customer Receipt Report',
    subtitle: `Total Receipts: ${filtered.length} | Period: ${filter?.startDate || 'All Time'} to ${filter?.endDate || 'Present'}`,
    headers: ['Receipt #', 'Date', 'WO #', 'Customer Name', 'Mode', 'Transaction Ref', 'Amount'],
    rows,
    summary: {
      'Total Receipts Count': filtered.length,
      'Total Amount Received': `₹${totalAmount.toLocaleString()}`,
    },
  }
}

export function generateProjectExpensesReport(filter?: ReportFilter): ReportData {
  const expenses = getProjectExpenses()
  const filtered = expenses.filter((e) => {
    if (!isWithinDateRange(e.expense_date, filter?.startDate, filter?.endDate)) return false
    if (filter?.workOrderNumber && !e.work_order_number.toLowerCase().includes(filter.workOrderNumber.toLowerCase())) return false
    return true
  })

  const rows = filtered.map((e) => [
    formatDate(e.expense_date || new Date().toISOString()),
    e.category,
    e.description,
    e.work_order_number,
    e.paid_to,
    (e.payment_mode || 'upi').toUpperCase(),
    `₹${e.amount.toLocaleString()}`,
  ])

  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0)

  return {
    title: 'Project Expense Report',
    subtitle: `Total Project Expenses: ${filtered.length} | Period: ${filter?.startDate || 'All Time'} to ${filter?.endDate || 'Present'}`,
    headers: ['Date', 'Category', 'Description', 'WO #', 'Paid To', 'Mode', 'Amount'],
    rows,
    summary: {
      'Total Expense Entries': filtered.length,
      'Total Expense Amount': `₹${totalAmount.toLocaleString()}`,
    },
  }
}

export function generateFreelancerPaymentsReport(filter?: ReportFilter): ReportData {
  const payouts = getTeamPayouts()
  const filtered = payouts.filter((p) => {
    if (!isWithinDateRange(p.payment_date || p.created_at, filter?.startDate, filter?.endDate)) return false
    if (filter?.workOrderNumber && !p.work_order_number.toLowerCase().includes(filter.workOrderNumber.toLowerCase())) return false
    if (filter?.customerName && !p.employee_name.toLowerCase().includes(filter.customerName.toLowerCase())) return false
    return true
  })

  const rows = filtered.map((p) => [
    formatDate(p.payment_date || p.created_at || new Date().toISOString()),
    p.work_order_number,
    p.service_name,
    p.employee_name,
    p.payment_status.toUpperCase(),
    (p.payment_mode || 'upi').toUpperCase(),
    `₹${p.amount.toLocaleString()}`,
  ])

  const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0)

  return {
    title: 'Freelancer & Crew Payment Report',
    subtitle: `Total Payouts: ${filtered.length} | Period: ${filter?.startDate || 'All Time'} to ${filter?.endDate || 'Present'}`,
    headers: ['Date', 'WO #', 'Service', 'Crew Member', 'Status', 'Mode', 'Amount'],
    rows,
    summary: {
      'Total Payouts Count': filtered.length,
      'Total Payout Amount': `₹${totalAmount.toLocaleString()}`,
    },
  }
}

export function generateTravelExpensesReport(filter?: ReportFilter): ReportData {
  const projectExp = getProjectExpenses().filter((e) => e.category.toLowerCase().includes('travel') || e.category.toLowerCase().includes('conveyance') || e.description.toLowerCase().includes('travel'))
  const filtered = projectExp.filter((e) => {
    if (!isWithinDateRange(e.expense_date, filter?.startDate, filter?.endDate)) return false
    if (filter?.workOrderNumber && !e.work_order_number.toLowerCase().includes(filter.workOrderNumber.toLowerCase())) return false
    return true
  })

  const rows = filtered.map((e) => [
    formatDate(e.expense_date || new Date().toISOString()),
    e.work_order_number,
    e.paid_to,
    e.description || 'Travel & Logistics',
    e.remarks || '—',
    `₹${e.amount.toLocaleString()}`,
  ])

  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0)

  return {
    title: 'Travel & Logistics Expense Report',
    subtitle: `Total Travel Entries: ${filtered.length}`,
    headers: ['Date', 'WO #', 'Paid To / Vendor', 'Description', 'Remarks', 'Amount'],
    rows,
    summary: {
      'Total Travel Entries': filtered.length,
      'Total Travel Expense': `₹${totalAmount.toLocaleString()}`,
    },
  }
}

export function generateProfitAndLossReport(filter?: ReportFilter): ReportData {
  const groups = getWorkOrderFinanceGroups()
  const companyExpenses = getCompanyExpenses()

  const filteredGroups = groups.filter((g) => {
    if (filter?.workOrderNumber && !g.work_order_number.toLowerCase().includes(filter.workOrderNumber.toLowerCase())) return false
    if (filter?.customerName && !g.customer_name.toLowerCase().includes(filter.customerName.toLowerCase())) return false
    return true
  })

  const totalRevenue = filteredGroups.reduce((sum, g) => sum + g.amount_received, 0)
  const totalPackageValue = filteredGroups.reduce((sum, g) => sum + g.net_amount, 0)
  const totalCrewPayouts = filteredGroups.reduce((sum, g) => sum + g.total_payouts, 0)
  const totalProjectExpenses = filteredGroups.reduce((sum, g) => sum + g.total_expenses, 0)
  const totalCompanyExpenses = companyExpenses.reduce((sum, c) => sum + c.amount, 0)

  const totalExpensesAll = totalCrewPayouts + totalProjectExpenses + totalCompanyExpenses
  const netProfit = totalRevenue - (totalCrewPayouts + totalProjectExpenses) - totalCompanyExpenses
  const profitMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0

  const rows = [
    ['1. REVENUE (MONEY IN)', '', ''],
    ['Total Agreed Contract Value (Net)', '', `₹${totalPackageValue.toLocaleString()}`],
    ['Total Customer Payments Received', '', `₹${totalRevenue.toLocaleString()}`],
    ['', '', ''],
    ['2. DIRECT EXPENSES & CREW PAYOUTS', '', ''],
    ['Freelancer & Crew Payouts', '', `₹${totalCrewPayouts.toLocaleString()}`],
    ['Project Operating Expenses (Equipment, Conveyance, Food)', '', `₹${totalProjectExpenses.toLocaleString()}`],
    ['', '', ''],
    ['3. STUDIO STANDING EXPENSES', '', ''],
    ['Company Monthly Standing Expenses', '', `₹${totalCompanyExpenses.toLocaleString()}`],
    ['', '', ''],
    ['4. SUMMARY PROFITABILITY', '', ''],
    ['Total Studio Operating Outflow', '', `₹${totalExpensesAll.toLocaleString()}`],
    ['NET STUDIO PROFIT', '', `₹${netProfit.toLocaleString()}`],
    ['NET PROFIT MARGIN (%)', '', `${profitMarginPercent}%`],
  ]

  return {
    title: 'Profit & Loss (P&L) Statement',
    subtitle: `Studio Financial Performance | Generated on ${formatDate(new Date().toISOString())}`,
    headers: ['Financial Category', 'Details', 'Amount (INR)'],
    rows,
    summary: {
      'Total Customer Receipts': `₹${totalRevenue.toLocaleString()}`,
      'Total Operating Outflow': `₹${totalExpensesAll.toLocaleString()}`,
      'Net Studio Profit': `₹${netProfit.toLocaleString()}`,
      'Profit Margin': `${profitMarginPercent}%`,
    },
  }
}

export function generateOutstandingReceiptsReport(filter?: ReportFilter): ReportData {
  const groups = getWorkOrderFinanceGroups().filter((g) => g.balance_amount > 0)
  const filtered = groups.filter((g) => {
    if (filter?.customerName && !g.customer_name.toLowerCase().includes(filter.customerName.toLowerCase())) return false
    if (filter?.workOrderNumber && !g.work_order_number.toLowerCase().includes(filter.workOrderNumber.toLowerCase())) return false
    return true
  })

  const rows = filtered.map((g) => [
    g.work_order_number,
    g.customer_name,
    g.mobile,
    formatDate(g.booking_date || new Date().toISOString()),
    g.event_type,
    `₹${g.net_amount.toLocaleString()}`,
    `₹${g.amount_received.toLocaleString()}`,
    `₹${g.balance_amount.toLocaleString()}`,
    `${g.payment_percentage}%`,
  ])

  const totalOutstanding = filtered.reduce((sum, g) => sum + g.balance_amount, 0)

  return {
    title: 'Outstanding Receipts & Pending Balances Report',
    subtitle: `Total Outstanding Projects: ${filtered.length}`,
    headers: ['WO #', 'Customer Name', 'Mobile', 'Booking Date', 'Event Type', 'Contract Total', 'Received', 'Balance Due', 'Paid %'],
    rows,
    summary: {
      'Projects Pending Payment': filtered.length,
      'Total Balance Outstanding': `₹${totalOutstanding.toLocaleString()}`,
    },
  }
}

// ─── Customer Financial Report (Detailed Statement for Work Order) ────────────

export function generateCustomerFinancialStatement(workOrderId: string): ReportData {
  const groups = getWorkOrderFinanceGroups()
  const group = groups.find((g) => g.work_order_id === workOrderId || g.work_order_number === workOrderId)

  if (!group) {
    return {
      title: 'Customer Financial Statement',
      subtitle: 'Work Order Not Found',
      headers: [],
      rows: [],
      summary: {},
    }
  }

  const rows: (string | number)[][] = [
    ['CUSTOMER & EVENT DETAILS', '', '', ''],
    ['Customer Name', group.customer_name, 'Mobile', group.mobile],
    ['Work Order Number', group.work_order_number, 'Event Type', group.event_type],
    ['Booking Date', formatDate(group.booking_date || new Date().toISOString()), 'Last Payment Date', group.last_payment_date ? formatDate(group.last_payment_date) : 'N/A'],
    ['', '', '', ''],
    ['PACKAGE FINANCIAL BREAKDOWN', '', '', ''],
    ['Gross Package Amount', `₹${group.package_amount.toLocaleString()}`, 'GST Amount', `₹${group.gst_amount.toLocaleString()}`],
    ['Discount Applied', `₹${group.discount_amount.toLocaleString()}`, 'Net Agreed Amount', `₹${group.net_amount.toLocaleString()}`],
    ['', '', '', ''],
    ['CUSTOMER RECEIPTS (MONEY IN)', '', '', ''],
    ...group.payments.map((p) => [
      `Receipt ${p.receipt_number}`,
      formatDate(p.payment_date || new Date().toISOString()),
      (p.payment_mode || 'upi').toUpperCase(),
      `₹${p.amount.toLocaleString()}`,
    ]),
    ['Total Amount Received', `₹${group.amount_received.toLocaleString()}`, 'Outstanding Balance', `₹${group.balance_amount.toLocaleString()}`],
    ['', '', '', ''],
    ['PROJECT EXPENSES & CREW PAYOUTS (MONEY OUT)', '', '', ''],
    ...group.payouts.map((po) => [
      `Crew Payout: ${po.employee_name}`,
      po.service_name,
      po.payment_status.toUpperCase(),
      `₹${po.amount.toLocaleString()}`,
    ]),
    ...group.expenses.map((pe) => [
      `Project Expense: ${pe.category}`,
      pe.paid_to,
      pe.description,
      `₹${pe.amount.toLocaleString()}`,
    ]),
    ['Total Project Outflows', `₹${(group.total_payouts + group.total_expenses).toLocaleString()}`, '', ''],
    ['', '', '', ''],
    ['PROJECT PROFITABILITY SUMMARY', '', '', ''],
    ['Net Contract Revenue', `₹${group.net_amount.toLocaleString()}`, 'Net Studio Profit', `₹${group.net_profit.toLocaleString()}`],
    ['Profit Margin (%)', `${group.profit_margin_percent}%`, 'Payment Status', group.balance_amount === 0 ? 'FULLY PAID' : 'PARTIAL / PENDING'],
  ]

  return {
    title: `Customer Financial Statement — ${group.work_order_number}`,
    subtitle: `Client: ${group.customer_name} | Event: ${group.event_type}`,
    headers: ['Section / Parameter', 'Details / Date', 'Reference / Mode', 'Amount (INR)'],
    rows,
    summary: {
      'Net Contract Value': `₹${group.net_amount.toLocaleString()}`,
      'Total Received': `₹${group.amount_received.toLocaleString()}`,
      'Balance Remaining': `₹${group.balance_amount.toLocaleString()}`,
      'Net Project Profit': `₹${group.net_profit.toLocaleString()}`,
    },
  }
}

// ─── Export Utilities (PDF, Excel, CSV, Print) ───────────────────────────────

export function downloadReportAsCSV(report: ReportData): void {
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

export async function downloadReportAsPDF(report: ReportData): Promise<void> {
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
    .map(([k, v]) => `<div style="background:#F3F4F6; padding:10px 14px; border-radius:8px;"><span style="font-size:10px; color:#6B7280; font-weight:bold; display:block;">${k}</span><span style="font-size:14px; font-weight:bold; color:#111827;">${v}</span></div>`)
    .join('')

  const headersHtml = report.headers.map((h) => `<th style="padding:8px 10px; background:#5B3FD9; color:#FFFFFF; text-align:left; font-size:11px;">${h}</th>`).join('')
  const rowsHtml = report.rows
    .map((row) => `<tr>${row.map((c) => `<td style="padding:8px 10px; border-bottom:1px solid #E5E7EB; font-size:11px;">${c}</td>`).join('')}</tr>`)
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

export function printReport(report: ReportData): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const profile = loadBusinessProfile()
  const brandName = profile.brand_name || profile.business_name || 'Trufocus Photos'
  const parentLine = profile.parent_company_line || 'A Brand of Chaaya AI Technologies Private Limited'
  const legalName = profile.legal_company_name || 'Chaaya AI Technologies Private Limited'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #111827; }
          .header { border-bottom: 2px solid #5B3FD9; padding-bottom: 15px; margin-bottom: 20px; }
          .studio-title { font-size: 20px; font-weight: bold; color: #5B3FD9; }
          .legal-line { font-size: 11px; font-weight: bold; color: #4B5563; }
          .report-title { font-size: 16px; font-weight: bold; margin-top: 5px; }
          .subtitle { font-size: 12px; color: #6B7280; margin-top: 3px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th, td { border: 1px solid #E5E7EB; padding: 8px 12px; text-align: left; }
          th { background-color: #5B3FD9; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #F8FAFC; }
          .summary-box { background: #F3F4F6; border-radius: 8px; padding: 15px; margin-top: 25px; border-left: 4px solid #5B3FD9; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
          .summary-item { font-size: 12px; font-weight: bold; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="studio-title">${brandName}</div>
          <div class="legal-line">${parentLine} (${legalName})</div>
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
          <strong style="color: #5B3FD9; font-size: 13px;">SUMMARY HIGHLIGHTS</strong>
          <div class="summary-grid">
            ${Object.entries(report.summary).map(([k, v]) => `<div class="summary-item"><span>${k}:</span> <strong style="color:#111827;">${v}</strong></div>`).join('')}
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
