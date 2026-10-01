import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCrewSession } from '@/services/crewSessionService'
import { getWorkRolesForEmployee } from '@/services/employeeWorkRolesService'
import { AssignmentService, type AssignmentRecord } from '@/services/assignmentService'
import {
  Clock, MapPin, Navigation, Phone,
  Camera, Film, ChevronRight, Sparkles, Briefcase, Calendar, TrendingUp, CheckCircle,
  X, Check, AlertTriangle, Rocket
} from 'lucide-react'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { getPermissionsForCrewUser } from '@/services/crewPermissionService'
import { DeliverableAssignmentService, type EditorDashboardCounts } from '@/services/deliverableAssignmentService'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils/cn'

export default function CrewDashboard() {
  const navigate = useNavigate()
  const [crewUser] = useState(() => getCrewSession())
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([])
  const [editorCounts, setEditorCounts] = useState<EditorDashboardCounts>({
    assignedCount: 0,
    inEditingCount: 0,
    waitingApprovalCount: 0,
    dueTodayCount: 0,
    completedTodayCount: 0,
  })
  const [loading, setLoading] = useState(true)

  // Decline Modal State
  const [declineModalItem, setDeclineModalItem] = useState<AssignmentRecord | null>(null)
  const [declineReason, setDeclineReason] = useState<string>('Medical Leave')
  const [declineNotes, setDeclineNotes] = useState<string>('')
  const [submittingDecline, setSubmittingDecline] = useState<boolean>(false)

  const loadMyAssignments = async () => {
    if (!crewUser) return
    try {
      const empIdStr = crewUser.id || crewUser.employee_id || ''

      const myAssignments = await AssignmentService.getAssignmentsForEmployee(empIdStr, crewUser)
      const counts = DeliverableAssignmentService.getEditorDashboardCounts(crewUser)

      setAssignments(myAssignments)
      setEditorCounts(counts)
    } catch (e) {
      console.error('Error loading assignments:', e)
    } finally {
      setLoading(false)
    }
  }

  // Real-time synchronization across browser sessions, devices & tabs
  useRealtimeSync(loadMyAssignments)

  useEffect(() => {
    if (!crewUser) return
    loadMyAssignments()
  }, [crewUser])

  if (!crewUser) return null

  const empIdStr = crewUser.id || crewUser.employee_id || ''
  const empNameStr = crewUser.employee_name || crewUser.full_name || 'Crew Staff'
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const workRoles = getWorkRolesForEmployee(empIdStr)
  const roleTitle = workRoles.length > 0 ? workRoles.map((r) => r.role_name).join(' • ') : 'Crew Specialist'
  const permSet = getPermissionsForCrewUser(empIdStr)

  const handleAcceptAssignment = async (item: AssignmentRecord) => {
    try {
      await AssignmentService.acceptAssignment(item.id, empNameStr)
      toast.success(`Accepted assignment for ${item.work_order_number}!`)
      loadMyAssignments()
    } catch (e) {
      toast.error('Failed to accept assignment.')
    }
  }

  const handleConfirmDecline = async () => {
    if (!declineModalItem) return
    setSubmittingDecline(true)
    try {
      await AssignmentService.declineAssignment(
        declineModalItem.id,
        empNameStr,
        declineReason,
        declineNotes
      )
      toast.success('Assignment declined. Operations Manager notified.')
      setDeclineModalItem(null)
      setDeclineNotes('')
      loadMyAssignments()
    } catch (e) {
      toast.error('Failed to decline assignment.')
    } finally {
      setSubmittingDecline(false)
    }
  }

  return (
    <div className="space-y-6 text-gray-900 font-sans max-w-7xl mx-auto">
      {/* ── Welcome Header Card (CRM Style Light Gradient) ── */}
      <div className="bg-gradient-to-r from-[#5B3FD9] to-indigo-700 rounded-2xl p-6 sm:p-8 shadow-sm text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold">
              <Sparkles size={13} className="text-amber-300" />
              <span>Staff Operating System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good Day, {crewUser.employee_name || crewUser.full_name}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-purple-100 font-medium">
              {roleTitle} • {todayStr}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/crew/attendance')}
              className="px-5 py-2.5 rounded-xl bg-white text-[#5B3FD9] hover:bg-slate-100 font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <Clock size={16} /> Attendance Check
            </button>
          </div>
        </div>
      </div>

      {/* ── Editor & Shoot KPI Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          onClick={() => navigate('/crew/editing')}
          className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#5B3FD9] transition-all"
        >
          <div>
            <span className="text-xs font-bold text-gray-500 block">Assigned Deliverables</span>
            <span className="text-2xl font-extrabold text-[#5B3FD9] mt-1 block">{editorCounts.assignedCount}</span>
            <span className="text-[11px] text-gray-500 font-semibold mt-0.5 block">
              Active Editing Tasks
            </span>
          </div>
          <div className="size-12 rounded-2xl bg-purple-50 text-[#5B3FD9] border border-purple-100 flex items-center justify-center font-bold">
            <Film size={22} />
          </div>
        </div>

        <div
          onClick={() => navigate('/crew/editing')}
          className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#5B3FD9] transition-all"
        >
          <div>
            <span className="text-xs font-bold text-gray-500 block">In Editing</span>
            <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
              {editorCounts.inEditingCount}
            </span>
            <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">
              Currently Editing
            </span>
          </div>
          <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
        </div>

        <div
          onClick={() => navigate('/crew/editing')}
          className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#5B3FD9] transition-all"
        >
          <div>
            <span className="text-xs font-bold text-gray-500 block">Waiting Approval</span>
            <span className="text-2xl font-extrabold text-purple-600 mt-1 block">
              {editorCounts.waitingApprovalCount}
            </span>
            <span className="text-[11px] text-gray-500 font-semibold mt-0.5 block">
              Review / Client Feedback
            </span>
          </div>
          <div className="size-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold">
            <Sparkles size={22} />
          </div>
        </div>

        <div
          onClick={() => navigate('/crew/assignments')}
          className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#5B3FD9] transition-all"
        >
          <div>
            <span className="text-xs font-bold text-gray-500 block">Shoot Assignments</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">{assignments.length}</span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block flex items-center gap-1">
              <TrendingUp size={12} /> Production Schedule
            </span>
          </div>
          <div className="size-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
            <Briefcase size={22} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block">Completed Today</span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{editorCounts.completedTodayCount}</span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block flex items-center gap-1">
              <CheckCircle size={12} /> Delivered Work
            </span>
          </div>
          <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
            <CheckCircle size={22} />
          </div>
        </div>
      </div>

      {/* ── Active Assignments & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Today's Active Assignments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Briefcase size={18} className="text-[#5B3FD9]" /> Today's Active Assignments ({assignments.length})
            </h3>
            <button
              onClick={() => navigate('/crew/assignments')}
              className="text-xs font-extrabold text-[#5B3FD9] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-gray-500 bg-white border border-gray-200 rounded-2xl">
              Loading assignments...
            </div>
          ) : assignments.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-2 shadow-xs">
              <Calendar size={32} className="mx-auto text-[#5B3FD9] opacity-60" />
              <h4 className="font-extrabold text-sm text-gray-900">No assigned work orders for today</h4>
              <p className="text-xs text-gray-500">Newly assigned work orders from CRM will automatically display here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((item) => {
                const isPending = !item.status || item.status === 'assigned' || item.status === 'pending_assignment'
                const isAccepted = item.status === 'accepted'
                const isDeclined = item.status === 'declined'
                const isCompleted = item.status === 'completed' || item.status === 'approved'

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:border-[#5B3FD9]/40 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-gray-900">{item.work_order_number}</span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-gray-700">
                            {item.customer_name}
                          </span>
                        </div>
                        <p className="text-xs text-purple-700 font-extrabold mt-0.5">
                          {item.role_title} • {item.event_type}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-extrabold uppercase border',
                          isPending && 'bg-amber-50 text-amber-700 border-amber-200',
                          isAccepted && 'bg-purple-50 text-[#5B3FD9] border-purple-200',
                          isDeclined && 'bg-red-50 text-red-700 border-red-200',
                          isCompleted && 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        )}
                      >
                        {isPending ? 'Waiting for Acceptance' : isAccepted ? 'Accepted' : isDeclined ? 'Declined' : 'Completed'}
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 font-bold block">Date & Time</span>
                        <span className="font-extrabold text-gray-900">{item.event_date} {item.event_time ? `• ${item.event_time}` : ''}</span>
                      </div>

                      <div>
                        <span className="text-gray-500 font-bold block">Venue Location</span>
                        <div className="flex items-center gap-1.5 font-extrabold text-gray-900">
                          <MapPin size={13} className="text-[#5B3FD9] shrink-0" />
                          <span className="truncate">{item.venue || 'On Location Venue'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Contacts & Map Link */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        {item.google_map_link && (
                          <a
                            href={item.google_map_link}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-gray-800 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Navigation size={13} className="text-emerald-600" /> Google Maps
                          </a>
                        )}

                        {item.customer_mobile && (
                          <a
                            href={`tel:${item.customer_mobile}`}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-gray-800 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Phone size={13} className="text-purple-600" /> Call Coordinator
                          </a>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => setDeclineModalItem(item)}
                              className="px-4 py-2 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold transition-all cursor-pointer"
                            >
                              ❌ Decline
                            </button>

                            <button
                              onClick={() => handleAcceptAssignment(item)}
                              className="px-4 py-2 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Check size={14} /> Accept Assignment
                            </button>
                          </>
                        )}

                        {isAccepted && (
                          <button
                            onClick={() => {
                              const targetPath = item.task_type === 'editing' || item.task_type === 'album_design' ? '/crew/editing' : '/crew/shoots'
                              navigate(targetPath)
                            }}
                            className="px-4 py-2 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Rocket size={14} /> Open Workspace
                          </button>
                        )}

                        {isDeclined && (
                          <span className="text-xs font-bold text-red-600 italic">
                            Declined: {item.rejection_reason || 'Re-assignment requested'}
                          </span>
                        )}

                        {isCompleted && (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-extrabold flex items-center gap-1 border border-emerald-200">
                            <CheckCircle size={14} /> Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Col: Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <Sparkles size={18} className="text-[#5B3FD9]" /> Crew Quick Actions
          </h3>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
            {permSet.allowedModules.has('my_shoots') && (
              <button
                onClick={() => navigate('/crew/shoots')}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-purple-50/50 border border-gray-200 hover:border-[#5B3FD9]/30 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-purple-100 text-[#5B3FD9] flex items-center justify-center font-bold">
                    <Camera size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-gray-900 block">On-Production Workspace</span>
                    <span className="text-[11px] text-gray-500 font-medium block">View active shoots & gear checklist</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-[#5B3FD9] transition-colors" />
              </button>
            )}

            {permSet.allowedModules.has('my_editing') && (
              <button
                onClick={() => navigate('/crew/editing')}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-purple-50/50 border border-gray-200 hover:border-[#5B3FD9]/30 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    <Film size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-gray-900 block">Post-Production Desk</span>
                    <span className="text-[11px] text-gray-500 font-medium block">Edit queue, teasers & deliverables</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-[#5B3FD9] transition-colors" />
              </button>
            )}

            {permSet.allowedModules.has('ai_assistant') && (
              <button
                onClick={() => navigate('/crew/ai-assistant')}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-purple-50/50 border border-gray-200 hover:border-[#5B3FD9]/30 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-gray-900 block">Crew AI Assistant</span>
                    <span className="text-[11px] text-gray-500 font-medium block">Instant answers & venue navigation</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-[#5B3FD9] transition-colors" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Decline Reason Modal ── */}
      {declineModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl w-full max-w-md space-y-4 text-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" /> Decline Assignment
              </h3>
              <button onClick={() => setDeclineModalItem(null)} className="p-1 text-gray-400 hover:text-gray-900">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 font-medium">
              Please select a reason for declining assignment <strong className="text-gray-900">{declineModalItem.work_order_number}</strong> ({declineModalItem.role_title}). The Operations Manager will be notified instantly for re-assignment.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">Primary Reason *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Medical Leave',
                  'Already Busy',
                  'Personal Reason',
                  'Vehicle Issue',
                  'Equipment Issue',
                  'Other',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setDeclineReason(reason)}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer',
                      declineReason === reason
                        ? 'bg-[#5B3FD9] border-[#5B3FD9] text-white'
                        : 'bg-slate-50 border-gray-200 text-gray-700 hover:bg-slate-100'
                    )}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">Additional Remarks (Optional)</label>
              <textarea
                rows={2}
                placeholder="Provide additional details if needed..."
                value={declineNotes}
                onChange={(e) => setDeclineNotes(e.target.value)}
                className="w-full p-3 text-xs rounded-xl bg-slate-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeclineModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecline}
                onClick={handleConfirmDecline}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold cursor-pointer shadow-xs"
              >
                {submittingDecline ? 'Submitting...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
