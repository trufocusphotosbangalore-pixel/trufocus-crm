import { useState, useEffect, useCallback } from 'react'
import { Clock, MapPin, Navigation, Calendar } from 'lucide-react'
import { getCrewSession } from '@/services/crewSessionService'
import { AssignmentService, type AssignmentRecord } from '@/services/assignmentService'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'

export default function CrewTodaySchedulePage() {
  const [crewUser] = useState(() => getCrewSession())
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadMyAssignments = useCallback(async () => {
    if (!crewUser) return
    const empId = crewUser.id || crewUser.employee_id || ''
    const list = await AssignmentService.getAssignmentsForEmployee(empId, crewUser)
    setAssignments(list)
    setLoading(false)
  }, [crewUser])

  useRealtimeSync(loadMyAssignments)

  useEffect(() => {
    if (!crewUser) return
    loadMyAssignments()
  }, [crewUser, loadMyAssignments])

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="space-y-6 text-gray-900 font-sans max-w-7xl mx-auto">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Clock size={24} className="text-[#5B3FD9]" /> Today's Production Schedule
        </h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{todayStr}</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-gray-500 bg-white border border-gray-200 rounded-2xl">
          Loading schedule...
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-2 shadow-xs">
          <Calendar size={32} className="mx-auto text-[#5B3FD9] opacity-60" />
          <h4 className="font-extrabold text-sm text-gray-900">No active shoots scheduled for today</h4>
          <p className="text-xs text-gray-500">Assignments created by managers in CRM will automatically appear here.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          {assignments.map((evt, idx) => {
            const navUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.venue || evt.service_name || 'Venue')}`

            return (
              <div key={evt.id || idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-gray-200 hover:border-[#5B3FD9]/40 transition-all">
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-purple-50 border border-purple-200 text-[#5B3FD9] font-extrabold flex items-center justify-center text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[#5B3FD9]">{evt.event_time || 'Full Day'}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-[#5B3FD9] border border-purple-200 uppercase">
                        {evt.service_name || evt.role_title}
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-gray-900 mt-1">{evt.work_order_number} • {evt.customer_name}</h4>
                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                      <MapPin size={13} className="text-[#5B3FD9] shrink-0" /> {evt.venue || 'Venue On Location'}
                    </p>
                  </div>
                </div>

                <a
                  href={navUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                >
                  <Navigation size={14} /> Navigate
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
