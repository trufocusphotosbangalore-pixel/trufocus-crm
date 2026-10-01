import React, { useState } from 'react'
import { Receipt, CheckCircle2 } from 'lucide-react'
import type {
  PaymentMode,
  ProjectExpenseCategory,
  CompanyExpenseCategory,
} from '@/types/finances'
import {
  PROJECT_EXPENSE_CATEGORIES,
  COMPANY_EXPENSE_CATEGORIES,
} from '@/types/finances'
import { addProjectExpense, addCompanyExpense } from '@/services/financeStore'
import { toast } from 'react-hot-toast'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'project' | 'company'
  workOrderId?: string
  workOrderNumber?: string
  onSaved: () => void
}

export function AddExpenseModal({
  isOpen,
  onClose,
  type,
  workOrderId,
  workOrderNumber,
  onSaved,
}: AddExpenseModalProps) {
  const [projectCategory, setProjectCategory] = useState<ProjectExpenseCategory>('Travel')
  const [companyCategory, setCompanyCategory] = useState<CompanyExpenseCategory>('Office Rent')

  const [description, setDescription] = useState<string>('')
  const [vendor, setVendor] = useState<string>('')
  const [amount, setAmount] = useState<number>(5000)
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [paidTo, setPaidTo] = useState<string>('Vendor / Service Provider')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi')
  const [gstAmount, setGstAmount] = useState<number>(0)
  const [remarks, setRemarks] = useState<string>('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid expense amount.')
      return
    }

    if (type === 'project') {
      if (!workOrderId || !workOrderNumber) return
      addProjectExpense({
        work_order_id: workOrderId,
        work_order_number: workOrderNumber,
        category: projectCategory,
        description: description || projectCategory,
        amount,
        expense_date: expenseDate,
        paid_to: paidTo,
        payment_mode: paymentMode,
        remarks,
      })
      toast.success(`Recorded ${projectCategory} expense of ₹${amount.toLocaleString()} for ${workOrderNumber}!`)
    } else {
      addCompanyExpense({
        category: companyCategory,
        vendor: vendor || 'Vendor',
        amount,
        expense_date: expenseDate,
        gst_amount: gstAmount,
        remarks,
      })
      toast.success(`Recorded ${companyCategory} company expense of ₹${amount.toLocaleString()}!`)
    }

    onSaved()
    onClose()
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="p-3 rounded-2xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <Receipt size={24} />
            </span>
            <div>
              <span className="font-mono font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-1 rounded-md text-xs">
                {type === 'project' ? 'PROJECT EXPENSE' : 'COMPANY EXPENSE'}
              </span>
              <h1 className="ui-page-title text-[32px] font-extrabold text-[#111827]">
                {type === 'project' ? `Add Project Expense (${workOrderNumber})` : 'Add Studio Company Expense'}
              </h1>
              <p className="ui-small-label text-[13px] text-gray-500 mt-1">Record costs to update Net Profit calculations and financial reporting.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="ui-button-text text-[15px] px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-2 cursor-pointer font-bold"
            >
              Cancel & Return
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="ui-button-text text-[15px] px-6 py-2.5 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 cursor-pointer font-extrabold"
            >
              <CheckCircle2 size={18} /> Save Expense Record
            </button>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          {type === 'project' ? (
            <>
              <div>
                <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">Expense Category *</label>
                <select
                  value={projectCategory}
                  onChange={(e) => setProjectCategory(e.target.value as ProjectExpenseCategory)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-[#5B3FD9]"
                >
                  {PROJECT_EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">Description / Particulars</label>
                <input
                  type="text"
                  placeholder="e.g. Canvera photobook printing or crew travel cab fare"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">Paid To / Vendor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Canvera Press or Cab Agency"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">Expense Category *</label>
                <select
                  value={companyCategory}
                  onChange={(e) => setCompanyCategory(e.target.value as CompanyExpenseCategory)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-[#5B3FD9]"
                >
                  {COMPANY_EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">Vendor / Payee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Studio Property Landlord or Adobe Inc."
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">Expense Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">Expense Date *</label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-[#5B3FD9]"
            >
              <option value="upi">UPI / Online</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="credit_card">Card</option>
            </select>
          </div>

          {type === 'company' && (
            <div>
              <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">GST Amount (Optional ₹)</label>
              <input
                type="number"
                placeholder="900"
                value={gstAmount || ''}
                onChange={(e) => setGstAmount(parseFloat(e.target.value) || 0)}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 font-mono focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">Remarks</label>
            <input
              type="text"
              placeholder="e.g. Paid via UPI reference #9812739"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="ui-button-text min-h-[44px] px-5 py-2.5 text-[15px] font-extrabold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ui-button-text min-h-[44px] px-6 py-2.5 text-[15px] font-extrabold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 transition-colors cursor-pointer"
            >
              <CheckCircle2 size={18} /> Save Expense Record
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
