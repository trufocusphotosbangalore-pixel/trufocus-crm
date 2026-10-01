import { useState, useEffect } from 'react'
import { Copy, RefreshCw, ShieldCheck, Pencil } from 'lucide-react'
import type { WorkOrder } from '@/types/workOrders'
import { getOrCreatePortalForWorkOrder, regeneratePortalPin } from '@/services/customerPortalStore'
import { toast } from 'react-hot-toast'

import { loadBusinessProfile } from '@/services/businessProfileStore'

interface ContractTabProps {
  workOrder: WorkOrder
  onEditContract: () => void
}

export function ContractTab({ workOrder, onEditContract }: ContractTabProps) {
  const bizProfile = loadBusinessProfile()
  const [portal, setPortal] = useState(() => getOrCreatePortalForWorkOrder(workOrder))

  useEffect(() => {
    setPortal(getOrCreatePortalForWorkOrder(workOrder))
    const handleUpdate = () => {
      setPortal(getOrCreatePortalForWorkOrder(workOrder))
    }
    window.addEventListener('trufocus_portal_updated', handleUpdate)
    return () => window.removeEventListener('trufocus_portal_updated', handleUpdate)
  }, [workOrder])

  const portalUrl = portal.share_link
  const pin = portal.pin_code
  const isSigned = workOrder.contract_status === 'signed'

  const fullAddress = [
    bizProfile.address_line_1,
    bizProfile.address_line_2,
    bizProfile.landmark,
    bizProfile.city,
    bizProfile.state && bizProfile.pincode ? `${bizProfile.state} - ${bizProfile.pincode}` : bizProfile.pincode,
  ].filter(Boolean).join(', ') || '2934, Triveni Arcade, First Floor, 2nd Stage, Rajajinagar, Bangalore - 560010'

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl)
    toast.success('Customer Portal link copied!')
  }

  const handleResetPin = () => {
    const newPin = regeneratePortalPin(portal.id)
    setPortal((prev) => ({ ...prev, pin_code: newPin }))
    toast.success(`✓ New 4-Digit Access PIN generated: ${newPin}`)
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Studio Letterhead Branding Header */}
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
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Photography Contract & Digital Agreement</h3>
            <p className="text-xs text-gray-500">Legal terms, digital signatures, portal PIN, and contract status</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEditContract}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#E5E7EB] bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <Pencil size={13} /> Edit Contract
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Agreement Status</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
              isSigned ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-amber-50 text-amber-700 border border-amber-300'
            }`}>
              {isSigned ? 'Digitally Signed & Confirmed' : 'Pending Signature'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Studio Signature</span>
            <span className="font-bold text-[#5B3FD9] flex items-center gap-1">
              <ShieldCheck size={14} /> Trufocus Photography Lead
            </span>
          </div>

          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
            <span className="text-purple-600 font-bold uppercase tracking-wider block text-[10px] mb-1">Customer Portal PIN</span>
            <span className="font-mono font-bold text-[#5B3FD9] text-base">{pin}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">Client Digital Portal Link</span>
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5"
              >
                <Copy size={13} /> Copy Link
              </button>
              <button
                onClick={handleResetPin}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-purple-700 flex items-center gap-1.5"
              >
                <RefreshCw size={13} /> Reset PIN
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-gray-200 font-mono text-xs text-gray-600 truncate">
            {portalUrl}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Standard Studio Terms & Conditions</h4>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-2 leading-relaxed">
            <p>1. <strong>Advance & Cancellation:</strong> Advance payments are non-refundable. Booking dates can be rescheduled subject to studio availability.</p>
            <p>2. <strong>Copyright & Licensing:</strong> Trufocus Photography retains copyright for promotional portfolio use unless explicitly bought out.</p>
            <p>3. <strong>Final Delivery:</strong> Edited high-res photos and videos will be delivered within 30 business days from raw selection completion.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
