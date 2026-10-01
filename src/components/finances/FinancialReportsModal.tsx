import { useState, useMemo } from 'react'
import { X, FileText, Download, Printer, FileSpreadsheet, Filter } from 'lucide-react'
import {
  generateCustomerReceiptsReport,
  generateProjectExpensesReport,
  generateFreelancerPaymentsReport,
  generateTravelExpensesReport,
  generateProfitAndLossReport,
  generateOutstandingReceiptsReport,
  generateCustomerFinancialStatement,
  downloadReportAsCSV,
  downloadReportAsPDF,
  printReport,
} from '@/services/financialReportsService'
import type { ReportType, ReportData } from '@/services/financialReportsService'
import { getLocalWorkOrders } from '@/services/supabase/workOrders'
import { toast } from 'react-hot-toast'

interface FinancialReportsModalProps {
  isOpen: boolean
  onClose: () => void
  initialReportType?: ReportType
  initialWorkOrderId?: string
}

export function FinancialReportsModal({
  isOpen,
  onClose,
  initialReportType = 'customer_receipts',
  initialWorkOrderId = '',
}: FinancialReportsModalProps) {
  const [reportType, setReportType] = useState<ReportType>(initialReportType)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [customerName, setCustomerName] = useState<string>('')
  const [workOrderNumber, setWorkOrderNumber] = useState<string>(initialWorkOrderId)

  const workOrders = useMemo(() => getLocalWorkOrders(), [])

  const currentReport: ReportData = useMemo(() => {
    const filter = { startDate, endDate, customerName, workOrderNumber }

    switch (reportType) {
      case 'customer_receipts':
        return generateCustomerReceiptsReport(filter)
      case 'project_expenses':
        return generateProjectExpensesReport(filter)
      case 'freelancer_payments':
        return generateFreelancerPaymentsReport(filter)
      case 'travel_expenses':
        return generateTravelExpensesReport(filter)
      case 'profit_and_loss':
        return generateProfitAndLossReport(filter)
      case 'outstanding_receipts':
        return generateOutstandingReceiptsReport(filter)
      case 'customer_statement':
        return generateCustomerFinancialStatement(workOrderNumber || (workOrders[0]?.id || ''))
      default:
        return generateCustomerReceiptsReport(filter)
    }
  }, [reportType, startDate, endDate, customerName, workOrderNumber, workOrders])

  if (!isOpen) return null

  const handleExportCSV = () => {
    downloadReportAsCSV(currentReport)
    toast.success(`Downloaded ${currentReport.title} as Excel/CSV spreadsheet!`)
  }

  const handleExportPDF = () => {
    downloadReportAsPDF(currentReport)
    toast.success(`Downloaded ${currentReport.title} as PDF document!`)
  }

  const handlePrint = () => {
    printReport(currentReport)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-[#5B3FD9]/15 text-[#5B3FD9] flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                Financial Reports & Statements Generator
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Generate, filter, and export PDF / Excel / Print financial ledgers and profit reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-gray-50/80 border-b border-gray-200 shrink-0 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Report Type Selector */}
            <div className="lg:col-span-2">
              <label className="block text-gray-700 font-bold mb-1">Select Report Type *</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full h-9 px-3 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5B3FD9]"
              >
                <option value="customer_receipts">🟢 Customer Receipt Report (Money IN)</option>
                <option value="project_expenses">🔴 Project Expense Report (Money OUT)</option>
                <option value="freelancer_payments">👤 Freelancer & Crew Payment Report</option>
                <option value="travel_expenses">🚗 Travel & Logistics Expense Report</option>
                <option value="profit_and_loss">📈 Profit & Loss (P&L) Statement</option>
                <option value="outstanding_receipts">⚠️ Outstanding Receipts & Balances Report</option>
                <option value="customer_statement">📋 Customer Financial Statement (Work Order Detail)</option>
              </select>
            </div>

            {/* Date Range Start */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-300 bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#5B3FD9]"
              />
            </div>

            {/* Date Range End */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-300 bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#5B3FD9]"
              />
            </div>

            {/* Work Order / Customer Filter */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">Filter WO # / Customer</label>
              {reportType === 'customer_statement' ? (
                <select
                  value={workOrderNumber}
                  onChange={(e) => setWorkOrderNumber(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5B3FD9]"
                >
                  <option value="">Select Work Order...</option>
                  {workOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.work_order_number} — {wo.customer_name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="WO-2025-... or Client Name"
                  value={workOrderNumber}
                  onChange={(e) => {
                    setWorkOrderNumber(e.target.value)
                    setCustomerName(e.target.value)
                  }}
                  className="w-full h-9 px-3 rounded-xl border border-gray-300 bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#5B3FD9]"
                />
              )}
            </div>
          </div>
        </div>

        {/* Summary Highlights Cards */}
        <div className="p-4 bg-purple-50/40 border-b border-purple-100 shrink-0">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#5B3FD9]">
            <Filter size={14} />
            <span>Summary Highlights</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {Object.entries(currentReport.summary).map(([key, val]) => (
              <div key={key} className="bg-white p-3 rounded-2xl border border-purple-100 shadow-2xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{key}</span>
                <span className="text-sm font-extrabold text-gray-900 font-mono mt-0.5 block">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Preview Table (Scrollable Area) */}
        <div className="p-5 overflow-y-auto flex-1 min-h-0 text-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900">{currentReport.title}</h3>
              <p className="text-xs text-gray-500 font-medium">{currentReport.subtitle}</p>
            </div>
            <span className="text-xs font-bold text-gray-400">
              {currentReport.rows.length} record(s) loaded
            </span>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#5B3FD9] text-white font-bold text-[11px]">
                  {currentReport.headers.map((h, i) => (
                    <th key={i} className="px-3.5 py-3 border-r border-purple-600 last:border-r-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {currentReport.rows.length === 0 ? (
                  <tr>
                    <td colSpan={currentReport.headers.length || 1} className="p-8 text-center text-gray-400 italic">
                      No records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  currentReport.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-purple-50/30 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2.5 font-medium text-gray-800 border-r border-gray-100 last:border-r-0">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sticky Footer Export Actions Bar */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-gray-500 font-semibold">
            Ready to export report output in PDF, Excel, or Print layout.
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Printer size={15} /> Print Report
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet size={15} /> Download Excel / CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white transition-colors flex items-center gap-1.5 shadow-md shadow-[#5B3FD9]/20 cursor-pointer"
            >
              <Download size={15} /> Download PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
