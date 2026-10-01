import { useState } from 'react'
import {
  X, Check, Download, MessageCircle, ExternalLink, ArrowRightCircle, AlertTriangle,
} from 'lucide-react'
import type { Quotation } from '@/types/quotation'
import {
  acceptQuotation,
  generateWhatsAppQuotationMessage,
  createWorkOrderFromQuotation,
  getQuotationPortalUrl,
} from '@/services/quotationStore'
import { downloadDocumentPDF } from '@/services/pdfGeneratorService'
import { RequestChangesModal } from './RequestChangesModal'
import { DeclineQuotationModal } from './DeclineQuotationModal'
import { QuotationTimeline } from './QuotationTimeline'
import { loadBusinessProfile } from '@/services/businessProfileStore'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface QuotationViewModalProps {
  isOpen: boolean
  onClose: () => void
  quotation: Quotation | null
  onQuotationUpdated?: (updated: Quotation) => void
}

export function QuotationViewModal({
  isOpen,
  onClose,
  quotation,
  onQuotationUpdated,
}: QuotationViewModalProps) {
  const navigate = useNavigate()
  const bizProfile = loadBusinessProfile()
  const [showRequestChanges, setShowRequestChanges] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isCreatingWO, setIsCreatingWO] = useState(false)

  if (!isOpen || !quotation) return null

  const portalUrl = getQuotationPortalUrl(quotation.quotation_number)

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      const res = await acceptQuotation(quotation.quotation_number)
      if (res.success && res.quotation) {
        toast.success(res.message)
        if (onQuotationUpdated) onQuotationUpdated(res.quotation)
      } else {
        toast.error(res.message)
      }
    } catch (e) {
      toast.error('Failed to accept quotation.')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleCreateWorkOrder = async () => {
    setIsCreatingWO(true)
    try {
      const res = await createWorkOrderFromQuotation(quotation.id)
      if (res.success && res.workOrder) {
        toast.success(`Work Order ${res.workOrder.work_order_number} created successfully! 🎉`)
        onClose()
        navigate(`/work-orders/${res.workOrder.id}`)
      } else {
        toast.error(res.error || 'Failed to create Work Order.')
      }
    } catch (e) {
      toast.error('Error creating Work Order.')
    } finally {
      setIsCreatingWO(false)
    }
  }

  const handleWhatsApp = () => {
    const text = generateWhatsAppQuotationMessage(quotation)
    const phone = quotation.mobile.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleDownloadPdf = () => {
    // Map Quotation to temporary WorkOrder interface format for PDF rendering
    const dummyWO: any = {
      id: quotation.id,
      work_order_number: quotation.quotation_number,
      project_name: `${quotation.customer_name} - ${quotation.event_type}`,
      customer_name: quotation.customer_name,
      mobile: quotation.mobile,
      email: quotation.email,
      event_type: quotation.event_type,
      booking_date: quotation.events[0]?.event_date || new Date().toISOString().split('T')[0],
      venue: quotation.events[0]?.venue || '',
      events: quotation.events,
      deliverables: quotation.deliverables,
      payment: {
        package_amount: quotation.package_amount,
        discount_amount: quotation.discount_amount,
        gst_applicable: false,
        gst_percent: 18,
        net_amount: quotation.final_amount,
        ledger: [],
      },
    }
    downloadDocumentPDF('quotation', dummyWO)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans text-xs">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-extrabold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-1 rounded-lg">
                {quotation.quotation_number}
              </span>
              <span className="text-xs font-bold text-gray-500">
                Status: <strong className="capitalize text-gray-900">{quotation.status.replace('_', ' ')}</strong>
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Quotation Document Body */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">

            {/* Header Brand - Company Details */}
            <div className="flex flex-wrap items-start justify-between gap-6 border-b border-gray-200 pb-6">
              <div className="space-y-2 max-w-md">
                <div className="flex items-center gap-3">
                  {bizProfile.logo_url && (
                    <img src={bizProfile.logo_url} alt="Logo" className="h-10 max-w-[140px] object-contain" />
                  )}
                  <div>
                    <h1 className="text-xl font-black text-[#111827] tracking-tight uppercase">
                      {bizProfile.brand_name || 'TRUFOCUS.PHOTOS'}
                    </h1>
                    {bizProfile.parent_company_line && (
                      <p className="text-[10px] font-bold text-[#5B3FD9] uppercase tracking-wider">
                        {bizProfile.parent_company_line}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-gray-600 space-y-0.5 pt-1">
                  {(bizProfile.address_line_1 || bizProfile.city) && (
                    <p className="font-medium text-gray-700">
                      📍 {[bizProfile.address_line_1, bizProfile.address_line_2, bizProfile.city, bizProfile.state, bizProfile.pincode].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-gray-600 font-medium text-[10px]">
                    {bizProfile.primary_mobile && <span>📞 {bizProfile.primary_mobile}</span>}
                    {bizProfile.email && <span>✉️ {bizProfile.email}</span>}
                    {bizProfile.website && <span>🌐 {bizProfile.website}</span>}
                  </div>
                  {bizProfile.gst_number && (
                    <p className="text-[10px] font-mono font-bold text-purple-700 pt-0.5">
                      GSTIN: {bizProfile.gst_number}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right space-y-1 shrink-0">
                <span className="inline-block text-[10px] font-extrabold px-3 py-1 rounded-full bg-purple-100 text-[#5B3FD9] uppercase tracking-wider">
                  PACKAGE PROPOSAL
                </span>
                <p className="text-xs text-gray-500 font-medium">Date: {new Date(quotation.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                {quotation.valid_until && (
                  <p className="text-[10px] text-gray-400 font-medium">Valid Until: {quotation.valid_until}</p>
                )}
              </div>
            </div>

            {/* Client & Event Info Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-gray-400 block mb-0.5">Prepared For</span>
                <p className="text-sm font-extrabold text-gray-900">{quotation.customer_name}</p>
                <p className="text-xs text-gray-600 font-medium">{quotation.mobile} {quotation.email ? `• ${quotation.email}` : ''}</p>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase text-gray-400 block mb-0.5">Event Project</span>
                <p className="text-sm font-extrabold text-gray-900">{quotation.event_type}</p>
                <p className="text-xs text-gray-600 font-medium">
                  {quotation.events[0]?.event_date ? new Date(quotation.events[0].event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBD'}
                  {quotation.events[0]?.venue ? ` • ${quotation.events[0].venue}` : ''}
                </p>
              </div>
            </div>

            {/* Event Inclusions (Checkmarks - NO PRICES) */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">
                PACKAGE INCLUDES
              </h3>

              <div className="space-y-4">
                {quotation.events.map((ev) => (
                  <div key={ev.id} className="p-4 rounded-2xl border border-gray-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-gray-900 text-xs uppercase text-[#5B3FD9]">
                        📅 {ev.event_type_name} ({ev.event_date})
                      </h4>
                      {ev.venue && <span className="text-[11px] text-gray-500 font-medium">📍 {ev.venue}</span>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {ev.services
                        .filter((s) => s.included !== false)
                        .map((srv) => (
                          <div key={srv.id} className="flex items-center gap-2 text-xs font-bold text-gray-800">
                            <span className="size-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-black shrink-0">
                              ✓
                            </span>
                            <span>{srv.service_name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables (Checkmarks) */}
            {quotation.deliverables.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">
                  PACKAGE DELIVERABLES
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quotation.deliverables
                    .filter((d) => d.is_included !== false)
                    .map((del) => (
                      <div key={del.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 bg-purple-50/40 text-xs font-bold text-purple-900">
                        <span className="size-4 rounded-full bg-[#5B3FD9] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          ✓
                        </span>
                        <span>{del.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* COMMERCIAL SUMMARY (Consolidated Package Amount ONLY) */}
            <div className="p-6 rounded-2xl bg-[#111827] text-white space-y-3 shadow-xl">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 border-b border-white/10 pb-2">
                COMMERCIAL PRICING SUMMARY
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="font-semibold">PACKAGE VALUE</span>
                  <span className="font-mono font-bold text-sm">₹{quotation.package_amount.toLocaleString('en-IN')}</span>
                </div>

                {quotation.discount_amount > 0 && (
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="font-semibold">SPECIAL DISCOUNT</span>
                    <span className="font-mono font-bold text-sm">- ₹{quotation.discount_amount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-white/15 flex items-center justify-between text-sm">
                  <span className="font-black text-white uppercase tracking-wider">FINAL PACKAGE AMOUNT</span>
                  <span className="font-mono font-black text-xl text-amber-400">₹{quotation.final_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            {quotation.payment_terms && quotation.payment_terms.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">
                  PAYMENT TERMS SCHEDULE
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {quotation.payment_terms.map((term, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-gray-200 bg-gray-50/70 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-400 block">{term.installment}</span>
                      <p className="font-mono font-extrabold text-[#5B3FD9] text-sm">₹{term.amount.toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terms & Conditions */}
            {quotation.terms_conditions && (
              <div className="space-y-2 text-xs text-gray-600">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">
                  TERMS & CONDITIONS
                </h3>
                <div className="prose prose-xs text-gray-600" dangerouslySetInnerHTML={{ __html: quotation.terms_conditions }} />
              </div>
            )}

            {/* Quotation Activity Timeline */}
            <div className="pt-4 border-t border-gray-200">
              <QuotationTimeline events={quotation.timeline || []} />
            </div>

          </div>

          {/* Footer Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} /> Download PDF
              </button>
              <button
                onClick={handleWhatsApp}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle size={13} /> Send WhatsApp
              </button>
              <button
                onClick={() => window.open(portalUrl, '_blank')}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-purple-200 bg-purple-50 text-[#5B3FD9] hover:bg-purple-100 flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink size={13} /> Portal Link
              </button>
            </div>

            <div className="flex items-center gap-2">
              {quotation.status === 'accepted' ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <Check size={14} /> Quotation Accepted
                  </span>
                  <button
                    disabled={isCreatingWO}
                    onClick={handleCreateWorkOrder}
                    className="px-4 py-2 text-xs font-extrabold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-md shadow-[#5B3FD9]/20 cursor-pointer"
                  >
                    <ArrowRightCircle size={14} /> {isCreatingWO ? 'Creating...' : 'Create Work Order'}
                  </button>
                </div>
              ) : quotation.status === 'rejected' ? (
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-100 text-rose-800 flex items-center gap-1">
                    <AlertTriangle size={14} /> Quotation Declined
                  </span>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowDeclineModal(true)}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                  >
                    Decline Quotation
                  </button>
                  <button
                    onClick={() => setShowRequestChanges(true)}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer"
                  >
                    Request Changes
                  </button>
                  <button
                    disabled={isAccepting}
                    onClick={handleAccept}
                    className="px-5 py-2 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Check size={15} /> {isAccepting ? 'Accepting...' : 'Accept Quotation'}
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      <RequestChangesModal
        isOpen={showRequestChanges}
        onClose={() => setShowRequestChanges(false)}
        quotationNumber={quotation.quotation_number}
        onSubmitted={() => {
          setShowRequestChanges(false)
          onClose()
        }}
      />

      <DeclineQuotationModal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        quotationNumber={quotation.quotation_number}
        onSubmitted={() => {
          setShowDeclineModal(false)
          onClose()
        }}
      />
    </>
  )
}
