import { useState } from 'react'
import {
  X, CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '@/lib/utils'
import type { PostProductionItem } from '@/types/postProduction'
import { STATUS_COLORS, STATUS_LABELS } from '@/types/postProduction'
import { getLocalWorkOrders } from '@/services/supabase/workOrders'
import { getPostProductionItems, getDeliverableActivityLogs } from '@/services/postProductionStore'

interface DeliverableDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  item: PostProductionItem
  onUpdate: () => void
}

export function DeliverableDetailsDrawer({
  isOpen,
  onClose,
  item,
}: DeliverableDetailsDrawerProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'deliverables' | 'activity' | 'files' | 'notes'>('overview')

  if (!isOpen) return null

  // Fetch full Work Order info if available
  const allWorkOrders = getLocalWorkOrders()
  const wo = allWorkOrders.find((w) => w.id === item.work_order_id || w.work_order_number === item.work_order_number)

  // Fetch all deliverables for this Work Order
  const allPostItems = getPostProductionItems()
  const woDeliverables = allPostItems.filter(
    (d) => d.work_order_id === item.work_order_id || d.work_order_number === item.work_order_number
  )
  const completedCount = woDeliverables.filter(
    (d) => d.status === 'completed' || d.status === 'delivered' || d.status === 'done'
  ).length

  // Overall progress
  const totalCount = woDeliverables.length || 1
  const overallProgress = Math.round((completedCount / totalCount) * 100)

  // Activity logs
  const activityLogs = getDeliverableActivityLogs(item.id)

  const shootDateDisplay =
    (wo as any)?.event_date ||
    wo?.booking_date ||
    (wo?.events && wo.events[0] && wo.events[0].event_date) ||
    item.due_date

  const packageNameDisplay =
    (wo as any)?.package_name ||
    wo?.project_name ||
    'Premium Package'

  const handleOpenWorkOrder = () => {
    onClose()
    if (wo?.id || item.work_order_id) {
      navigate(`/work-orders/${wo?.id || item.work_order_id}`)
    } else {
      navigate('/work-orders')
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-gray-200 flex flex-col">
          {/* Drawer Header */}
          <div className="p-5 border-b border-gray-200 flex items-start justify-between bg-white">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-[#5B3FD9] bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-100">
                  {item.work_order_number}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {wo?.status || 'Editing'}
                </span>
              </div>

              <h2 className="text-lg font-extrabold text-[#111827] mt-1">{item.customer_name}</h2>
              <p className="text-xs text-gray-500 font-medium">{item.event_type || 'Corporate Event'}</p>
            </div>

            <button
              onClick={onClose}
              className="size-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Drawer Tabs Bar */}
          <div className="flex items-center gap-4 px-5 border-b border-gray-200 bg-gray-50/50 text-xs font-bold text-gray-500 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'overview' ? 'border-[#5B3FD9] text-[#5B3FD9]' : 'border-transparent hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('deliverables')}
              className={`py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'deliverables' ? 'border-[#5B3FD9] text-[#5B3FD9]' : 'border-transparent hover:text-gray-900'
              }`}
            >
              Deliverables <span className="size-4 rounded-full bg-purple-100 text-[#5B3FD9] text-[10px] font-mono flex items-center justify-center">{woDeliverables.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'activity' ? 'border-[#5B3FD9] text-[#5B3FD9]' : 'border-transparent hover:text-gray-900'
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'files' ? 'border-[#5B3FD9] text-[#5B3FD9]' : 'border-transparent hover:text-gray-900'
              }`}
            >
              Files
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'notes' ? 'border-[#5B3FD9] text-[#5B3FD9]' : 'border-transparent hover:text-gray-900'
              }`}
            >
              Notes
            </button>
          </div>

          {/* Drawer Body Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
            {/* Overview Section */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Shoot Date</span>
                <span className="font-extrabold text-[#111827] text-xs block mt-0.5">
                  {shootDateDisplay ? formatDate(shootDateDisplay) : 'Aug 7, 2026'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Client Contact</span>
                <span className="font-extrabold text-[#111827] text-xs block mt-0.5">
                  {wo?.mobile || item.mobile || '94816 46123'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">City</span>
                <span className="font-extrabold text-[#111827] text-xs block mt-0.5">
                  {wo?.city || 'Bengaluru'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Venue</span>
                <span className="font-extrabold text-[#111827] text-xs block mt-0.5">
                  {wo?.venue || item.customer_name || 'Hotel aasareinn'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Team</span>
                <span className="font-extrabold text-[#111827] text-xs block mt-0.5">
                  {item.assigned_editor_name || 'Yesu (Editor)'} + 2
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Package</span>
                <span className="font-extrabold text-[#111827] text-xs block mt-0.5">
                  {packageNameDisplay}
                </span>
              </div>
            </div>

            {/* Deliverables Summary Card */}
            <div className="space-y-3 p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-[#111827]">Deliverables Summary</h4>
                <span className="text-xs font-bold text-gray-500">
                  {completedCount} of {woDeliverables.length} Completed
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10B981] rounded-full transition-all"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>

              {/* Deliverable list */}
              <div className="space-y-2.5 pt-2">
                {woDeliverables.map((deliv) => {
                  const statusCfg = STATUS_COLORS[deliv.status] || STATUS_COLORS.not_started
                  return (
                    <div
                      key={deliv.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 size={16} className={deliv.status === 'completed' || deliv.status === 'delivered' ? 'text-emerald-500' : 'text-gray-300'} />
                        <span className="font-bold text-[#111827] truncate">{deliv.deliverable_name}</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${statusCfg.bg} ${statusCfg.text}`}>
                          {STATUS_LABELS[deliv.status] || deliv.status}
                        </span>
                        <span className="font-mono text-xs font-extrabold text-gray-700 w-8 text-right">
                          {deliv.progress_percent || 0}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setActiveTab('deliverables')}
                  className="text-xs font-extrabold text-[#5B3FD9] hover:underline cursor-pointer"
                >
                  View All Deliverables
                </button>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="space-y-3 p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-[#111827]">Recent Activity</h4>
                <button
                  onClick={() => setActiveTab('activity')}
                  className="text-xs font-extrabold text-[#5B3FD9] hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {activityLogs.length > 0 ? (
                  activityLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-xs">
                      <div className="size-7 rounded-full bg-[#5B3FD9] text-white flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">
                        {(log.user_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#111827]">{log.action}</p>
                        <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                          By {log.user_name} • {formatDate(log.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-start gap-3 text-xs">
                      <div className="size-7 rounded-full bg-[#5B3FD9] text-white flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">
                        Y
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#111827]">Yesu uploaded a draft for {item.deliverable_name}</p>
                        <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Today, 10:15 AM</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-xs">
                      <div className="size-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">
                        O
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#111827]">Owner moved {item.deliverable_name} to Internal Review</p>
                        <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Today, 09:40 AM</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Drawer Footer CTA */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <button
              onClick={handleOpenWorkOrder}
              className="w-full py-3 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-[#5B3FD9]/30 transition-all cursor-pointer"
            >
              Open Work Order Details <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
