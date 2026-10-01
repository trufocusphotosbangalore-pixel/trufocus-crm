import React, { useState, useEffect, useCallback } from 'react'
import { Film, Upload, Search, Clock, ExternalLink } from 'lucide-react'
import { getCrewSession } from '@/services/crewSessionService'
import { DeliverableAssignmentService } from '@/services/deliverableAssignmentService'
import { updateDeliverableGallery } from '@/services/postProductionStore'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import type { PostProductionItem, DeliverableStatus } from '@/types/postProduction'
import { STATUS_COLORS, PRIORITY_COLORS } from '@/types/postProduction'
import { toast } from 'react-hot-toast'

export default function CrewMyEditingPage() {
  const [crewUser] = useState(() => getCrewSession())
  const [tasks, setTasks] = useState<PostProductionItem[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'in_editing' | 'review' | 'completed'>('all')
  const [previewUrl, setPreviewUrl] = useState('')
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadMyEditingTasks = useCallback(() => {
    if (!crewUser) return
    const list = DeliverableAssignmentService.getAssignmentsByEmployee(crewUser)
    setTasks(list)
  }, [crewUser])

  useRealtimeSync(loadMyEditingTasks)

  useEffect(() => {
    if (!crewUser) return
    loadMyEditingTasks()

    const unsubscribe = DeliverableAssignmentService.subscribeAssignments(loadMyEditingTasks)
    return () => unsubscribe()
  }, [crewUser, loadMyEditingTasks])

  const handleStatusChange = async (id: string, newStatus: DeliverableStatus) => {
    await DeliverableAssignmentService.updateTaskStatus(id, newStatus)
    toast.success(`Task status updated to ${newStatus.replace('_', ' ').toUpperCase()}! 🎉`)
    loadMyEditingTasks()
  }

  const handleUploadGallery = (e: React.FormEvent, taskId: string) => {
    e.preventDefault()
    if (!previewUrl.trim()) {
      toast.error('Please enter a valid link.')
      return
    }
    updateDeliverableGallery(taskId, previewUrl.trim())
    toast.success('Gallery / Drive link published to Client Portal! 🎉')
    setPreviewUrl('')
    setActiveTargetId(null)
    loadMyEditingTasks()
  }

  const filteredList = tasks.filter((t) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      t.customer_name?.toLowerCase().includes(q) ||
      t.work_order_number?.toLowerCase().includes(q) ||
      t.deliverable_name?.toLowerCase().includes(q) ||
      t.event_type?.toLowerCase().includes(q)

    if (!matchesSearch) return false

    if (activeTab === 'assigned') {
      return t.status === 'not_started' || t.status === 'pending' || t.status === 'assigned'
    }
    if (activeTab === 'in_editing') {
      return t.status === 'in_progress' || t.status === 'editing'
    }
    if (activeTab === 'review') {
      return t.status === 'ready_for_review' || t.status === 'review' || t.status === 'for_review' || t.status === 'client_approval'
    }
    if (activeTab === 'completed') {
      return t.status === 'completed' || t.status === 'delivered' || t.status === 'done'
    }

    return true
  })

  return (
    <div className="space-y-6 text-gray-900 font-sans max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Film size={24} className="text-[#5B3FD9]" /> Post-Production Workspace
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Single Source of Truth editing desk for Photo Editors, Video Editors, Album Designers & Data Managers.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search edit queue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#5B3FD9] focus:ring-1 focus:ring-[#5B3FD9] shadow-xs"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {[
          { key: 'all', label: `All Tasks (${tasks.length})` },
          { key: 'assigned', label: 'Assigned' },
          { key: 'in_editing', label: 'In Editing' },
          { key: 'review', label: 'Waiting Approval' },
          { key: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[#5B3FD9] text-white shadow-xs'
                : 'bg-slate-100 text-gray-600 hover:text-gray-900 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Post Production Editing Tasks List */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Film size={36} className="mx-auto text-[#5B3FD9] opacity-60" />
            <h4 className="font-extrabold text-base text-gray-900">No active post-production tasks assigned to you</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              When an administrator assigns deliverable tasks to you in CRM Post Production, they will automatically appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">WO Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Deliverable</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Publish Link / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredList.map((item) => {
                  const statusCfg = STATUS_COLORS[item.status] || STATUS_COLORS['Not Started']
                  const priorityCfg = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-mono font-extrabold text-[#5B3FD9]">
                        #{item.work_order_number}
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-900">
                        <div>
                          <span>{item.customer_name}</span>
                          <span className="text-[10px] text-gray-400 block font-normal">{item.event_type}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-900">
                        <div>
                          <span>{item.deliverable_name}</span>
                          <span className="text-[10px] text-gray-400 block font-medium truncate max-w-[200px]" title={item.specifications}>
                            {item.specifications}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${priorityCfg.bg}`}>
                          {priorityCfg.text}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Clock size={13} className="text-gray-400" />
                          <span>{item.due_date || 'TBD'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
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
                          onChange={(e) => handleStatusChange(item.id, e.target.value as DeliverableStatus)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border focus:outline-none cursor-pointer transition-colors ${statusCfg.bg} ${statusCfg.text}`}
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Editing</option>
                          <option value="ready_for_review">Ready For Review</option>
                          <option value="client_approval">Client Approval</option>
                          <option value="completed">Completed</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {activeTargetId === item.id ? (
                          <form onSubmit={(e) => handleUploadGallery(e, item.id)} className="inline-flex gap-1.5">
                            <input
                              type="url"
                              placeholder="Drive / Vimeo / Gallery URL..."
                              value={previewUrl}
                              onChange={(e) => setPreviewUrl(e.target.value)}
                              className="h-8 px-2.5 rounded-lg bg-slate-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                            />
                            <button
                              type="submit"
                              className="px-3 h-8 rounded-lg bg-[#5B3FD9] hover:bg-[#4C34C3] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Upload size={12} /> Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTargetId(null)}
                              className="px-2 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            {item.gallery?.url ? (
                              <a
                                href={item.gallery.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 rounded-lg border border-purple-200 bg-purple-50 text-[#5B3FD9] hover:bg-purple-100 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                              >
                                <ExternalLink size={12} /> View Link
                              </a>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTargetId(item.id)
                                setPreviewUrl(item.gallery?.url || '')
                              }}
                              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Upload size={13} /> {item.gallery?.url ? 'Update Link' : '+ Add Output Link'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
