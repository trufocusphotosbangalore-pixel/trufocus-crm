import React, { useState, useMemo } from 'react'
import {
  X, ShoppingBag, Plus, Trash2, CheckCircle2, User, Mic, Camera,
} from 'lucide-react'
import { createDirectSalesInvoice } from '@/services/directSalesStore'
import { DirectSalesServicePickerModal } from '@/components/directSales/DirectSalesServicePickerModal'
import type {
  DirectSalesOrderType,
  DirectSalesPaymentMode,
  DirectSalesLineItem,
  DirectSalesSplitPayment,
  DirectSalesInvoice,
} from '@/types/directSales'
import { toast } from 'react-hot-toast'

interface DirectSalesPOSModalProps {
  isOpen: boolean
  onClose: () => void
  onInvoiceCreated: (invoice: DirectSalesInvoice) => void
}

export function DirectSalesPOSModal({
  isOpen,
  onClose,
  onInvoiceCreated,
}: DirectSalesPOSModalProps) {
  const [orderType, setOrderType] = useState<DirectSalesOrderType>('studio_expose')

  // Customer Details
  const [customerName, setCustomerName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [address, setAddress] = useState('')

  // Line Items
  const [items, setItems] = useState<DirectSalesLineItem[]>([])

  // Pricing Options
  const [isGstIncluded, setIsGstIncluded] = useState(true)

  // Payment Options
  const [paymentMode, setPaymentMode] = useState<DirectSalesPaymentMode>('upi')
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [isSplitPayment, setIsSplitPayment] = useState(false)
  const [splitCash, setSplitCash] = useState<number>(0)
  const [splitUpi, setSplitUpi] = useState<number>(0)
  const [splitCard, setSplitCard] = useState<number>(0)
  const [splitBank, setSplitBank] = useState<number>(0)
  const [notes, setNotes] = useState('')

  // Modal Picker State
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  // Calculated Invoice Totals
  const totals = useMemo(() => {
    let subtotal = 0
    let discount = 0
    let gstTotal = 0
    let grandTotal = 0

    items.forEach((item) => {
      const q = item.quantity || 1
      const p = item.unit_price || 0
      const d = item.discount_amount || 0
      const rate = item.gst_percent ?? 18

      const lineSub = Math.max(0, q * p - d)
      let lineGst = 0
      let lineTotal = lineSub

      if (isGstIncluded) {
        lineGst = Math.round(lineSub - lineSub / (1 + rate / 100))
        lineTotal = lineSub
      } else {
        lineGst = Math.round(lineSub * (rate / 100))
        lineTotal = lineSub + lineGst
      }

      subtotal += lineSub
      discount += d
      gstTotal += lineGst
      grandTotal += lineTotal
    })

    return { subtotal, discount, gstTotal, grandTotal }
  }, [items, isGstIncluded])

  if (!isOpen) return null

  const resetForm = () => {
    setCustomerName('')
    setMobile('')
    setEmail('')
    setGstNumber('')
    setAddress('')
    setItems([])
    setAmountPaid(0)
    setIsSplitPayment(false)
    setSplitCash(0)
    setSplitUpi(0)
    setSplitCard(0)
    setSplitBank(0)
    setNotes('')
  }

  const handleServiceSelected = (newItem: DirectSalesLineItem) => {
    setItems((prev) => [...prev, newItem])
    setAmountPaid((prev) => prev + newItem.total_amount)
  }

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handleUpdateItem = (id: string, updates: Partial<DirectSalesLineItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName.trim()) {
      toast.error('Please enter customer name.')
      return
    }

    if (items.length === 0) {
      toast.error('Please add at least one line item to the bill.')
      return
    }

    let splits: DirectSalesSplitPayment[] | undefined = undefined
    let effectiveAmountPaid = amountPaid

    if (isSplitPayment) {
      splits = []
      if (splitCash > 0) splits.push({ payment_mode: 'cash', amount: splitCash })
      if (splitUpi > 0) splits.push({ payment_mode: 'upi', amount: splitUpi })
      if (splitCard > 0) splits.push({ payment_mode: 'card', amount: splitCard })
      if (splitBank > 0) splits.push({ payment_mode: 'bank_transfer', amount: splitBank })

      effectiveAmountPaid = (splitCash || 0) + (splitUpi || 0) + (splitCard || 0) + (splitBank || 0)
    }

    const created = createDirectSalesInvoice({
      order_type: orderType,
      customer_name: customerName.trim(),
      mobile: mobile.trim() || undefined,
      email: email.trim() || undefined,
      gst_number: gstNumber.trim() || undefined,
      address: address.trim() || undefined,
      items,
      is_gst_included: isGstIncluded,
      payment_mode: isSplitPayment ? 'mixed' : paymentMode,
      amount_paid: effectiveAmountPaid,
      payment_splits: splits,
      notes: notes.trim() || undefined,
    })

    toast.success(`🎉 Created GST Invoice ${created.invoice_number}!`)
    onInvoiceCreated(created)
    resetForm()
    onClose()
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="p-3 rounded-2xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <ShoppingBag size={24} />
            </span>
            <div>
              <span className="font-mono font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-1 rounded-md text-xs">
                DIRECT SALES POS
              </span>
              <h1 className="ui-page-title text-[32px] font-extrabold text-[#111827]">Direct Sales POS Billing</h1>
              <p className="ui-small-label text-[13px] text-gray-500 mt-1">Walk-in Customer GST Billing & Instant Receipt Generation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="ui-button-text text-[15px] px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-2 cursor-pointer font-bold"
            >
              <X size={16} /> Cancel & Return
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="ui-button-text text-[15px] px-6 py-2.5 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 cursor-pointer font-extrabold"
            >
              <CheckCircle2 size={18} /> Generate & Save GST Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Form Content Body */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          {/* Order Type Switcher */}
          <div className="bg-gray-100 p-2 rounded-2xl grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setOrderType('studio_expose')
                setItems([])
              }}
              className={`py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                orderType === 'studio_expose'
                  ? 'bg-[#5B3FD9] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera size={16} /> Studio Expose (Rental, Portraits, Prints)
            </button>

            <button
              type="button"
              onClick={() => {
                setOrderType('podcast')
                setItems([])
              }}
              className={`py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                orderType === 'podcast'
                  ? 'bg-[#5B3FD9] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mic size={16} /> Podcast Studio (Recording, Multi-Cam, Shorts)
            </button>
          </div>

          {/* Section 1: Customer Info */}
          <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <User size={15} className="text-[#5B3FD9]" />
              <span>Customer Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Mobile Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="ramesh@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  placeholder="29AAAAA0000A1Z5"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-gray-700 font-bold mb-1">Billing Address</label>
                <input
                  type="text"
                  placeholder="Street, City, Pincode"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Reusable Service Picker Trigger */}
          <div className="flex items-center justify-between bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200">
            <div>
              <span className="font-extrabold text-sm text-[#5B3FD9] block">Add Line Items to Bill</span>
              <span className="text-gray-500 text-xs">Search existing services from catalog or add a new reusable service</span>
            </div>
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-md shadow-[#5B3FD9]/20 transition-all cursor-pointer"
            >
              <Plus size={16} /> Add Item (Search Catalog)
            </button>
          </div>

          {/* Section 3: Billing Line Items Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
            <div className="bg-gray-50/80 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="font-extrabold text-gray-800 text-xs">Line Items Billed ({items.length})</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-bold text-purple-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGstIncluded}
                    onChange={(e) => setIsGstIncluded(e.target.checked)}
                    className="size-4 accent-[#5B3FD9]"
                  />
                  <span>GST Included in Unit Price</span>
                </label>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center text-gray-400 italic">
                No items added to bill yet. Select an item from catalog above or click "Add Custom Service Item".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                      <th className="px-3 py-2">Item Name</th>
                      <th className="px-3 py-2 w-20">Qty</th>
                      <th className="px-3 py-2 w-28">Unit Price (₹)</th>
                      <th className="px-3 py-2 w-24">Discount (₹)</th>
                      <th className="px-3 py-2 w-20">GST %</th>
                      <th className="px-3 py-2 text-right w-28">Total (₹)</th>
                      <th className="px-3 py-2 text-center w-10">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.item_name}
                            onChange={(e) => handleUpdateItem(item.id, { item_name: e.target.value })}
                            className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                          />
                        </td>

                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                            className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900 text-center focus:outline-none focus:border-[#5B3FD9]"
                          />
                        </td>

                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => handleUpdateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                            className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                          />
                        </td>

                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={item.discount_amount}
                            onChange={(e) => handleUpdateItem(item.id, { discount_amount: parseFloat(e.target.value) || 0 })}
                            className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-gray-50 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                          />
                        </td>

                        <td className="px-3 py-2">
                          <select
                            value={item.gst_percent}
                            onChange={(e) => handleUpdateItem(item.id, { gst_percent: parseInt(e.target.value) || 0 })}
                            className="w-full h-8 px-1 rounded-lg border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </td>

                        <td className="px-3 py-2 text-right font-mono font-extrabold text-[#111827]">
                          ₹{(
                            Math.max(0, item.quantity * item.unit_price - item.discount_amount) +
                            (isGstIncluded ? 0 : Math.round(Math.max(0, item.quantity * item.unit_price - item.discount_amount) * (item.gst_percent / 100)))
                          ).toLocaleString()}
                        </td>

                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="size-7 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Totals Summary & Payment Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Section */}
            <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-gray-800">Payment Collection Mode</span>
                <label className="flex items-center gap-1.5 text-xs font-bold text-purple-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSplitPayment}
                    onChange={(e) => {
                      setIsSplitPayment(e.target.checked)
                      if (e.target.checked) setPaymentMode('mixed')
                    }}
                    className="size-4 accent-[#5B3FD9]"
                  />
                  <span>Mixed / Split Payment</span>
                </label>
              </div>

              {!isSplitPayment ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Payment Mode</label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value as DirectSalesPaymentMode)}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                      >
                        <option value="upi">UPI / GPay / PhonePe</option>
                        <option value="cash">Cash</option>
                        <option value="card">Credit / Debit Card</option>
                        <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Amount Collected (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white font-mono font-extrabold text-sm text-emerald-600 focus:outline-none focus:border-[#5B3FD9]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-gray-600 font-bold">Cash (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={splitCash}
                      onChange={(e) => setSplitCash(parseFloat(e.target.value) || 0)}
                      className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-bold">UPI / QR (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={splitUpi}
                      onChange={(e) => setSplitUpi(parseFloat(e.target.value) || 0)}
                      className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-bold">Card (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={splitCard}
                      onChange={(e) => setSplitCard(parseFloat(e.target.value) || 0)}
                      className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-bold">Bank Transfer (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={splitBank}
                      onChange={(e) => setSplitBank(parseFloat(e.target.value) || 0)}
                      className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-white font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-bold mb-1">Invoice Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Walk-in studio rental session..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-8 px-3 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>

            {/* Totals Summary Box */}
            <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-100 space-y-2 font-mono">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Subtotal (Net Items):</span>
                <span className="font-bold">₹{totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Total Item Discounts:</span>
                <span className="font-bold text-red-600">-₹{totals.discount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Total GST Tax ({isGstIncluded ? 'Inclusive' : 'Exclusive'}):</span>
                <span className="font-bold text-purple-700">₹{totals.gstTotal.toLocaleString()}</span>
              </div>
              <div className="border-t border-purple-200 pt-2 flex justify-between text-base font-extrabold text-[#111827]">
                <span>Grand Total:</span>
                <span className="text-[#5B3FD9]">₹{totals.grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-emerald-700 pt-1">
                <span>Amount Paid Today:</span>
                <span>₹{(isSplitPayment ? (splitCash + splitUpi + splitCard + splitBank) : amountPaid).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-red-600">
                <span>Balance Due:</span>
                <span>
                  ₹{Math.max(0, totals.grandTotal - (isSplitPayment ? (splitCash + splitUpi + splitCard + splitBank) : amountPaid)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-6 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="ui-button-text min-h-[44px] px-5 py-2.5 text-[15px] font-extrabold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ui-button-text min-h-[44px] px-6 py-2.5 text-[15px] font-extrabold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 transition-all cursor-pointer"
            >
              <CheckCircle2 size={18} /> Generate & Save GST Invoice
            </button>
          </div>
        </form>
      </div>

      {/* Service Selection Search Modal */}
      <DirectSalesServicePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        orderType={orderType}
        isGstIncluded={isGstIncluded}
        onServiceSelect={handleServiceSelected}
      />
    </div>
  )
}
