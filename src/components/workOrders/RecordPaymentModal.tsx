import React, { useState } from 'react'
import { CreditCard, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { loadSettingsFromStorage } from '@/services/settingsStore'
import { recordWorkOrderPayment } from '@/services/supabase/workOrders'
import type { WorkOrder, WorkOrderPaymentLedger } from '@/types/workOrders'
import { toast } from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  workOrder?: WorkOrder
  onAddPayment?: (entry: WorkOrderPaymentLedger) => void
  onSuccess?: () => void
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  workOrder,
  onAddPayment,
  onSuccess,
}: RecordPaymentModalProps) {
  const settings = loadSettingsFromStorage()
  const activeModes = settings.paymentModes.filter((m) => m.is_active)

  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState(() => activeModes[0]?.name || 'UPI')
  const [transactionRef, setTransactionRef] = useState('')
  const [receivedBy, setReceivedBy] = useState('Studio Accounts')
  const [notes, setNotes] = useState('')
  const [receiptName, setReceiptName] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  if (!isOpen) return null

  const currentTotal = workOrder?.payment?.package_amount || 0
  const currentPaid = workOrder?.payment?.amount_received || 0
  const remainingBalance = workOrder?.payment?.balance_amount || Math.max(0, currentTotal - currentPaid)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptName(e.target.files[0].name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setValidationError('Payment amount must be greater than zero.')
      return
    }

    if (parsedAmount > remainingBalance && remainingBalance > 0) {
      setValidationError(`Payment amount (${formatCurrency(parsedAmount, 'INR')}) cannot exceed remaining balance (${formatCurrency(remainingBalance, 'INR')}).`)
      return
    }

    const requiresTxnRef = ['UPI', 'Bank Transfer', 'Cheque', 'Credit Card', 'Debit Card', 'Card'].some(
      (m) => paymentMode.toLowerCase().includes(m.toLowerCase())
    )

    if (requiresTxnRef && !transactionRef.trim()) {
      setValidationError(`Transaction Reference / UTR is required for ${paymentMode} payments.`)
      return
    }

    if (onAddPayment && !workOrder) {
      const newEntry: WorkOrderPaymentLedger = {
        id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        payment_date: paymentDate,
        amount: parsedAmount,
        payment_mode: paymentMode,
        transaction_ref: transactionRef,
        received_by: receivedBy,
        notes,
        receipt_url: receiptName ? `receipts/${receiptName}` : undefined,
        created_at: new Date().toISOString(),
      }
      onAddPayment(newEntry)
      onClose()
      return
    }

    if (!workOrder) {
      setValidationError('Work Order reference missing.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await recordWorkOrderPayment({
        workOrderId: workOrder.id,
        amount: parsedAmount,
        paymentDate,
        paymentMode,
        transactionRef: transactionRef.trim(),
        receivedBy: receivedBy.trim(),
        notes: notes.trim(),
        receiptUrl: receiptName ? `receipts/${receiptName}` : undefined,
      })

      if (res.error || !res.data) {
        setValidationError(res.error || 'Failed to record payment entry.')
        setIsSubmitting(false)
        return
      }

      // Success
      const { receiptNumber, balanceRemaining } = res.data

      toast.custom(
        (t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl border border-emerald-200 p-4 flex items-start gap-3 text-xs font-sans`}>
            <div className="size-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-bold text-gray-900 text-sm">✅ Payment Recorded Successfully</p>
              <p className="text-gray-600">
                Amount Received: <strong>{formatCurrency(parsedAmount, 'INR')}</strong> ({paymentMode})
              </p>
              <p className="text-gray-500 text-[11px]">
                Receipt No: <span className="font-mono font-bold text-[#5B3FD9]">{receiptNumber}</span> • Balance Remaining: <span className="font-mono font-bold text-red-600">{formatCurrency(balanceRemaining, 'INR')}</span>
              </p>
            </div>
          </div>
        ),
        { duration: 4500 }
      )

      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      setValidationError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
              <CreditCard size={24} />
            </span>
            <div>
              <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-xs">
                RECEIPT ENTRY
              </span>
              <h1 className="ui-page-title text-[32px] font-extrabold text-[#111827]">
                Record Payment {workOrder ? `— ${workOrder.work_order_number}` : ''}
              </h1>
              <p className="ui-small-label text-[13px] text-gray-500 mt-1">
                {workOrder ? <>Client: <strong>{workOrder.customer_name}</strong> • </> : ''}Remaining Balance: <span className="font-mono font-bold text-red-600">{formatCurrency(remainingBalance, 'INR')}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="ui-button-text text-[15px] px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-2 cursor-pointer font-bold"
            >
              Cancel & Return
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="ui-button-text text-[15px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer font-extrabold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Saving Payment...
                </>
              ) : (
                'Save Payment Entry'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Form Content Body */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Razorpay Quick Link */}
          <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between gap-2 text-xs">
            <div>
              <p className="font-bold text-[#111827]">Studio Payment Portal</p>
              <p className="text-[11px] text-gray-500 font-mono">https://razorpay.me/@Trufocusphotos</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('https://razorpay.me/@Trufocusphotos')
                  toast.success('Razorpay handle copied!')
                }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
              >
                Copy Link
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-gray-700">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max={remainingBalance > 0 ? remainingBalance : undefined}
                placeholder="e.g. 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-9 px-3 font-mono font-bold rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              >
                <option value="UPI">UPI / GooglePay / PhonePe</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cheque">Cheque</option>
                {activeModes.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">
                Transaction Reference / UTR
              </label>
              <input
                type="text"
                placeholder="UTR, cheque #, or transaction ID"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full h-9 px-3 font-mono rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-gray-700">
                Received By
              </label>
              <input
                type="text"
                placeholder="Staff name / accounts manager"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-gray-700">
                Notes / Remarks
              </label>
              <textarea
                rows={2}
                placeholder="Optional payment notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9] resize-none"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-gray-700">
                Upload Receipt (Optional)
              </label>
              <label className="flex items-center justify-center gap-2 h-14 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#5B3FD9] transition-colors bg-gray-50/50">
                <Upload size={16} className="text-gray-400" />
                <span className="text-xs text-gray-600 font-medium">
                  {receiptName ? receiptName : 'Click to upload payment receipt screenshot / PDF'}
                </span>
                <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="ui-button-text min-h-[44px] px-5 py-2.5 text-[15px] font-extrabold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="ui-button-text min-h-[44px] px-6 py-2.5 text-[15px] font-extrabold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Saving Payment...
                </>
              ) : (
                'Save Payment Entry'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
