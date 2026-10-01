import { useState, useEffect } from 'react'
import {
  Phone, MessageCircle, MapPin, ExternalLink, Key, CheckCircle2, User,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { WOStatusBadge, PaymentStatusBadge } from '../WorkOrderBadges'
import type { WorkOrder } from '@/types/workOrders'
import { getOrCreatePortalForWorkOrder } from '@/services/customerPortalStore'

interface WorkOrderRightPanelProps {
  workOrder: WorkOrder
  onOpenPortal: () => void
  onSharePortal: () => void
}

export function WorkOrderRightPanel({
  workOrder,
  onOpenPortal,
  onSharePortal,
}: WorkOrderRightPanelProps) {
  const [portal, setPortal] = useState(() => getOrCreatePortalForWorkOrder(workOrder))

  useEffect(() => {
    setPortal(getOrCreatePortalForWorkOrder(workOrder))
    const handleUpdate = () => {
      setPortal(getOrCreatePortalForWorkOrder(workOrder))
    }
    window.addEventListener('trufocus_portal_updated', handleUpdate)
    return () => window.removeEventListener('trufocus_portal_updated', handleUpdate)
  }, [workOrder])

  const totalAmount = workOrder.payment?.package_amount || 0
  const paidAmount = workOrder.payment?.amount_received || 0
  const balanceAmount = workOrder.payment?.balance_amount || Math.max(0, totalAmount - paidAmount)
  const portalPin = portal.pin_code
  const portalUrl = portal.share_link

  const handleWhatsApp = () => {
    const phone = workOrder.mobile.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Hi ${workOrder.customer_name}, here is your Trufocus Customer Portal link:\n${portalUrl}\nYour 4-Digit PIN: ${portalPin}`
    )
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  return (
    <div className="w-full lg:w-80 shrink-0 space-y-4 font-sans">
      {/* Status & Financial Summary Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>
          <WOStatusBadge status={workOrder.status} />
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">Package Total</span>
            <span className="font-mono font-bold text-[#111827]">{formatCurrency(totalAmount, 'INR')}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 size={13} /> Paid
            </span>
            <span className="font-mono font-bold text-emerald-600">{formatCurrency(paidAmount, 'INR')}</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
            <span className="text-red-600 font-bold">Balance Due</span>
            <span className="font-mono font-bold text-red-600">{formatCurrency(balanceAmount, 'INR')}</span>
          </div>

          {/* Payment Status Pill */}
          <div className="pt-2 flex justify-end">
            <PaymentStatusBadge status={workOrder.payment_status} />
          </div>
        </div>
      </div>

      {/* Client Portal Quick Card */}
      <div className="bg-gradient-to-br from-[#5B3FD9]/5 to-[#5B3FD9]/10 rounded-2xl border border-[#5B3FD9]/20 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B3FD9]">Client Portal</h4>
          <span className="px-2 py-0.5 rounded-full bg-[#5B3FD9] text-white text-[10px] font-bold font-mono flex items-center gap-1">
            <Key size={10} /> PIN: {portalPin}
          </span>
        </div>

        <div className="pt-1 flex items-center justify-between text-[11px]">
          <span className="text-gray-500 font-medium">Acknowledgement:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded-md ${
              workOrder.acknowledgement?.acknowledged
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {workOrder.acknowledgement?.acknowledged ? '🟢 Acknowledged' : '🟡 Pending'}
          </span>
        </div>

        <p className="text-xs text-gray-600">
          Client can view payment ledger, deliverables, galleries, and contracts online.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onOpenPortal}
            className="flex-1 py-2 text-xs font-bold rounded-xl bg-white border border-[#5B3FD9]/30 text-[#5B3FD9] hover:bg-[#5B3FD9] hover:text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <ExternalLink size={13} /> Open Portal
          </button>
          <button
            onClick={onSharePortal}
            className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            Share Link
          </button>
        </div>
      </div>

      {/* Quick Action Links */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Quick Contact</span>

        <button
          onClick={handleWhatsApp}
          className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-2"
        >
          <MessageCircle size={14} className="text-emerald-600" /> WhatsApp Client
        </button>

        <a
          href={`tel:${workOrder.mobile}`}
          className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-2"
        >
          <Phone size={14} className="text-blue-600" /> Call {workOrder.customer_name}
        </a>

        {(() => {
          const mapUrl = workOrder.google_map_link || workOrder.events?.find((e) => e.google_map_link)?.google_map_link
          if (!mapUrl) return null
          return (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-2"
            >
              <MapPin size={14} className="text-purple-600" /> Google Maps Location
            </a>
          )
        })()}
      </div>

      {/* Assigned Coordinator */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Lead Coordinator</span>
        <div className="flex items-center gap-2.5 pt-1">
          <div className="size-9 rounded-full bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center font-bold text-xs">
            <User size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#111827]">Operations Manager</p>
            <p className="text-[10px] text-gray-400 font-medium">Studio Lead</p>
          </div>
        </div>
      </div>
    </div>
  )
}
