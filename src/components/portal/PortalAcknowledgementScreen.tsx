import { useState } from 'react'
import {
  Camera, ShieldCheck, FileText, CreditCard, LogOut, Package, User, ArrowRight, Video, Film, CheckCircle2, Tv, Mic, Sparkles, Aperture,
  Calendar, Clock, MapPin,
} from 'lucide-react'
import type { WorkOrder } from '@/types/workOrders'
import { acknowledgeWorkOrder } from '@/services/supabase/workOrders'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'

import { loadBusinessProfile } from '@/services/businessProfileStore'

interface PortalAcknowledgementScreenProps {
  workOrder: WorkOrder
  onAccepted: () => void
  onLogout: () => void
}

function getServiceIcon(serviceName: string) {
  const s = serviceName.toLowerCase()
  if (s.includes('drone')) return <Sparkles size={16} />
  if (s.includes('led') || s.includes('display')) return <Tv size={16} />
  if (s.includes('audio') || s.includes('sound') || s.includes('stream')) return <Mic size={16} />
  if (s.includes('video') || s.includes('cinematography') || s.includes('film')) return <Video size={16} />
  if (s.includes('reel') || s.includes('teaser')) return <Film size={16} />
  return <Aperture size={16} />
}

export function PortalAcknowledgementScreen({
  workOrder,
  onAccepted,
  onLogout,
}: PortalAcknowledgementScreenProps) {
  const bizProfile = loadBusinessProfile()
  const [signatureName, setSignatureName] = useState(workOrder.customer_name || '')
  const [isChecked, setIsChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const payment = workOrder.payment
  const pkgAmt = payment?.package_amount || 0
  const discAmt = payment?.discount_amount || 0
  const isGstApplicable = payment?.gst_applicable ?? false
  const gstPct = isGstApplicable ? (payment?.gst_percent || 0) : 0
  const gstAmt = isGstApplicable ? (pkgAmt * gstPct / 100) : 0
  const netAmt = Math.max(0, pkgAmt - discAmt + gstAmt)
  const paidAmt = (payment?.ledger || []).reduce((acc, cur) => acc + (cur.amount || 0), 0)
  const balanceAmt = Math.max(0, netAmt - paidAmt)

  const events = workOrder.events || []
  const includedDeliverables = (workOrder.deliverables || []).filter((d) => d.is_included !== false)

  const fullAddress = [
    bizProfile.address_line_1,
    bizProfile.address_line_2,
    bizProfile.landmark,
    bizProfile.city,
    bizProfile.state && bizProfile.pincode ? `${bizProfile.state} - ${bizProfile.pincode}` : bizProfile.pincode,
  ].filter(Boolean).join(', ') || '2934, Triveni Arcade, First Floor, 2nd Stage, Rajajinagar, Bangalore - 560010'



  const canSign = Boolean(signatureName.trim()) && isChecked && !isSubmitting

  const handleAccept = async () => {
    if (!canSign) return
    setIsSubmitting(true)

    // Detect browser & device
    const userAgent = navigator.userAgent
    let browser = 'Chrome'
    if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari'
    else if (userAgent.includes('Edg')) browser = 'Edge'

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const device = isMobile ? 'Mobile' : 'Desktop'

    try {
      const res = await acknowledgeWorkOrder(workOrder.id, signatureName.trim(), device, browser)

      setIsSubmitting(false)
      if (res.success) {
        toast.success('🎉 Agreement digitally signed & accepted successfully!')
        onAccepted()
      } else {
        toast.error(res.message)
      }
    } catch (e) {
      setIsSubmitting(false)
      toast.error('An error occurred while saving your signature. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] font-sans text-[#374151] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Top Header Branding */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs text-center space-y-3">
          {bizProfile.logo_url ? (
            <img
              src={bizProfile.logo_url}
              alt={bizProfile.business_name || 'Logo'}
              className="max-h-20 object-contain mx-auto mb-2"
            />
          ) : null}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] uppercase tracking-tight">
              {bizProfile.business_name || 'TRUFOCUS PHOTOGRAPHY'}
            </h1>
            {bizProfile.tagline && (
              <p className="text-xs font-bold text-[#5B3FD9] mt-0.5">{bizProfile.tagline}</p>
            )}
          </div>

          <div className="text-xs text-gray-500 font-medium max-w-xl mx-auto space-y-1">
            <p>{fullAddress}</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 font-semibold text-[#111827]">
              {bizProfile.primary_mobile && <span>📞 {bizProfile.primary_mobile}</span>}
              {bizProfile.email && <span>✉ {bizProfile.email}</span>}
              {bizProfile.website && <span>🌐 {bizProfile.website}</span>}
              {bizProfile.gst_number && <span className="font-mono text-[#5B3FD9]">GSTIN: {bizProfile.gst_number}</span>}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-2">
            <span className="text-[10px] font-extrabold uppercase text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-0.5 rounded-full border border-[#5B3FD9]/20">
              Digital Contract Signing
            </span>
            <span className="font-mono text-xs font-bold text-[#5B3FD9]">{workOrder.work_order_number}</span>
          </div>
        </div>

        {/* Project & Client Summary */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-5 text-xs">
          <h2 className="text-sm font-extrabold text-[#111827] border-b border-gray-100 pb-3 flex items-center gap-2">
            <FileText size={16} className="text-[#5B3FD9]" /> Project & Client Overview
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-0.5">Project Name</span>
              <span className="font-extrabold text-[#111827] text-sm">{workOrder.project_name}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-0.5">Customer Name</span>
              <span className="font-bold text-[#111827] flex items-center gap-1">
                <User size={13} className="text-[#5B3FD9]" /> {workOrder.customer_name}
              </span>
            </div>
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-0.5">Mobile Phone</span>
              <span className="font-mono font-medium text-gray-800">{workOrder.mobile}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-0.5">Event Type</span>
              <span className="font-semibold text-[#5B3FD9] bg-purple-50 px-2 py-0.5 rounded border border-purple-100">{workOrder.event_type}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-0.5">Shoot Date</span>
              <span className="font-medium text-gray-800">{events[0]?.event_date ? formatDate(events[0].event_date) : workOrder.booking_date || 'TBD'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-0.5">Lead Coordinator</span>
              <span className="font-bold text-gray-800">Operations Manager</span>
            </div>
          </div>
        </div>

        {/* Scheduled Events & Booked Services Section */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4 text-xs">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                <Camera size={16} className="text-[#5B3FD9]" /> Scheduled Events & Booked Services ({events.length} Events)
              </h2>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                Photography and videography coverage scheduled for each event with date, time, and venue details.
              </p>
            </div>
            <span className="text-[10px] font-bold text-[#5B3FD9] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
              Contract Event Schedule
            </span>
          </div>

          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-center font-medium">
                📷 Traditional & Candid Photography & Videography Coverage Included
              </div>
            ) : (
              events.map((evt, idx) => (
                <div
                  key={evt.id || idx}
                  className="p-4.5 rounded-2xl border border-[#E5E7EB] bg-white space-y-3.5 shadow-2xs hover:border-[#5B3FD9]/40 transition-colors"
                >
                  {/* Event Header with Date, Time & Venue */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-[#5B3FD9]" />
                        <h3 className="font-extrabold text-sm text-[#111827]">{evt.event_type_name || 'Scheduled Event'}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 font-medium">
                        <span className="flex items-center gap-1 text-[#5B3FD9]">
                          <Calendar size={13} /> <strong className="text-gray-900">{evt.event_date ? formatDate(evt.event_date) : 'Date TBD'}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock size={13} className="text-[#5B3FD9]" /> Time: <strong className="text-gray-800">{evt.event_time || 'Full Day / TBD'}</strong>
                        </span>
                        {evt.venue && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <MapPin size={13} className="text-[#5B3FD9]" /> Venue: <strong className="text-gray-800">{evt.venue}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-[#5B3FD9] bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">
                      {(evt.services || []).length} Services Booked
                    </span>
                  </div>

                  {/* Booked Services List for this Event */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(evt.services || []).length === 0 ? (
                      <p className="text-xs text-gray-400 italic col-span-2">Standard photography & videography coverage included.</p>
                    ) : (
                      evt.services.map((srv, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-3 rounded-xl border border-gray-100 bg-[#FAFAFC] flex items-center justify-between hover:bg-purple-50/20 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-purple-50 text-[#5B3FD9] flex items-center justify-center font-bold text-xs shrink-0">
                              {getServiceIcon(srv.service_name)}
                            </div>
                            <div>
                              <p className="font-bold text-[#111827] text-xs">{srv.service_name}</p>
                              <p className="text-[10px] text-gray-500 font-semibold">Quantity: {srv.quantity || 1}</p>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <CheckCircle2 size={10} className="text-emerald-600" /> Booked
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-extrabold text-[#111827] border-b border-gray-100 pb-3 flex items-center gap-2">
            <CreditCard size={16} className="text-[#5B3FD9]" /> Quotation & Payment Summary
          </h2>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[#FAFAFC] border border-[#E5E7EB] text-center">
            <div>
              <span className="block text-[10px] font-bold uppercase text-gray-400">Package Total</span>
              <span className="font-mono text-sm font-extrabold text-[#111827]">₹{netAmt.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-emerald-600">Advance Received</span>
              <span className="font-mono text-sm font-extrabold text-emerald-600">₹{paidAmt.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-red-600">Balance Due</span>
              <span className="font-mono text-sm font-extrabold text-red-600">₹{balanceAmt.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Expected Deliverables & Timeline */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-extrabold text-[#111827] border-b border-gray-100 pb-3 flex items-center gap-2">
            <Package size={16} className="text-[#5B3FD9]" /> Expected Deliverables & Timeline ({includedDeliverables.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {includedDeliverables.length === 0 ? (
              <p className="text-gray-400 text-xs italic col-span-2 py-2">No specific deliverables selected for this Work Order.</p>
            ) : (
              includedDeliverables.map((item) => (
                <div key={item.id} className="p-3 rounded-xl border border-purple-100 bg-purple-50/50 flex items-center justify-between font-medium">
                  <span className="font-bold text-[#111827]">{item.name}</span>
                  <span className="text-[10px] font-semibold text-[#5B3FD9] bg-white px-2 py-0.5 rounded border border-purple-100">✓ Included</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Important Terms & Conditions Box */}
        <div className="bg-purple-50/50 rounded-2xl border border-purple-200 p-6 shadow-xs space-y-3 text-xs">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#5B3FD9] flex items-center gap-2">
            <ShieldCheck size={16} /> Studio Terms & Conditions
          </h2>

          <ul className="space-y-1.5 text-gray-700 text-[11px] leading-relaxed list-disc list-inside">
            <li><strong>Scope of Services:</strong> Shoot hours and coverage are specified in the event schedule and booked services list.</li>
            <li><strong>Payment Schedule:</strong> Remaining balance due must be cleared prior to final album & video handover.</li>
            <li><strong>Revisions & Edits:</strong> Standard photo color grading and album design revisions are included.</li>
            <li><strong>Copyright & Usage:</strong> Trufocus Studio retains portfolio rights unless otherwise agreed in writing.</li>
          </ul>
        </div>

        {/* DIGITAL CONTRACT ACCEPTANCE SECTION */}
        <div className="bg-white rounded-2xl border border-[#5B3FD9]/30 p-6 shadow-md shadow-[#5B3FD9]/5 space-y-5 text-xs">
          <div className="border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#5B3FD9] animate-pulse" />
              <h2 className="text-sm font-extrabold text-[#111827]">Digital Contract Acceptance</h2>
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-1 leading-relaxed">
              Please review your project details and digitally sign below to confirm your agreement with the quotation, services, payment schedule, deliverables, and terms & conditions.
            </p>
          </div>

          <div className="space-y-4">
            {/* Signature Name Input */}
            <div>
              <label className="block text-gray-800 font-bold mb-1.5">
                Type Your Full Name to Sign *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rajesh Kumar"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="w-full h-11 px-4 text-xs font-bold rounded-xl border border-gray-300 bg-gray-50 focus:bg-white text-[#111827] focus:outline-none focus:border-[#5B3FD9] shadow-2xs"
              />
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer select-none bg-purple-50/40 p-4 rounded-xl border border-purple-100">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="size-5 rounded border-gray-300 text-[#5B3FD9] focus:ring-[#5B3FD9] shrink-0 mt-0.5 cursor-pointer"
              />
              <span className="text-xs text-gray-800 font-semibold leading-relaxed">
                I have read and understood the quotation, booked services, payment schedule, deliverables, cancellation policy, and terms & conditions. I agree to proceed with Trufocus Photography.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <button
              onClick={onLogout}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
            >
              <LogOut size={14} /> Logout
            </button>

            <button
              onClick={handleAccept}
              disabled={!canSign}
              className={`px-6 py-3 text-xs font-extrabold rounded-xl text-white flex items-center gap-2 transition-all shadow-md ${
                canSign
                  ? 'bg-[#5B3FD9] hover:bg-[#4C34C3] shadow-[#5B3FD9]/25 cursor-pointer'
                  : 'bg-gray-300 opacity-60 cursor-not-allowed shadow-none'
              }`}
            >
              <span>{isSubmitting ? 'Signing Contract...' : '✔ Confirm & Digitally Sign Agreement'}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 text-center mt-6">
        © {new Date().getFullYear()} Trufocus Photography CRM. Secure Client Portal.
      </p>
    </div>
  )
}
