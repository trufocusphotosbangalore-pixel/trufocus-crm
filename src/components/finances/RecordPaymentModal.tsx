import React, { useState } from 'react'
import { X, CheckCircle2, IndianRupee } from 'lucide-react'
import type { PaymentMode } from '@/types/finances'
import { recordCustomerPayment } from '@/services/financeStore'
import { toast } from 'react-hot-toast'

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  workOrderId: string
  workOrderNumber: string
  customerName: string
  balanceAmount: number
  onSaved: () => void
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  workOrderId,
  workOrderNumber,
  customerName,
  balanceAmount,
  onSaved,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<number>(balanceAmount > 0 ? balanceAmount : 25000)
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi')
  const [transactionRef, setTransactionRef] = useState<string>('')
  const [receivedBy, setReceivedBy] = useState<string>('Studio Admin')
  const [remarks, setRemarks] = useState<string>('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount (> 0).')
      return
    }

    const payment = recordCustomerPayment({
      work_order_id: workOrderId,
      work_order_number: workOrderNumber,
      customer_name: customerName,
      amount,
      payment_date: paymentDate,
      payment_mode: paymentMode,
      transaction_ref: transactionRef,
      received_by: receivedBy,
      remarks,
    })

    toast.success(`Recorded ₹${amount.toLocaleString()} payment! Receipt ${payment.receipt_number} generated.`)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <IndianRupee size={20} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#111827]">Record Payment Received</h2>
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
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3.5 flex items-center justify-between">
            <span className="text-purple-700 font-bold">Current Balance Due</span>
            <span className="font-mono font-extrabold text-base text-[#5B3FD9]">
              ₹{balanceAmount.toLocaleString()}
            </span>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              required
              min="1"
              max={balanceAmount > 0 ? balanceAmount * 2 : 1000000}
              placeholder="e.g. 50000"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-sm text-[#111827] focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Payment Mode *</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-[#5B3FD9]"
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
              placeholder="e.g. UTR/98127391823 or Cheque #10293"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-mono focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Received By</label>
            <input
              type="text"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Remarks / Notes</label>
            <input
              type="text"
              placeholder="e.g. Stage shoot advance payment..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 h-9 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-md shadow-[#5B3FD9]/20 transition-colors"
            >
              <CheckCircle2 size={15} /> Save Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
