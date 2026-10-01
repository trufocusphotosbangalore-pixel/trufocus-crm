import { useState } from 'react'
import {
  Pencil, Film, BookOpen, CheckCircle2, Clock, Play, Sparkles, CheckSquare,
} from 'lucide-react'
import type { PersonalEditingTask } from '@/types/personalQueue'
import { updateTaskStage } from '@/services/personalQueueStore'
import { toast } from 'react-hot-toast'

interface EditorWorkspaceProps {
  userName: string
  roleCategory: 'photo' | 'video' | 'album'
  tasks: PersonalEditingTask[]
  onRefresh: () => void
}

export function EditorWorkspace({
  userName,
  roleCategory,
  tasks,
  onRefresh,
}: EditorWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'picked_up' | 'in_progress' | 'ready_for_review' | 'completed'>('all')

  const title =
    roleCategory === 'photo'
      ? 'Photo Editor Workspace'
      : roleCategory === 'video'
      ? 'Video Editor Workspace'
      : 'Album Designer Workspace'

  const Icon = roleCategory === 'photo' ? Pencil : roleCategory === 'video' ? Film : BookOpen

  // Personal-Only Counters (NO global totals)
  const assignedTasks = tasks.filter((t) => t.stage === 'assigned')
  const pickedUpTasks = tasks.filter((t) => t.stage === 'picked_up')
  const editingTasks = tasks.filter((t) => t.stage === 'in_progress')
  const qcTasks = tasks.filter((t) => t.stage === 'ready_for_review')
  const completedTasks = tasks.filter((t) => t.stage === 'completed')

  // Filtered Personal List
  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'assigned') return t.stage === 'assigned'
    if (activeTab === 'picked_up') return t.stage === 'picked_up'
    if (activeTab === 'in_progress') return t.stage === 'in_progress'
    if (activeTab === 'ready_for_review') return t.stage === 'ready_for_review'
    if (activeTab === 'completed') return t.stage === 'completed'
    return true
  })

  // Handlers
  const handlePickWork = async (task: PersonalEditingTask) => {
    await updateTaskStage(
      task.id,
      task.work_order_id,
      task.work_order_number,
      task.deliverable_name,
      userName,
      'picked_up'
    )
    toast.success(`Picked up ${task.deliverable_name} for ${task.work_order_number}!`)
    onRefresh()
  }

  const handleStartWork = async (task: PersonalEditingTask) => {
    await updateTaskStage(
      task.id,
      task.work_order_id,
      task.work_order_number,
      task.deliverable_name,
      userName,
      'in_progress'
    )
    toast.success(`Started work on ${task.deliverable_name}!`)
    onRefresh()
  }

  const handleMarkReadyForReview = async (task: PersonalEditingTask) => {
    await updateTaskStage(
      task.id,
      task.work_order_id,
      task.work_order_number,
      task.deliverable_name,
      userName,
      'ready_for_review'
    )
    toast.success(`Submitted ${task.deliverable_name} for QC / Client Review!`)
    onRefresh()
  }

  const handleMarkCompleted = async (task: PersonalEditingTask) => {
    await updateTaskStage(
      task.id,
      task.work_order_id,
      task.work_order_number,
      task.deliverable_name,
      userName,
      'completed'
    )
    toast.success(`Marked ${task.deliverable_name} as COMPLETED! 🎉`)
    onRefresh()
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ─── HEADER BANNER ─── */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#5B3FD9] rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Icon size={30} className="text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
                Personal Post-Production Queue
              </span>
              <span className="text-xs text-purple-200">Logged in as {userName}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black mt-0.5">{title}</h1>
            <p className="text-xs text-purple-200 mt-1">
              Deliverables assigned directly to your editor queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/10 p-2 rounded-2xl border border-white/10 backdrop-blur-xs">
          <div className="text-center px-3">
            <span className="text-[10px] font-extrabold uppercase text-purple-300 block">My Queue</span>
            <span className="text-base font-black">{tasks.length}</span>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center px-3">
            <span className="text-[10px] font-extrabold uppercase text-amber-300 block">In Progress</span>
            <span className="text-base font-black text-amber-300">{editingTasks.length}</span>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center px-3">
            <span className="text-[10px] font-extrabold uppercase text-emerald-300 block">Done</span>
            <span className="text-base font-black text-emerald-300">{completedTasks.length}</span>
          </div>
        </div>
      </div>

      {/* ─── PERSONAL-ONLY STAT CARDS (EXACT REQUESTED METRICS) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            activeTab === 'assigned' ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/20' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider block">Assigned Tasks</span>
          <span className="text-xl font-black text-purple-600 mt-1 block">{assignedTasks.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('picked_up')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            activeTab === 'picked_up' ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block">Picked Up</span>
          <span className="text-xl font-black text-blue-600 mt-1 block">{pickedUpTasks.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('in_progress')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            activeTab === 'in_progress' ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">In Progress</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">{editingTasks.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('ready_for_review')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            activeTab === 'ready_for_review' ? 'bg-cyan-50 border-cyan-400 ring-2 ring-cyan-400/20' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-[10px] font-extrabold text-cyan-700 uppercase tracking-wider block">Ready for Review</span>
          <span className="text-xl font-black text-cyan-600 mt-1 block">{qcTasks.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            activeTab === 'completed' ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Completed</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">{completedTasks.length}</span>
        </button>
      </div>

      {/* ─── TASKS QUEUE LIST ─── */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
            <Icon size={40} className="mx-auto text-gray-300" />
            <h3 className="text-base font-bold text-gray-800">No deliverables in this queue</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Your editing workspace is currently clear for this filter tab.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isAssigned = task.stage === 'assigned'
            const isPickedUp = task.stage === 'picked_up'
            const isEditing = task.stage === 'in_progress'
            const isReview = task.stage === 'ready_for_review'
            const isDone = task.stage === 'completed'

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs bg-[#5B3FD9]/10 text-[#5B3FD9] px-2.5 py-1 rounded-lg">
                      {task.work_order_number}
                    </span>
                    <h3 className="font-bold text-sm text-gray-900">{task.deliverable_name}</h3>
                    <span className="text-xs text-gray-500">• Customer: <strong>{task.customer_name}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.priority === 'urgent' || task.priority === 'high' ? (
                      <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-md bg-rose-100 text-rose-700">
                        🔥 High Priority
                      </span>
                    ) : null}

                    {isAssigned && (
                      <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-purple-100 text-purple-700">
                        Assigned
                      </span>
                    )}
                    {isPickedUp && (
                      <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-blue-100 text-blue-700">
                        Picked Up
                      </span>
                    )}
                    {isEditing && (
                      <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-amber-100 text-amber-800">
                        In Progress
                      </span>
                    )}
                    {isReview && (
                      <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-cyan-100 text-cyan-800">
                        Ready for Review
                      </span>
                    )}
                    {isDone && (
                      <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Due Date</span>
                    <p className="font-bold text-gray-900 flex items-center gap-1">
                      <Clock size={13} className="text-purple-600" /> {task.due_date}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Assigned By</span>
                    <p className="font-bold text-gray-800">{task.assigned_by}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Progress</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full bg-[#5B3FD9] rounded-full transition-all duration-300"
                          style={{ width: `${task.progress_percent}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-xs text-gray-700">{task.progress_percent}%</span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar (EXACT REQUESTED BUTTONS) */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                  {isAssigned && (
                    <button
                      onClick={() => handlePickWork(task)}
                      className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckSquare size={14} /> Pick Work
                    </button>
                  )}

                  {isPickedUp && (
                    <button
                      onClick={() => handleStartWork(task)}
                      className="px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play size={14} /> Start Work
                    </button>
                  )}

                  {isEditing && (
                    <button
                      onClick={() => handleMarkReadyForReview(task)}
                      className="px-5 py-2.5 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles size={14} /> Mark Ready for Review
                    </button>
                  )}

                  {isReview && (
                    <button
                      onClick={() => handleMarkCompleted(task)}
                      className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={14} /> Mark Completed
                    </button>
                  )}

                  {isDone && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Task Completed
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
