import { useState, useEffect } from 'react'
import {
  X, Check, Plus, Trash2, Calendar, Package, Sparkles,
} from 'lucide-react'
import type { Enquiry } from '@/types/enquiries'
import type {
  Quotation, QuotationFormData, QuotationStatus, DiscountType,
  QuotationEventItem, QuotationServiceItem, QuotationDeliverableItem,
} from '@/types/quotation'
import { createQuotation, updateQuotation } from '@/services/quotationStore'
import { toast } from 'react-hot-toast'

interface QuotationEditorModalProps {
  isOpen: boolean
  onClose: () => void
  enquiry?: Enquiry | null
  initialQuotation?: Quotation | null
  onSaved?: (quotation: Quotation) => void
}

const DEFAULT_SERVICES: QuotationServiceItem[] = [
  { id: 's1', service_id: 'srv-trad-photo', service_name: 'Traditional Photography', quantity: 1, included: true },
  { id: 's2', service_id: 'srv-cand-photo', service_name: 'Candid Photography', quantity: 1, included: true },
  { id: 's3', service_id: 'srv-trad-video', service_name: 'Traditional Videography', quantity: 1, included: true },
  { id: 's4', service_id: 'srv-cand-video', service_name: 'Candid Videography', quantity: 1, included: true },
  { id: 's5', service_id: 'srv-drone', service_name: 'Drone Aerial Coverage', quantity: 1, included: true },
]

const DEFAULT_DELIVERABLES: QuotationDeliverableItem[] = [
  { id: 'd1', name: 'Unlimited High Resolution Edited Photos', is_included: true },
  { id: 'd2', name: 'Cinematic Teaser & Highlight Film (4-5 mins)', is_included: true },
  { id: 'd3', name: 'Full Length Wedding Video Feature Film', is_included: true },
  { id: 'd4', name: 'Premium Flush Mount Photo Album (30 Sheets)', is_included: true },
  { id: 'd5', name: 'Online Cloud Customer Gallery Access', is_included: true },
]

export function QuotationEditorModal({
  isOpen,
  onClose,
  enquiry,
  initialQuotation,
  onSaved,
}: QuotationEditorModalProps) {
  const [customerName, setCustomerName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [eventType, setEventType] = useState('Wedding')
  const [validUntil, setValidUntil] = useState('')

  const [packageAmount, setPackageAmount] = useState<string>('85000')
  const [discountType, setDiscountType] = useState<DiscountType>('fixed')
  const [discountValue, setDiscountValue] = useState<string>('10000')

  const [events, setEvents] = useState<QuotationEventItem[]>([])
  const [deliverables, setDeliverables] = useState<QuotationDeliverableItem[]>([])

  const [newServiceName, setNewServiceName] = useState('')
  const [newDeliverableName, setNewDeliverableName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    if (initialQuotation) {
      setCustomerName(initialQuotation.customer_name)
      setMobile(initialQuotation.mobile)
      setEmail(initialQuotation.email || '')
      setEventType(initialQuotation.event_type || 'Wedding')
      setValidUntil(initialQuotation.valid_until || '')
      setPackageAmount(String(initialQuotation.package_amount || 85000))
      setDiscountType(initialQuotation.discount_type || 'fixed')
      setDiscountValue(String(initialQuotation.discount_value || 0))
      setEvents(initialQuotation.events || [])
      setDeliverables(initialQuotation.deliverables || [])
    } else if (enquiry) {
      setCustomerName(enquiry.customer_name)
      setMobile(enquiry.mobile)
      setEmail(enquiry.email || '')
      setEventType(enquiry.event_type || 'Wedding')
      setPackageAmount(enquiry.budget ? String(enquiry.budget) : '85000')
      setDiscountType('fixed')
      setDiscountValue('0')

      setEvents([
        {
          id: 'ev-1',
          event_type_name: enquiry.event_type || 'Wedding',
          event_date: enquiry.event_date || new Date().toISOString().split('T')[0],
          event_time: enquiry.event_time || '09:00',
          venue: enquiry.venue || enquiry.location || '',
          services: [...DEFAULT_SERVICES],
        },
      ])
      setDeliverables([...DEFAULT_DELIVERABLES])
    } else {
      setCustomerName('')
      setMobile('')
      setEmail('')
      setEventType('Wedding')
      setPackageAmount('85000')
      setDiscountType('fixed')
      setDiscountValue('10000')
      setEvents([
        {
          id: 'ev-1',
          event_type_name: 'Wedding',
          event_date: new Date().toISOString().split('T')[0],
          event_time: '09:00',
          venue: '',
          services: [...DEFAULT_SERVICES],
        },
      ])
      setDeliverables([...DEFAULT_DELIVERABLES])
    }
  }, [isOpen, enquiry, initialQuotation])

  if (!isOpen) return null

  // Commercial summary calculations
  const pkgVal = parseFloat(packageAmount) || 0
  const discVal = parseFloat(discountValue) || 0
  let calculatedDiscountAmt = 0
  if (discountType === 'percentage') {
    calculatedDiscountAmt = (pkgVal * discVal) / 100
  } else {
    calculatedDiscountAmt = discVal
  }
  const finalAmount = Math.max(0, pkgVal - calculatedDiscountAmt)

  const handleAddEvent = () => {
    setEvents((prev) => [
      ...prev,
      {
        id: 'ev-' + Date.now(),
        event_type_name: 'Reception',
        event_date: new Date().toISOString().split('T')[0],
        event_time: '18:00',
        venue: '',
        services: [...DEFAULT_SERVICES],
      },
    ])
  }

  const handleRemoveEvent = (id: string) => {
    if (events.length <= 1) {
      toast.error('Quotation must contain at least one event.')
      return
    }
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const handleToggleService = (eventId: string, serviceId: string) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev
        return {
          ...ev,
          services: ev.services.map((s) => (s.id === serviceId ? { ...s, included: !s.included } : s)),
        }
      })
    )
  }

  const handleAddCustomService = (eventId: string) => {
    if (!newServiceName.trim()) return
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev
        return {
          ...ev,
          services: [
            ...ev.services,
            {
              id: 'srv-' + Date.now(),
              service_id: 'custom-' + Date.now(),
              service_name: newServiceName.trim(),
              quantity: 1,
              included: true,
            },
          ],
        }
      })
    )
    setNewServiceName('')
  }

  const handleAddDeliverable = () => {
    if (!newDeliverableName.trim()) return
    setDeliverables((prev) => [
      ...prev,
      { id: 'del-' + Date.now(), name: newDeliverableName.trim(), is_included: true },
    ])
    setNewDeliverableName('')
  }

  const handleToggleDeliverable = (id: string) => {
    setDeliverables((prev) =>
      prev.map((d) => (d.id === id ? { ...d, is_included: !d.is_included } : d))
    )
  }

  const handleSave = async (statusOverride?: QuotationStatus) => {
    if (!customerName.trim()) {
      toast.error('Customer Name is required.')
      return
    }
    if (!mobile.trim()) {
      toast.error('Mobile Number is required.')
      return
    }

    setIsSubmitting(true)
    try {
      const formData: QuotationFormData = {
        enquiry_id: (enquiry?.id || initialQuotation?.enquiry_id) ?? undefined,
        enquiry_number: (enquiry?.enquiry_number || initialQuotation?.enquiry_number) ?? undefined,
        customer_name: customerName.trim(),
        mobile: mobile.trim(),
        whatsapp_number: mobile.trim(),
        email: email.trim(),
        event_type: eventType,
        valid_until: validUntil,
        status: statusOverride || initialQuotation?.status || 'sent',
        package_amount: pkgVal,
        discount_type: discountType,
        discount_value: discVal,
        discount_amount: calculatedDiscountAmt,
        final_amount: finalAmount,
        events,
        deliverables,
        payment_terms: [
          { installment: 'Booking Advance (20%)', amount: Math.round(finalAmount * 0.2), percentage: 20 },
          { installment: 'Before Shoot Date (60%)', amount: Math.round(finalAmount * 0.6), percentage: 60 },
          { installment: 'Final Album & Video Delivery (20%)', amount: Math.round(finalAmount * 0.2), percentage: 20 },
        ],
        terms_conditions: `<ul>
          <li>A non-refundable booking advance of 20% is required to secure event dates.</li>
          <li>Balance 60% amount payable on or before the event date.</li>
          <li>Remaining 20% payable upon final delivery of albums and edited videos.</li>
          <li>Raw photos drive & digital access delivered within 7 working days.</li>
        </ul>`,
        notes: '',
      }

      let res
      if (initialQuotation) {
        res = await updateQuotation(initialQuotation.id, formData as any)
      } else {
        res = await createQuotation(formData)
      }

      if (res.error || !res.data) {
        toast.error(res.error || 'Failed saving quotation.')
        setIsSubmitting(false)
        return
      }

      toast.success(initialQuotation ? 'Quotation updated successfully! 🎉' : 'Quotation created & saved to Supabase! 🎉')
      if (onSaved) onSaved(res.data)
      setCustomerName('')
      setMobile('')
      setEmail('')
      setEventType('Wedding')
      setPackageAmount('85000')
      setDiscountType('fixed')
      setDiscountValue('0')
      onClose()
    } catch (e: any) {
      console.error('Error saving quotation:', e)
      toast.error('Failed to save quotation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans text-xs">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-[#5B3FD9]/10 text-[#5B3FD9]">
                PACKAGE PRICING
              </span>
              <h2 className="text-base font-extrabold text-gray-900">
                {initialQuotation ? `Edit Quotation ${initialQuotation.quotation_number}` : 'Create New Quotation Proposal'}
              </h2>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
              Client receives consolidated package value. Individual service prices are hidden.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Section 1: Client Info */}
          <div className="space-y-3 bg-gray-50/60 p-4 rounded-2xl border border-gray-200">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#5B3FD9]" /> Client Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Mr. & Mrs. Nagaraj"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-white font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-white font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. nagaraj@gmail.com"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-white font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Events & Inclusions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-[#5B3FD9]" /> Events & Services Included
              </h3>
              <button
                type="button"
                onClick={handleAddEvent}
                className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-purple-50 text-[#5B3FD9] border border-purple-200 hover:bg-purple-100 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add Another Event
              </button>
            </div>

            {events.map((ev) => (
              <div key={ev.id} className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Event Name</label>
                      <input
                        type="text"
                        value={ev.event_type_name}
                        onChange={(e) => {
                          const val = e.target.value
                          setEvents((prev) => prev.map((item) => (item.id === ev.id ? { ...item, event_type_name: val } : item)))
                        }}
                        className="w-full h-8 px-2.5 text-xs rounded-lg border border-gray-200 font-bold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date</label>
                      <input
                        type="date"
                        value={ev.event_date}
                        onChange={(e) => {
                          const val = e.target.value
                          setEvents((prev) => prev.map((item) => (item.id === ev.id ? { ...item, event_date: val } : item)))
                        }}
                        className="w-full h-8 px-2.5 text-xs rounded-lg border border-gray-200 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Venue / Location</label>
                      <input
                        type="text"
                        value={ev.venue || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setEvents((prev) => prev.map((item) => (item.id === ev.id ? { ...item, venue: val } : item)))
                        }}
                        placeholder="e.g. Bangalore"
                        className="w-full h-8 px-2.5 text-xs rounded-lg border border-gray-200 font-medium"
                      />
                    </div>
                  </div>
                  {events.length > 1 && (
                    <button
                      onClick={() => handleRemoveEvent(ev.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg shrink-0 cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Services Checkbox List */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Services Included in Package (Check to Include):</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {ev.services.map((srv) => (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => handleToggleService(ev.id, srv.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          srv.included
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-gray-50 border-gray-200 text-gray-400 line-through'
                        }`}
                      >
                        <span className={`size-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          srv.included ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {srv.included ? '✓' : ''}
                        </span>
                        <span className="truncate">{srv.service_name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      placeholder="+ Add custom service (e.g. Live Streaming)"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      className="flex-1 h-8 px-2.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustomService(ev.id)}
                      className="px-3 py-1 text-xs font-bold rounded-lg bg-gray-900 text-white hover:bg-black cursor-pointer"
                    >
                      Add Service
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Section 3: Deliverables */}
          <div className="space-y-3 p-4 rounded-2xl border border-gray-200 bg-white">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Package size={14} className="text-[#5B3FD9]" /> Deliverables Included
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {deliverables.map((del) => (
                <button
                  key={del.id}
                  type="button"
                  onClick={() => handleToggleDeliverable(del.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    del.is_included
                      ? 'bg-purple-50/70 border-purple-300 text-purple-900 font-bold'
                      : 'bg-gray-50 border-gray-200 text-gray-400 line-through'
                  }`}
                >
                  <span className={`size-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    del.is_included ? 'bg-[#5B3FD9] text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {del.is_included ? '✓' : ''}
                  </span>
                  <span className="truncate">{del.name}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="+ Add custom deliverables (e.g. 2 Minute Instagram Teaser)"
                value={newDeliverableName}
                onChange={(e) => setNewDeliverableName(e.target.value)}
                className="flex-1 h-8 px-2.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleAddDeliverable}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-gray-900 text-white hover:bg-black cursor-pointer"
              >
                Add Deliverable
              </button>
            </div>
          </div>

          {/* Section 4: COMMERCIAL SUMMARY (Package-Based Pricing Only) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-900 text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-400">
                  COMMERCIAL SUMMARY
                </h3>
                <p className="text-[11px] text-purple-200">
                  Consolidated Package Pricing for Client View
                </p>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Single Package Amount
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Package Amount */}
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-purple-200 uppercase">
                  Package Amount (₹) *
                </label>
                <input
                  type="number"
                  value={packageAmount}
                  onChange={(e) => setPackageAmount(e.target.value)}
                  placeholder="e.g. 85000"
                  className="w-full h-10 px-3 font-mono font-bold text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Discount Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-extrabold text-purple-200 uppercase">
                    Discount
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                    className="text-[10px] bg-white/10 text-amber-300 font-bold border border-white/20 rounded px-1.5 py-0.5 focus:outline-none"
                  >
                    <option value="fixed" className="text-gray-900">Fixed ₹</option>
                    <option value="percentage" className="text-gray-900">Percentage %</option>
                  </select>
                </div>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 10000'}
                  className="w-full h-10 px-3 font-mono font-bold text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Final Amount (Auto Calculated) */}
              <div className="space-y-1 bg-white/10 p-3 rounded-xl border border-white/20 flex flex-col justify-center">
                <span className="block text-[10px] font-extrabold uppercase text-amber-300">
                  FINAL PACKAGE AMOUNT (AUTO)
                </span>
                <span className="font-mono text-xl font-extrabold text-white">
                  ₹{finalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {calculatedDiscountAmt > 0 && (
              <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1 pt-1">
                <Check size={13} /> Discount Applied: ₹{calculatedDiscountAmt.toLocaleString('en-IN')} ({discountType === 'percentage' ? `${discVal}% off` : 'Fixed discount'})
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave('draft')}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-purple-200 bg-purple-50 text-[#5B3FD9] hover:bg-purple-100 cursor-pointer"
            >
              Save as Draft
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave('sent')}
              className="px-5 py-2.5 text-xs font-extrabold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-md shadow-[#5B3FD9]/20 cursor-pointer"
            >
              <Check size={15} /> {isSubmitting ? 'Saving...' : 'Save & Create Quotation'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
