import { Pencil, MapPin, User, ShieldCheck, RotateCcw, CheckCircle2, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { WorkOrder } from '@/types/workOrders'
import { resetWorkOrderAcknowledgement } from '@/services/supabase/workOrders'
import { toast } from 'react-hot-toast'

interface OverviewTabProps {
  workOrder: WorkOrder
  onEditSection: () => void
}

export function OverviewTab({ workOrder, onEditSection }: OverviewTabProps) {
  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs relative">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Project & Client Information</h3>
            <p className="text-xs text-gray-500">Core details, contact information, and event venue</p>
          </div>
          <button
            onClick={onEditSection}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#E5E7EB] bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <Pencil size={13} /> Edit Section
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Work Order Number</span>
            <span className="font-mono font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2 py-0.5 rounded text-xs">
              {workOrder.work_order_number}
            </span>
          </div>

          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Project Name</span>
            <span className="font-bold text-[#111827] text-sm">{workOrder.project_name}</span>
          </div>

          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Customer Name</span>
            <span className="font-bold text-[#111827] flex items-center gap-1.5">
              <User size={13} className="text-gray-400" /> {workOrder.customer_name}
            </span>
          </div>

          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Mobile Phone</span>
            <a href={`tel:${workOrder.mobile}`} className="font-mono font-medium text-gray-700 hover:text-[#5B3FD9]">
              {workOrder.mobile}
            </a>
          </div>

          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Alternate Phone</span>
            <span className="font-mono text-gray-600">{workOrder.alternate_mobile || '—'}</span>
          </div>

          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Email Address</span>
            <span className="text-gray-700 font-medium">{workOrder.email || '—'}</span>
          </div>

          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Event Type</span>
            <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-full">{workOrder.event_type}</span>
          </div>

          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Booking Date</span>
            <span className="font-medium text-gray-700">{workOrder.booking_date ? formatDate(workOrder.booking_date) : '—'}</span>
          </div>

          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">City / Location</span>
            <span className="font-medium text-gray-700">{workOrder.city || '—'}</span>
          </div>

          <div className="lg:col-span-2">
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Venue Address</span>
            <p className="text-gray-700 font-medium">{workOrder.venue || '—'}</p>
          </div>

          {(() => {
            const mapUrl = workOrder.google_map_link || workOrder.events?.find((e) => e.google_map_link)?.google_map_link
            if (!mapUrl) return null
            return (
              <div>
                <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Google Maps</span>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5B3FD9] font-bold hover:underline flex items-center gap-1"
                >
                  <MapPin size={13} /> View Map Directions
                </a>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Customer Acknowledgement Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4 font-sans text-xs">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#5B3FD9]" />
            <h3 className="text-sm font-bold text-[#111827]">Customer Project Acknowledgement</h3>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              workOrder.acknowledgement?.acknowledged
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {workOrder.acknowledgement?.acknowledged ? '🟢 Acknowledged & Agreed' : '🟡 Pending Review'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <div>
            <span className="text-gray-400 font-bold uppercase text-[10px] block mb-0.5">Status</span>
            <span className="font-bold text-gray-800 flex items-center gap-1.5">
              {workOrder.acknowledgement?.acknowledged ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1"><CheckCircle2 size={14} /> Confirmed</span>
              ) : (
                <span className="text-amber-700 font-bold flex items-center gap-1"><Clock size={14} /> Action Pending</span>
              )}
            </span>
          </div>

          <div>
            <span className="text-gray-400 font-bold uppercase text-[10px] block mb-0.5">Acknowledged On</span>
            <span className="font-mono font-medium text-gray-800">
              {workOrder.acknowledgement?.acknowledged_at ? formatDate(workOrder.acknowledgement.acknowledged_at) : '—'}
            </span>
          </div>

          <div>
            <span className="text-gray-400 font-bold uppercase text-[10px] block mb-0.5">Acknowledged By</span>
            <span className="font-bold text-gray-800">
              {workOrder.acknowledgement?.customer_name || workOrder.customer_name}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-500 font-medium">
            {workOrder.acknowledgement?.device
              ? `Device: ${workOrder.acknowledgement.device} (${workOrder.acknowledgement.browser})`
              : 'Mandatory customer review before dashboard access.'}
          </p>

          <button
            onClick={async () => {
              if (confirm('Reset customer acknowledgement? The customer will be required to re-acknowledge project details upon their next login.')) {
                const res = await resetWorkOrderAcknowledgement(workOrder.id, 'Operations Manager')
                if (res.success) toast.success(res.message)
                else toast.error(res.message)
              }
            }}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-700 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw size={13} /> Reset / Force Re-acknowledgement
          </button>
        </div>
      </div>

      {/* Notes & Special Instructions */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <h3 className="text-sm font-bold text-[#111827]">Notes & Special Instructions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1.5">Internal Notes</span>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{workOrder.notes || 'No internal notes added.'}</p>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
            <span className="text-purple-600 font-bold uppercase tracking-wider block text-[10px] mb-1.5">Special Instructions</span>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{workOrder.special_instructions || 'No special instructions recorded.'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
