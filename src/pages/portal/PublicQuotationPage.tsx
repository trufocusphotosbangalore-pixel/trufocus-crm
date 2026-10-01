import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Check, Download, MessageCircle, Sparkles, AlertCircle,
} from 'lucide-react'
import type { Quotation } from '@/types/quotation'
import {
  getQuotationByNumber,
  markQuotationViewed,
  acceptQuotation,
  generateWhatsAppQuotationMessage,
} from '@/services/quotationStore'
import { downloadDocumentPDF } from '@/services/pdfGeneratorService'
import { RequestChangesModal } from '@/components/quotations/RequestChangesModal'
import { DeclineQuotationModal } from '@/components/quotations/DeclineQuotationModal'
import { loadBusinessProfile } from '@/services/businessProfileStore'
import { toast } from 'react-hot-toast'

export default function PublicQuotationPage() {
  const { quotationNumber } = useParams<{ quotationNumber: string }>()
  const navigate = useNavigate()

  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showRequestChanges, setShowRequestChanges] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const bizProfile = loadBusinessProfile()

  const loadData = async () => {
    if (!quotationNumber) return
    setIsLoading(true)
    try {
      const qtn = await getQuotationByNumber(quotationNumber)
      if (qtn) {
        setQuotation(qtn)
        // Automatically mark as VIEWED in Supabase if status is sent or draft
        if (qtn.status === 'sent' || qtn.status === 'draft') {
          const viewed = await markQuotationViewed(quotationNumber)
          if (viewed) setQuotation(viewed)
        }
      }
    } catch (e) {
      console.error('Error loading quotation portal:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    const handleSync = () => loadData()
    window.addEventListener('trufocus_quotation_updated', handleSync)
    return () => window.removeEventListener('trufocus_quotation_updated', handleSync)
  }, [quotationNumber])

  const handleAccept = async () => {
    if (!quotation) return
    setIsAccepting(true)
    try {
      const res = await acceptQuotation(quotation.quotation_number)
      if (res.success && res.quotation) {
        setQuotation(res.quotation)
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (e) {
      toast.error('Failed to accept quotation.')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleDownloadPdf = () => {
    if (!quotation) return
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

  const handleWhatsApp = () => {
    if (!quotation) return
    const text = generateWhatsAppQuotationMessage(quotation)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
        <div className="flex items-center gap-3 text-sm text-[#5B3FD9] font-bold">
          <Sparkles className="animate-spin size-5" /> Loading Quotation Proposal...
        </div>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-2xl border border-gray-200 shadow-md">
          <AlertCircle className="size-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-extrabold text-gray-900">Quotation Proposal Not Found</h2>
          <p className="text-xs text-gray-500 font-medium">
            The requested quotation ({quotationNumber}) could not be found or has been updated.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] cursor-pointer"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-800 flex flex-col pb-20">
      
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {bizProfile.logo_url ? (
              <img src={bizProfile.logo_url} alt="Logo" className="h-9 max-w-[140px] object-contain" />
            ) : (
              <span className="font-black text-lg text-gray-900 tracking-tight">TRUFOCUS.PHOTOS</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-1 rounded-lg">
              {quotation.quotation_number}
            </span>
            <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
              quotation.status === 'accepted'
                ? 'bg-emerald-100 text-emerald-800'
                : quotation.status === 'rejected'
                ? 'bg-rose-100 text-rose-800'
                : quotation.status === 'change_requested'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-purple-100 text-[#5B3FD9]'
            }`}>
              {quotation.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </header>

      {/* Main Quotation Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10 space-y-8">
          
          {/* Header Banner - Business Brand & Contact Info */}
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-gray-200 pb-6">
            <div className="space-y-2 max-w-lg">
              <div className="flex items-center gap-3">
                {bizProfile.logo_url && (
                  <img src={bizProfile.logo_url} alt="Logo" className="h-10 max-w-[160px] object-contain" />
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase">
                    {bizProfile.brand_name || 'TRUFOCUS.PHOTOS'}
                  </h1>
                  {bizProfile.parent_company_line && (
                    <p className="text-[11px] font-semibold text-gray-500">
                      {bizProfile.parent_company_line}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-600 space-y-0.5 pt-1">
                {(bizProfile.address_line_1 || bizProfile.city) && (
                  <p className="font-medium text-gray-700">
                    📍 {[bizProfile.address_line_1, bizProfile.address_line_2, bizProfile.city, bizProfile.state, bizProfile.pincode].filter(Boolean).join(', ')}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-600 font-medium text-[11px]">
                  {bizProfile.primary_mobile && <span>📞 {bizProfile.primary_mobile}</span>}
                  {bizProfile.email && <span>✉️ {bizProfile.email}</span>}
                  {bizProfile.website && <span>🌐 {bizProfile.website}</span>}
                </div>
                {bizProfile.gst_number && (
                  <p className="text-[11px] font-mono font-bold text-purple-700 pt-0.5">
                    GSTIN: {bizProfile.gst_number}
                  </p>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1 shrink-0">
              <span className="inline-block text-[10px] font-extrabold px-3 py-1 rounded-full bg-purple-100 text-[#5B3FD9] uppercase tracking-wider">
                OFFICIAL PROPOSAL
              </span>
              <p className="text-xs text-gray-500 font-medium">Proposal Date: {new Date(quotation.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              {quotation.valid_until && (
                <p className="text-[11px] text-gray-400 font-medium">Valid Until: {quotation.valid_until}</p>
              )}
            </div>
          </div>

          {/* Client & Event Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block mb-0.5">Prepared For</span>
              <p className="text-base font-black text-gray-900">{quotation.customer_name}</p>
              <p className="text-xs text-gray-600 font-medium mt-0.5">{quotation.mobile} {quotation.email ? `• ${quotation.email}` : ''}</p>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block mb-0.5">Event Project</span>
              <p className="text-base font-black text-gray-900">{quotation.event_type}</p>
              <p className="text-xs text-gray-600 font-medium mt-0.5">
                {quotation.events[0]?.event_date ? new Date(quotation.events[0].event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBD'}
                {quotation.events[0]?.venue ? ` • ${quotation.events[0].venue}` : ''}
              </p>
            </div>
          </div>

          {/* PACKAGE INCLUDES (Checkmarks - NO PRICES) */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2">
              PACKAGE INCLUDES
            </h2>

            <div className="space-y-4">
              {quotation.events.map((ev) => (
                <div key={ev.id} className="p-5 rounded-2xl border border-gray-200 bg-white space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-gray-900 text-xs uppercase text-[#5B3FD9]">
                      📅 {ev.event_type_name} ({ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''})
                    </h3>
                    {ev.venue && <span className="text-[11px] text-gray-500 font-medium">📍 {ev.venue}</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {ev.services
                      .filter((s) => s.included !== false)
                      .map((srv) => (
                        <div key={srv.id} className="flex items-center gap-2.5 text-xs font-bold text-gray-800 p-2 rounded-xl bg-emerald-50/40 border border-emerald-100">
                          <span className="size-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
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

          {/* DELIVERABLES INCLUDED */}
          {quotation.deliverables.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2">
                PACKAGE DELIVERABLES
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quotation.deliverables
                  .filter((d) => d.is_included !== false)
                  .map((del) => (
                    <div key={del.id} className="flex items-center gap-3 p-3 rounded-2xl border border-purple-200 bg-purple-50/50 text-xs font-bold text-purple-950">
                      <span className="size-5 rounded-full bg-[#5B3FD9] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                        ✓
                      </span>
                      <span>{del.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* COMMERCIAL SUMMARY (Consolidated Package Amount ONLY) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0F172A] text-white space-y-4 shadow-xl">
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-400 border-b border-white/10 pb-3">
              PACKAGE COMMERCIAL PRICING
            </h2>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-gray-300">
                <span className="font-bold uppercase text-[11px] tracking-wider">PACKAGE VALUE</span>
                <span className="font-mono font-bold text-base">₹{quotation.package_amount.toLocaleString('en-IN')}</span>
              </div>

              {quotation.discount_amount > 0 && (
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="font-bold uppercase text-[11px] tracking-wider">SPECIAL DISCOUNT</span>
                  <span className="font-mono font-bold text-base">- ₹{quotation.discount_amount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="pt-4 border-t border-white/15 flex items-center justify-between">
                <span className="font-black text-white text-sm uppercase tracking-wider">FINAL PACKAGE AMOUNT</span>
                <span className="font-mono font-black text-2xl text-amber-400">₹{quotation.final_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          {quotation.payment_terms && quotation.payment_terms.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2">
                PAYMENT TERMS SCHEDULE
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {quotation.payment_terms.map((term, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/80 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 block">{term.installment}</span>
                    <p className="font-mono font-black text-[#5B3FD9] text-base">₹{term.amount.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          {quotation.terms_conditions && (
            <div className="space-y-2 text-xs text-gray-600">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2">
                TERMS & CONDITIONS
              </h2>
              <div className="prose prose-xs text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: quotation.terms_conditions }} />
            </div>
          )}

        </div>
      </main>

      {/* Floating Sticky Action Bar at Bottom */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl p-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download size={14} /> Download PDF
            </button>
            <button
              onClick={handleWhatsApp}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <MessageCircle size={14} /> Contact Trufocus
            </button>
          </div>

          <div className="flex items-center gap-2">
            {quotation.status === 'accepted' ? (
              <span className="px-4 py-2 text-xs font-extrabold rounded-xl bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                <Check size={16} /> Proposal Accepted
              </span>
            ) : quotation.status === 'rejected' ? (
              <span className="px-4 py-2 text-xs font-extrabold rounded-xl bg-rose-100 text-rose-800 flex items-center gap-1.5">
                Proposal Declined
              </span>
            ) : (
              <>
                <button
                  onClick={() => setShowDeclineModal(true)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 cursor-pointer"
                >
                  Decline Proposal
                </button>
                <button
                  onClick={() => setShowRequestChanges(true)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer"
                >
                  Request Changes
                </button>
                <button
                  disabled={isAccepting}
                  onClick={handleAccept}
                  className="px-6 py-2.5 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer transition-all"
                >
                  <Check size={16} /> {isAccepting ? 'Accepting...' : 'Accept Quotation'}
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      <RequestChangesModal
        isOpen={showRequestChanges}
        onClose={() => setShowRequestChanges(false)}
        quotationNumber={quotation.quotation_number}
        onSubmitted={() => {
          setShowRequestChanges(false)
          loadData()
        }}
      />

      <DeclineQuotationModal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        quotationNumber={quotation.quotation_number}
        onSubmitted={() => {
          setShowDeclineModal(false)
          loadData()
        }}
      />
    </div>
  )
}
