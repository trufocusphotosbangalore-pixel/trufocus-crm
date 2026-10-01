import { CheckCircle2, CircleDot } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { WorkOrder } from '@/types/workOrders'

interface TimelineTabProps {
  workOrder: WorkOrder
}

export function TimelineTab({ workOrder }: TimelineTabProps) {
  const timelineEntries = [
    { title: 'Enquiry Received & Registered', date: workOrder.created_at, user: 'System', status: 'completed' },
    { title: 'Quotation Generated & Shared', date: workOrder.created_at, user: 'Admin', status: 'completed' },
    { title: 'Advance Payment Received', date: workOrder.created_at, user: 'Razorpay / Portal', status: 'completed' },
    { title: 'Work Order Confirmed', date: workOrder.created_at, user: 'Operations Manager', status: 'completed' },
    { title: 'Crew & Equipment Assigned', date: workOrder.created_at, user: 'Studio Manager', status: 'completed' },
    { title: 'Event Photography Completed', date: workOrder.booking_date || workOrder.created_at, user: 'Photography Team', status: workOrder.status === 'completed' ? 'completed' : 'in_progress' },
    { title: 'Post-Production & Video Editing', date: null, user: 'Editing Dept', status: 'pending' },
    { title: 'Final Deliverables Uploaded', date: null, user: 'Studio Operations', status: 'pending' },
  ]

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-6">
        <div className="border-b border-[#E5E7EB] pb-4">
          <h3 className="text-base font-bold text-[#111827]">Project Life-Cycle Timeline</h3>
          <p className="text-xs text-gray-500">Chronological history from initial lead to final delivery</p>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
          {timelineEntries.map((entry, idx) => (
            <div key={idx} className="relative flex items-start gap-4 text-xs">
              <span className={`absolute -left-6 top-0.5 size-5 rounded-full flex items-center justify-center border-2 bg-white ${
                entry.status === 'completed' ? 'border-emerald-500 text-emerald-500' : entry.status === 'in_progress' ? 'border-[#5B3FD9] text-[#5B3FD9]' : 'border-gray-300 text-gray-300'
              }`}>
                {entry.status === 'completed' ? <CheckCircle2 size={12} /> : <CircleDot size={10} />}
              </span>

              <div className="flex-1 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#111827]">{entry.title}</h4>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {entry.date ? formatDate(entry.date) : 'Pending'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Logged by: {entry.user}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
