import { Pencil, PackageCheck } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { WorkOrder } from '@/types/workOrders'
import { ProgressBar } from '../WorkOrderBadges'

interface DeliverablesTabProps {
  workOrder: WorkOrder
  onEditDeliverables: () => void
}

export function DeliverablesTab({ workOrder, onEditDeliverables }: DeliverablesTabProps) {
  const deliverables = (workOrder.deliverables || [])
    .filter((d) => d.is_included !== false)
    .map((d) => ({
      id: d.id,
      name: d.name,
      quantity: 1,
      status: d.is_delivered ? 'delivered' : 'pending',
      expected: d.due_date || workOrder.final_delivery_date,
      delivered: d.is_delivered ? workOrder.updated_at?.split('T')[0] : undefined,
    }))

  const completedCount = deliverables.filter(d => d.status === 'delivered' || d.status === 'completed').length
  const progressPercent = deliverables.length > 0 ? Math.round((completedCount / deliverables.length) * 100) : 0

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Deliverables & Output Status</h3>
            <p className="text-xs text-gray-500">Track raw files, edited photos, teaser, video, and album delivery progress</p>
          </div>
          <button
            onClick={onEditDeliverables}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Pencil size={13} /> Edit Deliverables
          </button>
        </div>

        <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#5B3FD9]">Overall Deliverables Progress</span>
            <p className="text-[11px] text-gray-500">{completedCount} of {deliverables.length} deliverables completed</p>
          </div>
          <div className="w-48">
            <ProgressBar value={progressPercent} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-3 py-2.5">Deliverable Name</th>
                <th className="px-3 py-2.5">Qty</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Expected Date</th>
                <th className="px-3 py-2.5">Delivered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {deliverables.map((item, i) => (
                <tr key={item.id || i} className="hover:bg-gray-50/80">
                  <td className="px-3 py-3 font-bold text-[#111827]">
                    <span className="flex items-center gap-2">
                      <PackageCheck size={14} className="text-[#5B3FD9]" />
                      {item.name}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono font-semibold text-gray-700">{item.quantity}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'delivered' || item.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : item.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-700 border border-blue-300'
                        : 'bg-amber-50 text-amber-700 border border-amber-300'
                    }`}>
                      {item.status === 'delivered' ? 'Delivered' : item.status === 'in_progress' ? 'In Editing' : 'Pending Shoot'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 font-medium">{item.expected ? formatDate(item.expected) : '—'}</td>
                  <td className="px-3 py-3 text-emerald-600 font-bold">{item.delivered ? formatDate(item.delivered) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
