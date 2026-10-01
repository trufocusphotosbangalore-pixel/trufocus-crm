import { FileText, Download, Eye, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { WorkOrder } from '@/types/workOrders'
import { downloadDocumentPDF, previewDocumentPDF } from '@/services/pdfGeneratorService'

interface QuotationTabProps {
  workOrder: WorkOrder
}

export function QuotationTab({ workOrder }: QuotationTabProps) {
  const quoteNumber = `QT-${workOrder.work_order_number.replace(/\D/g, '') || '2025-614'}`

  const packageTotal = typeof workOrder.payment?.package_amount === 'number'
    ? workOrder.payment.package_amount
    : (typeof workOrder.package_total === 'number' ? workOrder.package_total : (parseFloat(String(workOrder.payment?.package_amount || '0')) || 0))

  const discount = typeof workOrder.payment?.discount_amount === 'number'
    ? workOrder.payment.discount_amount
    : parseFloat(workOrder.payment?.discount_amount || '0') || 0

  const subtotal = Math.max(0, packageTotal - discount)
  const isGstApplicable = workOrder.payment?.gst_applicable ?? false
  const gstRate = isGstApplicable ? (workOrder.payment?.gst_percent ?? 18) : 0
  const gst = isGstApplicable ? Math.round((subtotal * gstRate) / 100) : 0
  const netAmount = subtotal + gst

  const handleDownload = () => {
    downloadDocumentPDF('quotation', workOrder)
  }

  const handlePreview = () => {
    previewDocumentPDF('quotation', workOrder)
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Quotation & Financial Estimate</h3>
            <p className="text-xs text-gray-500">Official quotation details and downloadable PDF</p>
          </div>
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus size={14} /> Generate & Download New Quote
          </button>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${isGstApplicable ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 text-xs`}>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Quote Number</span>
            <span className="font-mono font-bold text-[#5B3FD9] text-sm">{quoteNumber}</span>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Package Subtotal</span>
            <span className="font-mono font-bold text-[#111827] text-sm">{formatCurrency(subtotal, 'INR')}</span>
          </div>

          {isGstApplicable && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">GST ({gstRate}%)</span>
              <span className="font-mono font-bold text-gray-700 text-sm">{formatCurrency(gst, 'INR')}</span>
            </div>
          )}

          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
            <span className="text-purple-600 font-bold uppercase tracking-wider block text-[10px] mb-1">Grand Total</span>
            <span className="font-mono font-bold text-[#5B3FD9] text-base">{formatCurrency(netAmount, 'INR')}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-r from-gray-50 to-purple-50/40 border border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-purple-100 text-[#5B3FD9] flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#111827]">Quotation-{workOrder.work_order_number}.pdf</p>
              <p className="text-[10px] text-gray-400 font-medium">Generated Quotation Document • PDF format</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePreview}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye size={13} /> Preview
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Download size={13} /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
