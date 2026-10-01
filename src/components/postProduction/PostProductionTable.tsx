import { useState } from 'react'
import {
  Film, Camera, Image, Layers, User, Building, MoreVertical, Lock,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { PostProductionItem, DeliverableStatus } from '@/types/postProduction'
import { STATUS_COLORS, STATUS_LABELS } from '@/types/postProduction'
import { getTeamMembers } from '@/services/teamStore'
import {
  isGalleryUploadBlocked,
  isAlbumDesignBlocked,
  isCinematicFilmBlocked,
} from '@/services/postProductionStore'

interface PostProductionTableProps {
  items: PostProductionItem[]
  onStatusChange: (id: string, newStatus: DeliverableStatus) => void
  onAssignmentChange: (id: string, editorName: string) => void
  onOpenDrawer: (item: PostProductionItem) => void
}

function getDeliverableIcon(name: string) {
  const n = (name || '').toLowerCase()
  if (n.includes('film') || n.includes('video') || n.includes('reel') || n.includes('teaser')) return Film
  if (n.includes('photo') || n.includes('raw')) return Camera
  if (n.includes('album') || n.includes('gallery')) return Image
  return Layers
}

function getDueDateSubtext(dueDateStr?: string | null, status?: string): { text: string; color: string } {
  if (!dueDateStr) return { text: 'No due date', color: 'text-gray-400' }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDateStr)
  due.setHours(0, 0, 0, 0)
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (status === 'completed' || status === 'delivered' || status === 'done') {
    return { text: 'Completed', color: 'text-emerald-600 font-bold' }
  }

  if (diffDays < 0) {
    return { text: 'Overdue', color: 'text-red-600 font-bold' }
  } else if (diffDays === 0) {
    return { text: 'Due today', color: 'text-amber-600 font-bold' }
  } else if (diffDays === 1) {
    return { text: 'Due tomorrow', color: 'text-amber-600 font-medium' }
  } else {
    return { text: `${diffDays} days left`, color: 'text-emerald-600 font-medium' }
  }
}

export function PostProductionTable({
  items,
  onStatusChange,
  onAssignmentChange,
  onOpenDrawer,
}: PostProductionTableProps) {
  const activeTeamMembers = getTeamMembers().filter((m) => m.status === 'active')
  const [assigningId, setAssigningId] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center text-xs text-gray-500 font-sans">
        No post-production deliverables found matching the criteria.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden font-sans">
      {/* ─── Mobile View ─── */}
      <div className="md:hidden space-y-3 p-3 bg-[#FAFAFC]">
        {items.map((item) => {
          const statusCfg = STATUS_COLORS[item.status] || STATUS_COLORS['not_started']
          const dueSub = getDueDateSubtext(item.due_date, item.status)
          return (
            <div
              key={item.id}
              onClick={() => onOpenDrawer(item)}
              className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-3 cursor-pointer hover:border-[#5B3FD9] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-[#5B3FD9] bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                    {item.work_order_number}
                  </span>
                  <h4 className="text-xs font-extrabold text-[#111827] truncate max-w-[150px]">
                    {item.customer_name}
                  </h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${statusCfg.bg} ${statusCfg.text}`}>
                  {STATUS_LABELS[item.status] || item.status}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-[#111827]">{item.deliverable_name}</p>
                <p className="text-[11px] text-gray-500 truncate">{item.specifications || 'Standard specifications'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 font-medium pt-2 border-t border-gray-100">
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-mono block">Assigned Editor</span>
                  <span className="font-bold text-[#111827] block">{item.assigned_editor_name || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-mono block">Due Date</span>
                  <span className="font-bold text-[#111827] block">{item.due_date ? formatDate(item.due_date) : 'TBD'}</span>
                  <span className={`text-[10px] ${dueSub.color}`}>{dueSub.text}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div className="w-32 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#5B3FD9] h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, item.progress_percent || 0))}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-extrabold text-gray-700 font-mono">{item.progress_percent || 0}%</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenDrawer(item)
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 text-[#5B3FD9] border border-purple-200 font-extrabold text-[11px] flex items-center gap-1 hover:bg-purple-100 transition-colors"
                >
                  Open Task
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── Desktop Table View ─── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FAFAFC] border-b border-[#E5E7EB] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="px-4 py-3.5">WO NO.</th>
              <th className="px-4 py-3.5">CLIENT / EVENT</th>
              <th className="px-4 py-3.5">DELIVERABLE</th>
              <th className="px-4 py-3.5">ASSIGNED TO</th>
              <th className="px-4 py-3.5">PRIORITY</th>
              <th className="px-4 py-3.5">DUE DATE</th>
              <th className="px-4 py-3.5">STATUS</th>
              <th className="px-4 py-3.5">PROGRESS</th>
              <th className="px-4 py-3.5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {items.map((item) => {
              const statusConfig = STATUS_COLORS[item.status] || STATUS_COLORS.not_started
              const DelivIcon = getDeliverableIcon(item.deliverable_name)
              const dueSub = getDueDateSubtext(item.due_date, item.status)

              const pri = (item.priority || 'medium').toLowerCase()
              let priorityBadge = <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-gray-100 text-gray-700">LOW</span>
              if (pri === 'high') {
                priorityBadge = <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-50 text-red-600 border border-red-100">HIGH</span>
              } else if (pri === 'urgent') {
                priorityBadge = <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-200">URGENT</span>
              } else if (pri === 'medium') {
                priorityBadge = <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-50 text-blue-600 border border-blue-100">MEDIUM</span>
              }

              return (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                  {/* WO Number Badge */}
                  <td className="px-4 py-3.5 font-mono font-extrabold whitespace-nowrap">
                    <button
                      onClick={() => onOpenDrawer(item)}
                      title="Click to view details"
                      className="text-[#5B3FD9] bg-[#5B3FD9]/10 hover:bg-[#5B3FD9]/20 px-2.5 py-1 rounded-lg border border-[#5B3FD9]/20 transition-colors inline-block cursor-pointer"
                    >
                      {item.work_order_number}
                    </button>
                  </td>

                  {/* Client / Event */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                        <Building size={14} />
                      </div>
                      <div>
                        <span className="font-extrabold text-[#111827] block truncate max-w-[150px]">
                          {item.customer_name}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium block truncate max-w-[150px]">
                          {item.event_type || 'Event'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Deliverable */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-purple-50 text-[#5B3FD9] flex items-center justify-center shrink-0 border border-purple-100">
                        <DelivIcon size={14} />
                      </div>
                      <div>
                        <span className="font-extrabold text-[#111827] block truncate max-w-[170px]">
                          {item.deliverable_name}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium block truncate max-w-[170px]" title={item.specifications}>
                          {item.specifications || `${item.deliverable_name} for ${item.customer_name}`}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Assigned To */}
                  <td className="px-4 py-3.5">
                    <div className="relative">
                      {assigningId === item.id ? (
                        <select
                          autoFocus
                          value={item.assigned_editor_name || ''}
                          onBlur={() => setAssigningId(null)}
                          onChange={(e) => {
                            onAssignmentChange(item.id, e.target.value)
                            setAssigningId(null)
                          }}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold border border-[#5B3FD9] bg-white text-gray-900 focus:outline-none shadow-xs cursor-pointer"
                        >
                          <option value="">-- Unassigned --</option>
                          {activeTeamMembers.map((member) => (
                            <option key={member.id} value={member.full_name}>
                              {member.full_name} ({member.job_role || (member.job_roles && member.job_roles[0]) || 'Staff'})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setAssigningId(item.id)}
                          className="flex items-center gap-2 text-left cursor-pointer group-hover:opacity-100 transition-opacity"
                        >
                          <div className="size-7 rounded-full bg-[#5B3FD9] text-white flex items-center justify-center text-[10px] font-extrabold shrink-0 shadow-xs">
                            {item.assigned_editor_name ? item.assigned_editor_name.charAt(0).toUpperCase() : <User size={12} />}
                          </div>
                          <div>
                            <span className="font-extrabold text-[#111827] text-xs block leading-tight">
                              {item.assigned_editor_name || 'Unassigned'}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium block">
                              {item.assigned_editor_name ? 'Video Editor' : 'Click to assign'}
                            </span>
                          </div>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3.5">
                    {priorityBadge}
                  </td>

                  {/* Due Date */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-extrabold text-[#111827] text-xs block">
                      {item.due_date ? formatDate(item.due_date) : 'TBD'}
                    </span>
                    <span className={`text-[10px] block ${dueSub.color}`}>
                      {dueSub.text}
                    </span>
                  </td>

                  {/* Status Dropdown */}
                  <td className="px-4 py-3.5">
                    {(() => {
                      const galleryCheck = isGalleryUploadBlocked(item, items)
                      const albumCheck = isAlbumDesignBlocked(item, items)
                      const filmCheck = isCinematicFilmBlocked(item, items)
                      const lockInfo = galleryCheck.blocked ? galleryCheck : albumCheck.blocked ? albumCheck : filmCheck.blocked ? filmCheck : null

                      if (lockInfo && lockInfo.blocked) {
                        return (
                          <div
                            title={lockInfo.reason}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 cursor-not-allowed"
                          >
                            <Lock size={11} className="text-amber-600 shrink-0" />
                            <span>Locked</span>
                          </div>
                        )
                      }

                      return (
                        <select
                          value={
                            item.status === 'pending' || item.status === 'assigned'
                              ? 'not_started'
                              : item.status === 'editing'
                              ? 'in_progress'
                              : item.status === 'review' || item.status === 'for_review'
                              ? 'ready_for_review'
                              : item.status === 'done'
                              ? 'completed'
                              : item.status
                          }
                          onChange={(e) => onStatusChange(item.id, e.target.value as DeliverableStatus)}
                          className={`px-3 py-1 rounded-full text-[11px] font-extrabold border focus:outline-none cursor-pointer transition-colors ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="ready_for_review">Internal Review</option>
                          <option value="client_approval">Client Approval</option>
                          <option value="completed">Completed</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      )
                    })()}
                  </td>

                  {/* Progress Bar */}
                  <td className="px-4 py-3.5">
                    <div className="w-24 space-y-1">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#10B981] rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, item.progress_percent || 0))}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 font-mono block text-right">
                        {item.progress_percent || 0}%
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenDrawer(item)}
                        className="px-3 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5B3FD9] border border-purple-200 text-xs font-extrabold transition-colors cursor-pointer"
                      >
                        Open Task
                      </button>
                      <button
                        onClick={() => onOpenDrawer(item)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                        title="More options"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
