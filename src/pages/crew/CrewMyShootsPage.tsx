import { useState, useEffect } from 'react'
import { Camera, Navigation, MapPin, Phone, CheckCircle, X, HardDrive, ArrowRight } from 'lucide-react'
import { getCrewSession } from '@/services/crewSessionService'
import { AssignmentService, type AssignmentRecord } from '@/services/assignmentService'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils/cn'

export default function CrewMyShootsPage() {
  const [crewUser] = useState(() => getCrewSession())
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Data Collection & Completion Modal State
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [memoryCardReturned, setMemoryCardReturned] = useState<boolean>(true)
  const [completionRemarks, setCompletionRemarks] = useState<string>('')
  const [submittingCompletion, setSubmittingCompletion] = useState<boolean>(false)

  const loadMyAssignments = async () => {
    if (!crewUser) return
    try {
      const empId = crewUser.id || crewUser.employee_id || ''
      const list = await AssignmentService.getAssignmentsForEmployee(empId, crewUser)
      const shootOnly = list.filter(
        (a) => a.task_type === 'photography' || a.task_type === 'videography' || (a.role_title || '').toLowerCase().includes('drone')
      )
      setAssignments(shootOnly.length > 0 ? shootOnly : list)
    } catch (e) {
      console.error('Error loading shoot assignments:', e)
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
  const activeShoot = assignments.find((a) => a.status === 'accepted' || a.status === 'started' || a.status === 'assigned') || assignments[0]

  const handleOpenCompletionModal = () => {
    if (!activeShoot) return
    setShowCompletionModal(true)
  }

  const handleSubmitShootCompletion = async () => {
    if (!activeShoot) return
    setSubmittingCompletion(true)
    try {
      const empNameStr = crewUser.employee_name || crewUser.full_name || 'Crew Staff'
      await AssignmentService.completeShootAssignment(
        activeShoot.id,
        empNameStr,
        {
          memoryCardReturned,
          remarks: completionRemarks,
        }
      )
      toast.success(`Shoot completed & reported for ${activeShoot.work_order_number}!`)
      setShowCompletionModal(false)
      setCompletionRemarks('')
      loadMyAssignments()
    } catch (e) {
      toast.error('Failed to submit shoot completion.')
    } finally {
      setSubmittingCompletion(false)
    }
  }

  const isCompleted = activeShoot && (activeShoot.status === 'completed' || activeShoot.status === 'approved')

  return (
    <div className="space-y-6 text-gray-900 font-sans max-w-7xl mx-auto">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Camera size={24} className="text-[#5B3FD9]" /> On-Production Workspace
        </h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Simplified shoot workspace for Photographers, Videographers, Drone Operators, & BTS crew.
        </p>
      </div>

      {/* Active Shoot Workspace */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-50 text-[#5B3FD9] border border-purple-200 uppercase">
                {activeShoot ? (activeShoot.service_name || 'Active Shoot Event') : 'Active Shoot Event'}
              </span>
              {activeShoot && (
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border uppercase',
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  )}
                >
                  Status: {activeShoot.status || 'Accepted'}
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mt-1.5">
              {activeShoot ? `${activeShoot.work_order_number} • ${activeShoot.customer_name}` : 'No active shoot assigned'}
            </h2>
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-1">
              <MapPin size={13} className="text-[#5B3FD9]" />
              {activeShoot ? `${activeShoot.venue} • ${activeShoot.role_title}` : 'Assignments created in CRM will automatically appear here.'}
            </p>
          </div>

          {activeShoot && (
            <div className="flex flex-wrap items-center gap-2">
              {activeShoot.google_map_link && (
                <a
                  href={activeShoot.google_map_link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Navigation size={14} /> 1-Click Maps Navigation
                </a>
              )}

              {activeShoot.customer_mobile && (
                <a
                  href={`tel:${activeShoot.customer_mobile}`}
                  className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5B3FD9] border border-purple-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Phone size={14} /> Call Coordinator
                </a>
              )}
            </div>
          )}
        </div>

        {/* Project Details Grid */}
        {activeShoot ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-50 border border-gray-200 text-xs">
            <div>
              <span className="font-bold text-gray-500 block">Work Order</span>
              <span className="font-extrabold text-gray-900 text-sm">{activeShoot.work_order_number}</span>
            </div>
            <div>
              <span className="font-bold text-gray-500 block">Client Name</span>
              <span className="font-extrabold text-gray-900 text-sm">{activeShoot.customer_name}</span>
            </div>
            <div>
              <span className="font-bold text-gray-500 block">Service Assigned</span>
              <span className="font-extrabold text-purple-700 text-sm">{activeShoot.role_title}</span>
            </div>
            <div>
              <span className="font-bold text-gray-500 block">Event Date & Time</span>
              <span className="font-extrabold text-gray-900 text-sm">{activeShoot.event_date} {activeShoot.event_time ? `(${activeShoot.event_time})` : ''}</span>
            </div>
            {activeShoot.assigned_camera && (
              <div className="col-span-1 md:col-span-2 lg:col-span-4 p-2.5 rounded-lg bg-purple-50 border border-purple-200 flex items-center gap-2 text-xs">
                <Camera size={15} className="text-[#5B3FD9] shrink-0" />
                <span className="text-gray-700">
                  Assigned Camera / Gear Kit: <strong className="text-[#5B3FD9]">{activeShoot.assigned_camera}</strong>
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-gray-500">No active assignment details to display.</div>
        )}

        {/* Large Single Action Button */}
        {activeShoot && (
          <div className="pt-2">
            {isCompleted ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 font-extrabold text-emerald-700 text-base">
                  <CheckCircle size={20} /> Shoot Completed & Data Reported
                </div>
                <p className="text-xs text-emerald-600 font-medium">
                  Memory Card Status: {activeShoot.memory_card_status === 'submitted' ? 'Returned to Studio' : 'Pending Return'}. Waiting for Data Collection & QC.
                </p>
              </div>
            ) : (
              <button
                onClick={handleOpenCompletionModal}
                className="w-full py-4 rounded-2xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white text-base font-extrabold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle size={22} /> ✓ Shoot Completed
              </button>
            )}
          </div>
        )}
      </div>

      {/* Assigned Shoots Table View */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-gray-900">Your Production Shoot Assignments</h3>
        {loading ? (
          <p className="text-xs text-gray-500">Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <p className="text-xs text-gray-500">No active shoot assignments.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">WO #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Event Date</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {assignments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-extrabold text-[#5B3FD9]">{item.work_order_number}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{item.customer_name}</td>
                    <td className="py-3 px-4 text-gray-700">{item.role_title} ({item.service_name})</td>
                    <td className="py-3 px-4 text-gray-700">{item.event_date || 'Today'}</td>
                    <td className="py-3 px-4 text-gray-700">{item.venue || 'On Location'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase',
                          item.status === 'completed' || item.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.status === 'declined'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-purple-50 text-[#5B3FD9] border-purple-200'
                        )}
                      >
                        {item.status || 'Assigned'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Confirm Shoot Completion & Data Collection Modal ── */}
      {showCompletionModal && activeShoot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl w-full max-w-md space-y-5 text-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <CheckCircle size={20} className="text-[#5B3FD9]" /> Confirm Shoot Completion
              </h3>
              <button onClick={() => setShowCompletionModal(false)} className="p-1 text-gray-400 hover:text-gray-900">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 font-medium">
              Have you completed the shoot assignment for <strong className="text-gray-900">{activeShoot.work_order_number}</strong> ({activeShoot.customer_name})?
            </p>

            {/* Data Collection Section */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                  <HardDrive size={15} className="text-[#5B3FD9]" /> Memory Cards Returned?
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMemoryCardReturned(true)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      memoryCardReturned
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-gray-200 text-gray-700'
                    )}
                  >
                    Yes
                  </button>

                  <button
                    type="button"
                    onClick={() => setMemoryCardReturned(false)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      !memoryCardReturned
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white border border-gray-200 text-gray-700'
                    )}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="block text-[11px] font-bold text-gray-700">Remarks / Damaged Equipment Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any missing files, damaged equipment, or extra notes..."
                  value={completionRemarks}
                  onChange={(e) => setCompletionRemarks(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-white border border-gray-200 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowCompletionModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-gray-700 text-xs font-bold cursor-pointer"
              >
                No, Go Back
              </button>
              <button
                type="button"
                disabled={submittingCompletion}
                onClick={handleSubmitShootCompletion}
                className="px-5 py-2 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white text-xs font-extrabold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {submittingCompletion ? 'Submitting...' : <>Yes, Complete Shoot <ArrowRight size={14} /></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
