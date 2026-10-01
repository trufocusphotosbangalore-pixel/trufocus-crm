import {
  Clock, CheckCircle2, XCircle, MessageSquare, Eye, Send, FilePlus, ArrowRightCircle, User, ShieldCheck,
} from 'lucide-react'
import type { QuotationTimelineEvent } from '@/types/quotation'

interface QuotationTimelineProps {
  events?: QuotationTimelineEvent[]
}

const ACTION_ICONS = {
  created: FilePlus,
  sent: Send,
  viewed: Eye,
  change_requested: MessageSquare,
  accepted: CheckCircle2,
  rejected: XCircle,
  work_order_created: ArrowRightCircle,
}

const ACTION_COLORS = {
  created: 'bg-purple-100 text-[#5B3FD9]',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-indigo-100 text-indigo-700',
  change_requested: 'bg-amber-100 text-amber-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  work_order_created: 'bg-emerald-600 text-white',
}

const ACTION_LABELS = {
  created: 'Quotation Created',
  sent: 'Sent to Customer',
  viewed: 'Customer Viewed',
  change_requested: 'Customer Requested Changes',
  accepted: 'Customer Accepted',
  rejected: 'Customer Declined',
  work_order_created: 'Work Order Created',
}

export function QuotationTimeline({ events = [] }: QuotationTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-gray-400 italic bg-gray-50 rounded-xl border border-gray-200">
        No activity recorded yet for this quotation.
      </div>
    )
  }

  return (
    <div className="space-y-4 font-sans text-xs">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <Clock size={15} className="text-[#5B3FD9]" />
        <h3 className="font-extrabold text-[#111827] uppercase tracking-wider text-[11px]">
          Quotation Activity & Audit Log
        </h3>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
        {events.map((ev) => {
          const Icon = ACTION_ICONS[ev.action] || Clock
          const colorClass = ACTION_COLORS[ev.action] || 'bg-gray-100 text-gray-700'
          const label = ACTION_LABELS[ev.action] || ev.action

          const formattedTime = new Date(ev.timestamp).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })

          return (
            <div key={ev.id} className="relative flex items-start gap-3">
              {/* Timeline Bullet Icon */}
              <div
                className={`absolute -left-6 size-6 rounded-full flex items-center justify-center font-bold shadow-xs ${colorClass}`}
              >
                <Icon size={13} />
              </div>

              <div className="flex-1 p-3.5 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-extrabold text-gray-900 text-xs">{label}</span>
                  <span className="text-[10px] font-mono text-gray-400 font-medium">{formattedTime}</span>
                </div>

                {ev.actor_name && (
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                    {ev.actor === 'customer' ? <User size={12} className="text-purple-600" /> : <ShieldCheck size={12} className="text-blue-600" />}
                    <span>By: <strong className="text-gray-800">{ev.actor_name}</strong> ({ev.actor})</span>
                  </div>
                )}

                {ev.notes && (
                  <p className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 font-medium mt-1">
                    {ev.notes}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
