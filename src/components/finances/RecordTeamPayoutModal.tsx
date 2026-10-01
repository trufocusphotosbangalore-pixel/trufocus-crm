import React, { useState } from 'react'
import { X, User, CheckCircle2 } from 'lucide-react'
import type { PaymentMode, PayoutStatus } from '@/types/finances'
import { recordTeamPayout } from '@/services/financeStore'
import { getTeamMembers } from '@/services/teamStore'
import { toast } from 'react-hot-toast'

interface RecordTeamPayoutModalProps {
  isOpen: boolean
  onClose: () => void
  workOrderId: string
  workOrderNumber: string
  onSaved: () => void
}

export function RecordTeamPayoutModal({
  isOpen,
  onClose,
  workOrderId,
  workOrderNumber,
  onSaved,
}: RecordTeamPayoutModalProps) {
  const teamMembers = getTeamMembers()

  const [serviceName, setServiceName] = useState<string>('Traditional Photography')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(teamMembers[0]?.id || '')
  const [amount, setAmount] = useState<number>(15000)
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatus>('paid')
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi')
  const [remarks, setRemarks] = useState<string>('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payout amount (> 0).')
      return
    }

    const employee = teamMembers.find((m) => m.id === selectedEmployeeId)
    const empName = employee ? employee.full_name : 'Team Member'

    recordTeamPayout({
      work_order_id: workOrderId,
      work_order_number: workOrderNumber,
      service_id: `srv-${Date.now()}`,
      service_name: serviceName,
      employee_id: selectedEmployeeId,
      employee_name: empName,
      amount,
      payment_status: payoutStatus,
      payment_date: paymentDate,
      payment_mode: paymentMode,
      remarks,
    })

    toast.success(`Recorded ₹${amount.toLocaleString()} payout for ${empName}!`)
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
              <User size={20} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#111827]">Record Team Member Payout</h2>
              <p className="text-xs text-gray-500">{workOrderNumber}</p>
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
          <div>
            <label className="block text-gray-700 font-bold mb-1">Service / Deliverable *</label>
            <input
              type="text"
              required
              placeholder="e.g. Candid Photography / Photo Editing"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Assigned Team Member *</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-[#5B3FD9]"
            >
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.job_role})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Payout Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="15000"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Payment Status *</label>
              <select
                value={payoutStatus}
                onChange={(e) => setPayoutStatus(e.target.value as PayoutStatus)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-[#5B3FD9]"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending Payout</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-[#5B3FD9]"
              >
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Remarks</label>
            <input
              type="text"
              placeholder="e.g. Wedding event shoot payout..."
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
              <CheckCircle2 size={15} /> Save Team Payout
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
