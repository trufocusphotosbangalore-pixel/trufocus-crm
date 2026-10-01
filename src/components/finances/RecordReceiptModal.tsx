import React, { useState } from 'react'
import { X, CheckCircle2, IndianRupee, Upload } from 'lucide-react'
import type { PaymentMode } from '@/types/finances'
import { recordCustomerPayment } from '@/services/financeStore'
import { toast } from 'react-hot-toast'

interface RecordReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  workOrderId: string
  workOrderNumber: string
  customerName: string
  balanceAmount: number
  onSaved: () => void
}

export function RecordReceiptModal({
  isOpen,
  onClose,
  workOrderId,
  workOrderNumber,
  customerName,
  balanceAmount,
  onSaved,
}: RecordReceiptModalProps) {
  const [amount, setAmount] = useState<number>(balanceAmount > 0 ? balanceAmount : 25000)
  const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [receiptMode, setReceiptMode] = useState<PaymentMode>('upi')
  const [transactionRef, setTransactionRef] = useState<string>('')
  const [receivedBy, setReceivedBy] = useState<string>('Studio Admin')
  const [remarks, setRemarks] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid receipt amount (> 0).')
      return
    }

    const payment = recordCustomerPayment({
      work_order_id: workOrderId,
      work_order_number: workOrderNumber,
      customer_name: customerName,
      amount,
      payment_date: receiptDate,
      payment_mode: receiptMode,
      transaction_ref: transactionRef,
      received_by: receivedBy,
      remarks,
    })

    toast.success(`🟢 Recorded Receipt of ₹${amount.toLocaleString()}! Receipt #${payment.receipt_number} generated.`)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-emerald-50/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <IndianRupee size={20} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                🟢 Record Customer Receipt <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Money IN</span>
              </h2>
              <p className="text-xs text-gray-500">
                {workOrderNumber} • <strong>{customerName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Balance Alert */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-emerald-800 font-bold block text-xs">Current Balance Due</span>
              <span className="text-[11px] text-emerald-600">Receipt will reduce this balance</span>
            </div>
            <span className="font-mono font-extrabold text-base text-emerald-700">
              ₹{balanceAmount.toLocaleString()}
            </span>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Amount Received (₹) *</label>
            <input
              type="number"
              required
              min="1"
              max={balanceAmount > 0 ? balanceAmount * 2 : 1000000}
              placeholder="e.g. 50000"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-sm text-[#111827] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Receipt Date *</label>
              <input
                type="date"
                required
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Receipt Mode *</label>
              <select
                value={receiptMode}
                onChange={(e) => setReceiptMode(e.target.value as PaymentMode)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="upi">UPI / GPay / PhonePe</option>
                <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Transaction Reference / UTR Number</label>
            <input
              type="text"
              placeholder="e.g. UTR/50192831 or Cheque #10029"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Received By</label>
            <input
              type="text"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Remarks / Payment Purpose</label>
            <input
              type="text"
              placeholder="e.g. 2nd Installment payment for wedding shoot"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Upload Receipt Proof (Optional)</label>
            <div className="relative border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors">
              <Upload size={14} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-600">
                {fileName || 'Choose image/PDF receipt screenshot...'}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
              />
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="shrink-0 sticky bottom-0 z-20 pt-4 border-t border-gray-200 bg-white flex items-center justify-end gap-3 px-1 py-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 h-9 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
            >
              <CheckCircle2 size={15} /> Save Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
