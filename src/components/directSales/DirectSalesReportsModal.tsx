import { useState, useMemo } from 'react'
import { X, FileText, Download, Printer, FileSpreadsheet } from 'lucide-react'
import {
  generateDirectSalesReport,
  downloadDirectSalesReportCSV,
  downloadDirectSalesReportPDF,
  printDirectSalesReport,
} from '@/services/directSalesReportsService'
import type { DirectSalesReportType, DirectSalesReportData } from '@/services/directSalesReportsService'
import { toast } from 'react-hot-toast'

interface DirectSalesReportsModalProps {
  isOpen: boolean
  onClose: () => void
  initialReportType?: DirectSalesReportType
}

export function DirectSalesReportsModal({
  isOpen,
  onClose,
  initialReportType = 'summary',
}: DirectSalesReportsModalProps) {
  const [reportType, setReportType] = useState<DirectSalesReportType>(initialReportType)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const currentReport: DirectSalesReportData = useMemo(() => {
    return generateDirectSalesReport(reportType, {
      startDate,
      endDate,
    })
  }, [reportType, startDate, endDate])

  if (!isOpen) return null

  const handleExportCSV = () => {
    downloadDirectSalesReportCSV(currentReport)
    toast.success(`Exported ${currentReport.title} to Excel / CSV!`)
  }

  const handleExportPDF = async () => {
    const toastId = toast.loading('Generating report PDF...')
    await downloadDirectSalesReportPDF(currentReport)
    toast.dismiss(toastId)
    toast.success(`Downloaded ${currentReport.title}.pdf!`)
  }

  const handlePrint = () => {
    printDirectSalesReport(currentReport)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <FileText size={22} />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-[#111827]">Direct Sales Financial Reports</h2>
              <p className="text-xs text-gray-500">POS Revenue, GST Tax, Customer Ledgers & Profit Statements</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet size={14} /> Excel / CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#5B3FD9] flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} /> Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={onClose}
              className="size-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-gray-50/60 border-b border-gray-200 shrink-0 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Report Type Selector */}
            <div className="sm:col-span-2">
              <label className="block text-gray-700 font-bold mb-1">Select Direct Sales Report *</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as DirectSalesReportType)}
                className="w-full h-9 px-3 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5B3FD9]"
              >
                <option value="summary">🟢 Direct Sales Summary Report (POS Total)</option>
                <option value="customer_ledger">📋 Direct Sales Customer Ledger</option>
                <option value="finance_ledger">💰 Direct Sales Finance Ledger (Money IN)</option>
                <option value="gst">📊 Direct Sales GST Tax Report</option>
                <option value="daily">📅 Daily Sales Report</option>
                <option value="monthly">🗓️ Monthly Sales Report</option>
                <option value="expose_vs_podcast">⚔️ Studio Expose vs Podcast Revenue</option>
                <option value="outstanding">⚠️ Outstanding Receipts & Balances Report</option>
                <option value="profit">📈 Direct Sales Profit & Loss Statement</option>
                <option value="item_wise">🛍️ Item-Wise Sales Volume Report</option>
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-300 bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#5B3FD9]"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-300 bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#5B3FD9]"
              />
            </div>
          </div>
        </div>

        {/* Report Content Live Preview */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs bg-white">
          {/* Report Title & Subtitle */}
          <div className="border-b border-gray-200 pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-[#111827]">{currentReport.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{currentReport.subtitle}</p>
            </div>
          </div>

          {/* Summary KPI Cards Grid */}
          {Object.keys(currentReport.summary).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(currentReport.summary).map(([label, val]) => (
                <div key={label} className="bg-purple-50/60 rounded-2xl p-3.5 border border-purple-100">
                  <span className="text-[10px] font-extrabold uppercase text-purple-700 block tracking-wider mb-0.5">
                    {label}
                  </span>
                  <span className="text-base font-extrabold text-[#111827] font-mono">{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Preview Data Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#5B3FD9] text-white font-bold uppercase text-[10px]">
                  {currentReport.headers.map((h, i) => (
                    <th key={i} className="px-4 py-2.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentReport.rows.length === 0 ? (
                  <tr>
                    <td colSpan={currentReport.headers.length || 1} className="p-8 text-center text-gray-400 italic">
                      No records found matching your selected date range or report filters.
                    </td>
                  </tr>
                ) : (
                  currentReport.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-2.5 font-medium text-gray-800">
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
      </div>
    </div>
  )
}
