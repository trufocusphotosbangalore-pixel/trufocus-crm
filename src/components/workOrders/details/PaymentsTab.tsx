import { useState } from 'react'
import { Plus, Download, FileText, FileSpreadsheet } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { WorkOrder } from '@/types/workOrders'
import { PaymentStatusBadge, ProgressBar } from '../WorkOrderBadges'
import { RecordPaymentModal } from '../RecordPaymentModal'
import { downloadDocumentPDF } from '@/services/pdfGeneratorService'
import { getPayments } from '@/services/financeStore'
import {
  generateCustomerFinancialStatement,
  downloadReportAsPDF,
  downloadReportAsCSV,
} from '@/services/financialReportsService'
import { toast } from 'react-hot-toast'

interface PaymentsTabProps {
  workOrder: WorkOrder
  onPaymentUpdated?: () => void
}

export function PaymentsTab({ workOrder, onPaymentUpdated }: PaymentsTabProps) {
  const [showRecordModal, setShowRecordModal] = useState(false)

  // SINGLE SOURCE OF TRUTH: Read payments directly from canonical FinanceService
  const allPayments = getPayments()
  const payments = allPayments.filter(
    (p) => (p.work_order_id === workOrder.id || p.work_order_number === workOrder.work_order_number) && p.status === 'completed'
  )

  const totalAmount = typeof workOrder.payment?.package_amount === 'number'
    ? workOrder.payment.package_amount
    : (typeof workOrder.package_total === 'number' ? workOrder.package_total : (parseFloat(String(workOrder.payment?.package_amount || '0')) || 0))

  const paidAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const balanceAmount = Math.max(0, totalAmount - paidAmount)
  const progress = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0

  const handleDownloadReceipt = (p: any) => {
    downloadDocumentPDF('receipt', workOrder, {
      receiptNumber: p.receipt_number || `RCPT-${p.id || '0001'}`,
      receiptAmount: p.amount,
      paymentMode: p.payment_mode,
      transactionId: p.transaction_ref,
      receivedBy: p.received_by,
    })
  }

  const handleDownloadPDFStatement = () => {
    const report = generateCustomerFinancialStatement(workOrder.id)
    downloadReportAsPDF(report)
    toast.success(`Downloaded Financial Statement PDF for ${workOrder.work_order_number}!`)
  }

  const handleDownloadExcelStatement = () => {
    const report = generateCustomerFinancialStatement(workOrder.id)
    downloadReportAsCSV(report)
    toast.success(`Downloaded Financial Statement Excel for ${workOrder.work_order_number}!`)
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Payment Overview & Customer Ledger</h3>
            <p className="text-xs text-gray-500">
              Unified Single Source of Truth Ledger for Customer Receipts and Financial Reports
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPDFStatement}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} /> PDF Statement
            </button>
            <button
              onClick={handleDownloadExcelStatement}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet size={13} /> Excel Statement
            </button>
            <button
              onClick={() => setShowRecordModal(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus size={14} /> Record Manual Payment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Package Total</span>
            <span className="font-mono font-bold text-[#111827] text-base">{formatCurrency(totalAmount, 'INR')}</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-emerald-600 font-bold uppercase tracking-wider block text-[10px] mb-1">Amount Received</span>
            <span className="font-mono font-bold text-emerald-600 text-base">{formatCurrency(paidAmount, 'INR')}</span>
          </div>

          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <span className="text-red-600 font-bold uppercase tracking-wider block text-[10px] mb-1">Balance Due</span>
            <span className="font-mono font-bold text-red-600 text-base">{formatCurrency(balanceAmount, 'INR')}</span>
          </div>

          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-purple-600 font-bold uppercase tracking-wider text-[10px]">Payment Status</span>
              <PaymentStatusBadge status={workOrder.payment_status} />
            </div>
            <div className="mt-2">
              <ProgressBar value={progress} />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Payment History Ledger</h4>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-3 py-2.5">Receipt #</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Amount</th>
                  <th className="px-3 py-2.5">Mode</th>
                  <th className="px-3 py-2.5">Transaction ID</th>
                  <th className="px-3 py-2.5">Received By</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400 italic">
                      No customer receipts recorded yet for this Work Order.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/80">
                      <td className="px-3 py-3 font-mono font-bold text-[#5B3FD9]">{p.receipt_number}</td>
                      <td className="px-3 py-3 font-medium text-gray-600">{formatDate(p.payment_date)}</td>
                      <td className="px-3 py-3 font-mono font-bold text-emerald-600">{formatCurrency(p.amount, 'INR')}</td>
                      <td className="px-3 py-3 font-semibold text-gray-800">{p.payment_mode.toUpperCase()}</td>
                      <td className="px-3 py-3 font-mono text-gray-500 text-[11px]">{p.transaction_ref || '—'}</td>
                      <td className="px-3 py-3 text-gray-700 font-medium">{p.received_by || 'Studio Accounts'}</td>
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                          Completed
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => handleDownloadReceipt(p)}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileText size={11} /> Receipt PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showRecordModal && (
        <RecordPaymentModal
          isOpen={showRecordModal}
          onClose={() => setShowRecordModal(false)}
          workOrder={workOrder}
          onSuccess={() => {
            setShowRecordModal(false)
            if (onPaymentUpdated) onPaymentUpdated()
          }}
        />
      )}
    </div>
  )
}
