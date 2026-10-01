import React, { useState } from 'react'
import {
  ChevronDown, ChevronUp, IndianRupee, CreditCard, Receipt, TrendingUp, Eye, FileText, ArrowDownLeft, ArrowUpRight,
  Pencil, Trash2, X, Check,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { WorkOrderFinanceGroup, PaymentRecord, InvoiceRecord, PaymentMode } from '@/types/finances'
import { PAYMENT_MODE_LABELS } from '@/types/finances'
import { RecordReceiptModal } from './RecordReceiptModal'
import { RecordOutboundPaymentModal } from './RecordOutboundPaymentModal'
import { ReceiptInvoicePreviewModal } from './ReceiptInvoicePreviewModal'
import { generateInvoice, updatePaymentRecord, deletePaymentRecord } from '@/services/financeStore'
import { canUserPerformDelete } from '@/services/permissionService'
import { PermissionDeniedModal } from '@/components/common/PermissionDeniedModal'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

interface WorkOrderFinanceCardProps {
  group: WorkOrderFinanceGroup
  onSaved: () => void
}

export function WorkOrderFinanceCard({ group, onSaved }: WorkOrderFinanceCardProps) {
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(false)

  // Modals state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [isOutboundPaymentModalOpen, setIsOutboundPaymentModalOpen] = useState(false)

  // Edit Receipt Modal state
  const [editingReceipt, setEditingReceipt] = useState<PaymentRecord | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editMode, setEditMode] = useState<PaymentMode>('upi')
  const [editRef, setEditRef] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // Preview Document Modal state
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean
    type: 'receipt' | 'invoice'
    receipt?: PaymentRecord | null
    invoice?: InvoiceRecord | null
  }>({
    isOpen: false,
    type: 'receipt',
  })

  const handleEditReceipt = (payment: PaymentRecord) => {
    setEditingReceipt(payment)
    setEditAmount(String(payment.amount))
    setEditDate(payment.payment_date || new Date().toISOString().split('T')[0])
    setEditMode(payment.payment_mode)
    setEditRef(payment.transaction_ref || '')
    setEditNotes(payment.remarks || '')
  }

  const handleSaveEditedReceipt = () => {
    if (!editingReceipt) return
    if (!editDate || !editDate.trim()) {
      toast.error('Payment Date is required.')
      return
    }

    const numAmt = parseFloat(editAmount)
    if (isNaN(numAmt) || numAmt <= 0) {
      toast.error('Payment amount must be greater than 0')
      return
    }

    const updated = updatePaymentRecord(editingReceipt.id, {
      amount: numAmt,
      payment_date: editDate.trim(),
      payment_mode: editMode,
      transaction_ref: editRef,
      remarks: editNotes,
    })

    if (updated) {
      toast.success('Payment receipt updated successfully.')
      setEditingReceipt(null)
      onSaved()
    } else {
      toast.error('Unable to update payment receipt. Please try again.')
    }
  }

  // Permission Check
  const canDeleteFinance = canUserPerformDelete('finances')
  const [showPermissionDeniedModal, setShowPermissionDeniedModal] = useState(false)

  const handleDeleteReceipt = (payment: PaymentRecord) => {
    if (!canUserPerformDelete('finances')) {
      setShowPermissionDeniedModal(true)
      return
    }
    if (confirm(`Are you sure you want to delete customer receipt ${payment.receipt_number} for ₹${payment.amount.toLocaleString()}?`)) {
      deletePaymentRecord(payment.id)
      toast.success(`Deleted receipt ${payment.receipt_number}!`)
      onSaved()
    }
  }

  const handleOpenReceiptPreview = (payment: PaymentRecord) => {
    setPreviewDoc({
      isOpen: true,
      type: 'receipt',
      receipt: payment,
    })
  }

  const handleGenerateInvoiceClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const inv = generateInvoice({
      work_order_id: group.work_order_id,
      work_order_number: group.work_order_number,
      customer_name: group.customer_name,
      customer_mobile: group.mobile,
      subtotal_amount: group.package_amount,
      gst_rate: 18,
      discount_amount: group.discount_amount,
    })
    toast.success(`Generated GST Invoice ${inv.invoice_number}!`)
    setPreviewDoc({
      isOpen: true,
      type: 'invoice',
      invoice: inv,
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden font-sans transition-all duration-200">
      {/* Collapsible Card Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/80 transition-colors select-none"
      >
        {/* Left Info */}
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center font-bold">
            <IndianRupee size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/work-orders/${group.work_order_id}`)
                }}
                className="font-mono font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-0.5 rounded text-xs hover:underline"
              >
                {group.work_order_number}
              </button>
              <h3 className="text-base font-bold text-[#111827]">{group.customer_name}</h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Event: <strong>{group.event_type}</strong> • Mobile: {group.mobile}
            </p>
          </div>
        </div>

        {/* Right Financial Summary Metrics */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Project Value</span>
            <span className="font-mono font-extrabold text-[#111827] text-sm">
              ₹{group.net_amount.toLocaleString()}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">🟢 Received</span>
            <span className="font-mono font-extrabold text-emerald-600 text-sm">
              ₹{group.amount_received.toLocaleString()}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Balance Due</span>
            <span className={`font-mono font-extrabold text-sm ${group.balance_amount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
              ₹{group.balance_amount.toLocaleString()}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">🔴 Total Outflow</span>
            <span className="font-mono font-extrabold text-rose-600 text-sm">
              ₹{(group.total_payouts + group.total_expenses).toLocaleString()}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-[#5B3FD9] uppercase tracking-wider block">Net Profit</span>
            <span className="font-mono font-extrabold text-[#5B3FD9] text-sm">
              ₹{group.net_profit.toLocaleString()}
            </span>
          </div>

          {/* Expand/Collapse Button */}
          <div className="size-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Expanded Sections */}
      {isExpanded && (
        <div className="border-t border-[#E5E7EB] p-5 bg-gray-50/40 space-y-6 text-xs">
          {/* Header Action Bar with TWO DISTINCT BUTTONS */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div className="text-xs text-gray-600 font-medium">
              Last Receipt Date: <strong>{group.last_payment_date ? formatDate(group.last_payment_date) : 'No receipts yet'}</strong>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleGenerateInvoiceClick}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 flex items-center gap-1.5 transition-colors"
              >
                <FileText size={13} /> GST Invoice
              </button>

              {/* 🟢 RECORD RECEIPT (MONEY IN) */}
              <button
                onClick={() => setIsReceiptModalOpen(true)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors"
              >
                <ArrowDownLeft size={15} /> 🟢 Record Receipt (Money IN)
              </button>

              {/* 🔴 RECORD PAYMENT (MONEY OUT) */}
              <button
                onClick={() => setIsOutboundPaymentModalOpen(true)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-colors"
              >
                <ArrowUpRight size={15} /> 🔴 Record Payment (Money OUT)
              </button>
            </div>
          </div>

          {/* SECTION 1: CUSTOMER RECEIPTS (MONEY IN) */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CreditCard size={14} className="text-emerald-600" /> Section 1: Customer Receipts (Money IN)
              </h4>
              <div className="flex items-center gap-4 text-xs font-mono font-bold">
                <span className="text-gray-500">Total Received: <strong className="text-emerald-600">₹{group.amount_received.toLocaleString()}</strong></span>
                <span className="text-gray-500">Balance Due: <strong className="text-amber-600">₹{group.balance_amount.toLocaleString()}</strong></span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-emerald-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-50/50 border-b border-emerald-100 text-emerald-900 font-bold uppercase text-[10px]">
                    <th className="px-3.5 py-2.5">Receipt No</th>
                    <th className="px-3.5 py-2.5">Receipt Date</th>
                    <th className="px-3.5 py-2.5">Amount Received</th>
                    <th className="px-3.5 py-2.5">Mode</th>
                    <th className="px-3.5 py-2.5">Transaction Ref</th>
                    <th className="px-3.5 py-2.5">Received By</th>
                    <th className="px-3.5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50 bg-white">
                  {group.payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3.5 py-4 text-center text-gray-400 italic">
                        No customer receipts recorded yet.
                      </td>
                    </tr>
                  ) : (
                    group.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-emerald-700">
                          {p.receipt_number}
                        </td>
                        <td className="px-3.5 py-2.5 text-gray-700 font-medium">{formatDate(p.payment_date)}</td>
                        <td className="px-3.5 py-2.5 font-mono font-extrabold text-emerald-600">
                          ₹{p.amount.toLocaleString()}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold uppercase text-gray-800">
                          {PAYMENT_MODE_LABELS[p.payment_mode]}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-gray-500">{p.transaction_ref || '—'}</td>
                        <td className="px-3.5 py-2.5 text-gray-700 font-medium">{p.received_by}</td>
                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenReceiptPreview(p)}
                              title="View Receipt"
                              className="px-2 py-1 text-[11px] font-bold rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 transition-colors inline-flex items-center gap-1"
                            >
                              <Eye size={11} /> View
                            </button>

                            <button
                              onClick={() => handleEditReceipt(p)}
                              title="Edit Receipt"
                              className="px-2 py-1 text-[11px] font-bold rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 transition-colors inline-flex items-center gap-1"
                            >
                              <Pencil size={11} /> Edit
                            </button>

                            {canDeleteFinance && (
                              <button
                                onClick={() => handleDeleteReceipt(p)}
                                title="Delete Receipt"
                                className="p-1 text-[11px] font-bold rounded-lg border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 transition-colors inline-flex items-center"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: PROJECT PAYMENTS & EXPENSES (MONEY OUT) */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <Receipt size={14} className="text-rose-600" /> Section 2: Studio Project Payments & Expenses (Money OUT)
              </h4>
              <span className="font-mono text-xs font-bold text-rose-600">
                Total Outflow: ₹{(group.total_payouts + group.total_expenses).toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-rose-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-rose-50/50 border-b border-rose-100 text-rose-900 font-bold uppercase text-[10px]">
                    <th className="px-3.5 py-2.5">Category</th>
                    <th className="px-3.5 py-2.5">Paid To</th>
                    <th className="px-3.5 py-2.5">Particulars / Description</th>
                    <th className="px-3.5 py-2.5">Amount Paid</th>
                    <th className="px-3.5 py-2.5">Payment Date</th>
                    <th className="px-3.5 py-2.5">Payment Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-50 bg-white">
                  {group.payouts.length === 0 && group.expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3.5 py-4 text-center text-gray-400 italic">
                        No studio payments or project expenses recorded.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* Team Payouts */}
                      {group.payouts.map((po) => (
                        <tr key={po.id} className="hover:bg-rose-50/30 transition-colors">
                          <td className="px-3.5 py-2.5 font-bold text-rose-800">Team Payout</td>
                          <td className="px-3.5 py-2.5 font-bold text-gray-900">{po.employee_name}</td>
                          <td className="px-3.5 py-2.5 text-gray-700">{po.service_name}</td>
                          <td className="px-3.5 py-2.5 font-mono font-extrabold text-rose-600">₹{po.amount.toLocaleString()}</td>
                          <td className="px-3.5 py-2.5 text-gray-600">{po.payment_date ? formatDate(po.payment_date) : '—'}</td>
                          <td className="px-3.5 py-2.5 uppercase font-bold text-gray-700">{po.payment_mode || 'UPI'}</td>
                        </tr>
                      ))}

                      {/* Project Expenses */}
                      {group.expenses.map((pe) => (
                        <tr key={pe.id} className="hover:bg-rose-50/30 transition-colors">
                          <td className="px-3.5 py-2.5 font-bold text-amber-800">{pe.category}</td>
                          <td className="px-3.5 py-2.5 font-bold text-gray-900">{pe.paid_to}</td>
                          <td className="px-3.5 py-2.5 text-gray-700">{pe.description}</td>
                          <td className="px-3.5 py-2.5 font-mono font-extrabold text-rose-600">₹{pe.amount.toLocaleString()}</td>
                          <td className="px-3.5 py-2.5 text-gray-600">{formatDate(pe.expense_date)}</td>
                          <td className="px-3.5 py-2.5 uppercase font-bold text-gray-700">{PAYMENT_MODE_LABELS[pe.payment_mode]}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PROFIT SUMMARY CARD */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3.5 shadow-xs">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#5B3FD9] flex items-center gap-1.5">
              <TrendingUp size={15} /> Project Profit & Loss Breakdown
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Total Project Package Value</span>
                  <span className="font-mono font-bold text-gray-900">₹{group.package_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Less: Customer Discounts</span>
                  <span className="font-mono font-bold text-red-600">- ₹{group.discount_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Net Project Revenue</span>
                  <span className="font-mono font-bold text-emerald-600">₹{group.net_amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Less: Team Payouts</span>
                  <span className="font-mono font-bold text-rose-600">- ₹{group.total_payouts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Less: Shoot & Other Expenses</span>
                  <span className="font-mono font-bold text-rose-600">- ₹{group.total_expenses.toLocaleString()}</span>
                </div>
                <div className="pt-2 flex justify-between items-center bg-purple-50/60 p-3 rounded-xl border border-purple-100">
                  <div>
                    <span className="text-[10px] font-bold text-purple-700 uppercase block">Net Project Profit</span>
                    <span className="font-mono font-extrabold text-base text-[#5B3FD9]">
                      ₹{group.net_profit.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-purple-700 uppercase block">Profit Margin</span>
                    <span className="font-mono font-extrabold text-sm text-emerald-600">
                      {group.profit_margin_percent}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Customer Receipt Modal (Money IN) */}
      {isReceiptModalOpen && (
        <RecordReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          workOrderId={group.work_order_id}
          workOrderNumber={group.work_order_number}
          customerName={group.customer_name}
          balanceAmount={group.balance_amount}
          onSaved={onSaved}
        />
      )}

      {/* Record Outbound Payment Modal (Money OUT) */}
      {isOutboundPaymentModalOpen && (
        <RecordOutboundPaymentModal
          isOpen={isOutboundPaymentModalOpen}
          onClose={() => setIsOutboundPaymentModalOpen(false)}
          workOrderId={group.work_order_id}
          workOrderNumber={group.work_order_number}
          onSaved={onSaved}
        />
      )}

      {/* Edit Receipt Modal */}
      {editingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Pencil size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Edit Customer Receipt</h3>
                  <p className="text-xs text-gray-500 font-mono">{editingReceipt.receipt_number}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingReceipt(null)}
                className="size-8 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B3FD9] focus:outline-none font-mono font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B3FD9] focus:outline-none font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Mode *</label>
                <select
                  value={editMode}
                  onChange={(e) => setEditMode(e.target.value as PaymentMode)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B3FD9] focus:outline-none"
                >
                  {Object.entries(PAYMENT_MODE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Transaction Ref / Cheque No</label>
                <input
                  type="text"
                  value={editRef}
                  onChange={(e) => setEditRef(e.target.value)}
                  placeholder="e.g. UTR198471203"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B3FD9] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Remarks / Internal Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Notes regarding this financial modification..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B3FD9] focus:outline-none"
                />
              </div>
            </div>

            {/* STICKY FOOTER */}
            <div className="shrink-0 p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2.5 sticky bottom-0 z-20">
              <button
                onClick={() => setEditingReceipt(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedReceipt}
                disabled={!editDate.trim() || !editAmount || parseFloat(editAmount) <= 0}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check size={14} /> Update Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt / Invoice Printable Modal */}
      {previewDoc.isOpen && (
        <ReceiptInvoicePreviewModal
          isOpen={previewDoc.isOpen}
          onClose={() => setPreviewDoc({ ...previewDoc, isOpen: false })}
          type={previewDoc.type}
          receipt={previewDoc.receipt}
          invoice={previewDoc.invoice}
          customerMobile={group.mobile}
        />
      )}
      {/* Permission Denied Modal */}
      <PermissionDeniedModal
        isOpen={showPermissionDeniedModal}
        onClose={() => setShowPermissionDeniedModal(false)}
        recordType="Finance Record"
      />
    </div>
  )
}
