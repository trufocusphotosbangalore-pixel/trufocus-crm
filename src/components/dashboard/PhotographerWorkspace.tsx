import { useState } from 'react'
import {
  Camera, Video, MapPin, Phone, Calendar, Clock, CheckCircle2,
  Play, Check, X, Users, AlertTriangle,
} from 'lucide-react'
import type { PersonalShootTask } from '@/types/personalQueue'
import { updateTaskStage } from '@/services/personalQueueStore'
import { toast } from 'react-hot-toast'

interface PhotographerWorkspaceProps {
  userName: string
  userRole: 'photographer' | 'videographer'
  shoots: PersonalShootTask[]
  onRefresh: () => void
}

export function PhotographerWorkspace({
  userName,
  userRole,
  shoots,
  onRefresh,
}: PhotographerWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'picked_up' | 'in_progress' | 'completed'>('all')
  const [selectedTaskForNotes, setSelectedTaskForNotes] = useState<PersonalShootTask | null>(null)
  const [selectedTaskForReject, setSelectedTaskForReject] = useState<PersonalShootTask | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [cardSubmitted, setCardSubmitted] = useState(true)

  // Personal Counters ONLY (No global totals)
  const assignedCount = shoots.filter((s) => s.stage === 'assigned').length
  const pickedUpCount = shoots.filter((s) => s.stage === 'picked_up').length
  const inProgressCount = shoots.filter((s) => s.stage === 'in_progress').length
  const completedCount = shoots.filter((s) => s.stage === 'completed').length

  // Filtered Personal List
  const filteredShoots = shoots.filter((s) => {
    if (activeTab === 'assigned') return s.stage === 'assigned'
    if (activeTab === 'picked_up') return s.stage === 'picked_up'
    if (activeTab === 'in_progress') return s.stage === 'in_progress'
    if (activeTab === 'completed') return s.stage === 'completed'
    return true
  })

  // Handlers
  const handleAccept = async (shoot: PersonalShootTask) => {
    await updateTaskStage(
      shoot.id,
      shoot.work_order_id,
      shoot.work_order_number,
      `${shoot.service_name} (${shoot.event_type})`,
      userName,
      'picked_up'
    )
    toast.success(`Accepted assignment for ${shoot.work_order_number}! Manager notified.`)
    onRefresh()
  }

  const handleOpenReject = (shoot: PersonalShootTask) => {
    setSelectedTaskForReject(shoot)
    setRejectionReason('')
  }

  const handleConfirmReject = async () => {
    if (!selectedTaskForReject) return
    if (!rejectionReason.trim()) {
      toast.error('Please enter a reason for rejecting the assignment.')
      return
    }
    await updateTaskStage(
      selectedTaskForReject.id,
      selectedTaskForReject.work_order_id,
      selectedTaskForReject.work_order_number,
      `${selectedTaskForReject.service_name} (${selectedTaskForReject.event_type})`,
      userName,
      'rejected',
      undefined,
      rejectionReason.trim()
    )
    toast.success(`Assignment rejected. Manager notified.`)
    setSelectedTaskForReject(null)
    onRefresh()
  }

  const handleStartShoot = async (shoot: PersonalShootTask) => {
    await updateTaskStage(
      shoot.id,
      shoot.work_order_id,
      shoot.work_order_number,
      `${shoot.service_name} (${shoot.event_type})`,
      userName,
      'in_progress'
    )
    toast.success(`Shoot marked as IN PROGRESS / SHOOTING! 🎥`)
    onRefresh()
  }

  const handleOpenCompleteModal = (shoot: PersonalShootTask) => {
    setSelectedTaskForNotes(shoot)
    setCompletionNotes('')
    setCardSubmitted(true)
  }

  const handleConfirmComplete = async () => {
    if (!selectedTaskForNotes) return
    await updateTaskStage(
      selectedTaskForNotes.id,
      selectedTaskForNotes.work_order_id,
      selectedTaskForNotes.work_order_number,
      `${selectedTaskForNotes.service_name} (${selectedTaskForNotes.event_type})`,
      userName,
      'completed',
      `${cardSubmitted ? '[Memory Card Handed Over] ' : '[Card Pending] '}${completionNotes.trim()}`
    )
    toast.success(`Shoot completed! Memory card status updated. 🎉`)
    setSelectedTaskForNotes(null)
    onRefresh()
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ─── FIELD HEADER ─── */}
      <div className="bg-gradient-to-r from-[#5B3FD9] to-[#4C34C3] rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            {userRole === 'photographer' ? <Camera size={30} className="text-white" /> : <Video size={30} className="text-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white">
                Personal Field Queue
              </span>
              <span className="text-xs text-purple-200">Logged in as {userName}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black mt-0.5">
              {userRole === 'photographer' ? 'My Photographer Workspace' : 'My Videographer Workspace'}
            </h1>
            <p className="text-xs text-purple-100 mt-1">
              Field shoots assigned directly to your staff ID
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/10 backdrop-blur-xs">
          <div className="text-center px-3">
            <span className="text-[10px] font-extrabold uppercase text-purple-200 block">My Shoots</span>
            <span className="text-base font-black">{shoots.length}</span>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center px-3">
            <span className="text-[10px] font-extrabold uppercase text-amber-300 block">Shooting</span>
            <span className="text-base font-black text-amber-300">{inProgressCount}</span>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center px-3">
            <span className="text-[10px] font-extrabold uppercase text-emerald-300 block">Completed</span>
            <span className="text-base font-black text-emerald-300">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* ─── PERSONAL-ONLY STAT CARDS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            activeTab === 'all' ? 'bg-[#5B3FD9]/10 border-[#5B3FD9] ring-2 ring-[#5B3FD9]/20' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">Assigned To Me</span>
          <span className="text-xl font-black text-gray-900 mt-1 block">{shoots.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('assigned')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            activeTab === 'assigned' ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/20' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider block">Pending Accept</span>
          <span className="text-xl font-black text-purple-600 mt-1 block">{assignedCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('picked_up')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            activeTab === 'picked_up' ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block">Accepted</span>
          <span className="text-xl font-black text-blue-600 mt-1 block">{pickedUpCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('in_progress')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            activeTab === 'in_progress' ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">Shooting Now</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">{inProgressCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            activeTab === 'completed' ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Completed</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">{completedCount}</span>
        </button>
      </div>

      {/* ─── SHOOTS LIST ─── */}
      <div className="space-y-4">
        {filteredShoots.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
            <Camera size={40} className="mx-auto text-gray-300" />
            <h3 className="text-base font-bold text-gray-800">No Personal Shoots</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              You currently have no shoots assigned directly to your staff queue under this category.
            </p>
          </div>
        ) : (
          filteredShoots.map((shoot) => {
            const isAssigned = shoot.stage === 'assigned'
            const isPickedUp = shoot.stage === 'picked_up'
            const isShooting = shoot.stage === 'in_progress'
            const isDone = shoot.stage === 'completed'
            const isRejected = shoot.stage === 'rejected'

            return (
              <div
                key={shoot.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs p-5 space-y-4 ${
                  isShooting
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : isAssigned
                    ? 'border-purple-300 bg-purple-50/20'
                    : 'border-gray-200'
                }`}
              >
                {/* Header Info */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs bg-[#5B3FD9]/10 text-[#5B3FD9] px-2.5 py-1 rounded-lg">
                      {shoot.work_order_number}
                    </span>
                    <span className="font-bold text-sm text-gray-900">Client: {shoot.customer_name}</span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {isAssigned && (
                      <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-purple-100 text-purple-700 animate-pulse">
                        ⏳ New Assignment
                      </span>
                    )}
                    {isPickedUp && (
                      <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-blue-100 text-blue-700">
                        ✅ Accepted
                      </span>
                    )}
                    {isShooting && (
                      <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                        <span className="size-2 rounded-full bg-amber-600 animate-ping" /> Shooting In Progress
                      </span>
                    )}
                    {isDone && (
                      <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-red-100 text-red-700">
                        ❌ Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Shoot Event Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Event & Services</span>
                    <p className="font-bold text-gray-900 text-sm">{shoot.event_type}</p>
                    <p className="text-purple-700 font-semibold">{shoot.service_name} ({shoot.role_title || 'Crew Member'})</p>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Shoot Date & Time</span>
                    <p className="font-bold text-gray-900 flex items-center gap-1">
                      <Calendar size={13} className="text-gray-400" /> {shoot.event_date}
                    </p>
                    <p className="text-gray-600 flex items-center gap-1 font-mono">
                      <Clock size={13} className="text-gray-400" /> {shoot.event_time}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Venue & Location</span>
                    <p className="font-bold text-gray-900 truncate flex items-center gap-1">
                      <MapPin size={13} className="text-rose-500 shrink-0" /> {shoot.venue}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Team & Contact</span>
                    <p className="font-bold text-emerald-700 flex items-center gap-1">
                      <Phone size={13} /> {shoot.customer_mobile}
                    </p>
                    <div className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                      <Users size={12} /> {shoot.assigned_team_members?.map((m) => m.name).join(', ') || userName}
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {shoot.google_map_link ? (
                      <a
                        href={shoot.google_map_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MapPin size={14} className="text-rose-500" /> Open Maps
                      </a>
                    ) : (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(shoot.venue)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MapPin size={14} className="text-rose-500" /> Search Venue Map
                      </a>
                    )}

                    <a
                      href={`tel:${shoot.customer_mobile}`}
                      className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Phone size={14} /> Call Customer
                    </a>
                  </div>

                  <div className="w-full sm:w-auto flex items-center justify-end gap-2">
                    {isAssigned && (
                      <>
                        <button
                          onClick={() => handleOpenReject(shoot)}
                          className="px-4 py-2.5 text-xs font-bold rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <X size={14} /> Reject
                        </button>
                        <button
                          onClick={() => handleAccept(shoot)}
                          className="px-6 py-2.5 text-xs font-black rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                        >
                          <Check size={16} /> Accept Assignment
                        </button>
                      </>
                    )}

                    {isPickedUp && (
                      <button
                        onClick={() => handleStartShoot(shoot)}
                        className="w-full sm:w-auto px-6 py-2.5 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
                      >
                        <Play size={16} /> Start Shoot (On Site)
                      </button>
                    )}

                    {isShooting && (
                      <button
                        onClick={() => handleOpenCompleteModal(shoot)}
                        className="w-full sm:w-auto px-6 py-2.5 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
                      >
                        <CheckCircle2 size={16} /> Complete Shoot
                      </button>
                    )}

                    {isDone && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Shoot Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ─── REJECTION REASON MODAL ─── */}
      {selectedTaskForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans text-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600 border-b border-gray-100 pb-3">
              <AlertTriangle size={20} />
              <h3 className="text-base font-bold text-gray-900">Reject Shoot Assignment</h3>
            </div>
            <p className="text-gray-600">
              Please enter the reason why you cannot accept this assignment for{' '}
              <strong>{selectedTaskForReject.work_order_number}</strong>.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Prior booking conflict, equipment issue, health emergency..."
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedTaskForReject(null)}
                className="px-4 py-2 font-bold rounded-xl border border-gray-200 bg-white text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── COMPLETION & MEMORY CARD MODAL ─── */}
      {selectedTaskForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans text-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={20} />
                <h3 className="text-base font-extrabold text-[#111827]">Complete Shoot & Card Status</h3>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-gray-600">
                Marking <strong>{selectedTaskForNotes.service_name}</strong> for{' '}
                <span className="font-bold text-gray-900">{selectedTaskForNotes.work_order_number}</span> as completed.
              </p>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer font-bold text-amber-900">
                  <input
                    type="checkbox"
                    checked={cardSubmitted}
                    onChange={(e) => setCardSubmitted(e.target.checked)}
                    className="size-4 rounded accent-amber-600 cursor-pointer"
                  />
                  <span>Memory Cards / RAW Storage Handed Over to Studio</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Field Shoot Notes / Remarks</label>
                <textarea
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Total 3 SD cards, 4500 RAW photos shot..."
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5B3FD9] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedTaskForNotes(null)}
                className="px-4 py-2 font-bold rounded-xl border border-gray-200 bg-white text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmComplete}
                className="px-5 py-2 font-bold rounded-xl bg-emerald-600 text-white cursor-pointer"
              >
                Submit Completion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
