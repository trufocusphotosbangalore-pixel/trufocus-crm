import React, { useState } from 'react'
import { X, CheckCircle2, IndianRupee, Upload } from 'lucide-react'
import type { PaymentMode, OutboundExpenseCategory } from '@/types/finances'
import { OUTBOUND_EXPENSE_CATEGORIES } from '@/types/finances'
import { addProjectExpense } from '@/services/financeStore'
import { getTeamMembers } from '@/services/teamStore'
import { toast } from 'react-hot-toast'

interface RecordOutboundPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  workOrderId: string
  workOrderNumber: string
  onSaved: () => void
}

export function RecordOutboundPaymentModal({
  isOpen,
  onClose,
  workOrderId,
  workOrderNumber,
  onSaved,
}: RecordOutboundPaymentModalProps) {
  const teamMembers = getTeamMembers()

  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState<OutboundExpenseCategory>('Freelancer Payment')
  const [selectedService, setSelectedService] = useState<string>('Traditional Photography Shoot')
  const [paidToType, setPaidToType] = useState<'team' | 'vendor'>('team')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(teamMembers[0]?.id || '')
  const [manualPaidTo, setManualPaidTo] = useState<string>('')
  const [amount, setAmount] = useState<number>(12000)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi')
  const [transactionRef, setTransactionRef] = useState<string>('')
  const [remarks, setRemarks] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount (> 0).')
      return
    }

    const payeeName =
      paidToType === 'team'
        ? teamMembers.find((m) => m.id === selectedEmployeeId)?.full_name || 'Team Member'
        : manualPaidTo || 'External Vendor'

    addProjectExpense({
      work_order_id: workOrderId,
      work_order_number: workOrderNumber,
      category,
      description: `${category} • ${selectedService}`,
      amount,
      expense_date: paymentDate,
      paid_to: payeeName,
      payment_mode: paymentMode,
      remarks,
    })

    toast.success(`🔴 Recorded Payment of ₹${amount.toLocaleString()} paid to ${payeeName}!`)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-rose-50/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
              <IndianRupee size={20} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-rose-950 flex items-center gap-2">
                🔴 Record Outbound Payment <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">Money OUT</span>
              </h2>
              <p className="text-xs text-gray-500">
                {workOrderNumber} • Paid by Studio (Reduces Project Profit)
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Expense Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as OutboundExpenseCategory)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-rose-500"
              >
                {OUTBOUND_EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Service / Particulars (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Traditional Photography / Album Print / Outstation Cab"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Paid To *</label>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setPaidToType('team')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  paidToType === 'team'
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Assigned Team Member
              </button>
              <button
                type="button"
                onClick={() => setPaidToType('vendor')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  paidToType === 'vendor'
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                External Vendor
              </button>
            </div>

            {paidToType === 'team' ? (
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-rose-500"
              >
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.job_role})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                placeholder="Vendor Name (e.g. Canvera Press or Local Rental)"
                value={manualPaidTo}
                onChange={(e) => setManualPaidTo(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-rose-500"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 12000"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Payment Mode *</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-rose-500"
              >
                <option value="upi">UPI / Online</option>
                <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="credit_card">Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Transaction Reference / UTR</label>
            <input
              type="text"
              placeholder="e.g. UTR/98127391823"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-mono focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Remarks / Notes</label>
            <input
              type="text"
              placeholder="e.g. Final payout for 2-day shoot coverage"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Upload Bill / Invoice Proof (Optional)</label>
            <div className="relative border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors">
              <Upload size={14} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-600">
                {fileName || 'Choose vendor bill or invoice PDF/image...'}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
              />
            </div>
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
              className="px-5 h-9 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-colors"
            >
              <CheckCircle2 size={15} /> Save Outbound Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
