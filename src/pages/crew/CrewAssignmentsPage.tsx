import { useState, useEffect, useCallback } from 'react'
import { Briefcase, Search, Navigation, Calendar, MapPin, Clock } from 'lucide-react'
import { getCrewSession } from '@/services/crewSessionService'
import { AssignmentService, type AssignmentRecord } from '@/services/assignmentService'
import { DeliverableAssignmentService } from '@/services/deliverableAssignmentService'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { cn } from '@/utils/cn'

export default function CrewAssignmentsPage() {
  const [crewUser] = useState(() => getCrewSession())
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([])
  const [search, setSearch] = useState('')

  const loadMyAssignments = useCallback(async () => {
    if (!crewUser) return
    const empId = crewUser.id || crewUser.employee_id || ''
    const list = await AssignmentService.getAssignmentsForEmployee(empId, crewUser)
    setAssignments(list)
  }, [crewUser])

  useRealtimeSync(loadMyAssignments)

  useEffect(() => {
    if (!crewUser) return
    loadMyAssignments()
    const unsubscribe = DeliverableAssignmentService.subscribeAssignments(loadMyAssignments)
    return () => unsubscribe()
  }, [crewUser, loadMyAssignments])

  if (!crewUser) return null

  const filteredList = assignments.filter((a) => {
    const q = search.toLowerCase()
    return (
      !search ||
      a.customer_name?.toLowerCase().includes(q) ||
      a.event_type?.toLowerCase().includes(q) ||
      a.venue?.toLowerCase().includes(q) ||
      a.work_order_number?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 text-gray-900 font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Briefcase size={24} className="text-[#5B3FD9]" /> My Assignments
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            All production shoots, event assignments, and deliverables assigned to you.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#5B3FD9] focus:ring-1 focus:ring-[#5B3FD9] shadow-xs"
          />
        </div>
      </div>

      {/* CRM Data Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Calendar size={36} className="mx-auto text-[#5B3FD9] opacity-60" />
            <h4 className="font-extrabold text-sm text-gray-900">No assignments found</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              You currently have no active or completed assignments matching your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Work Order</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Event Type</th>
                  <th className="py-3.5 px-4">Role & Service</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Venue</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredList.map((item) => {
                  const navUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.venue || 'Venue')}`

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-extrabold text-[#5B3FD9]">
                        {item.work_order_number}
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-900">
                        {item.customer_name}
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {item.event_type || 'Shoot Event'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-50 text-[#5B3FD9] border border-purple-200">
                          {item.role_title} ({item.service_name})
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-gray-400" />
                          <span>{item.event_date || 'Today'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        <div className="flex items-center gap-1.5 max-w-[180px] truncate">
                          <MapPin size={13} className="text-[#5B3FD9] shrink-0" />
                          <span className="truncate">{item.venue || 'On Location'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border',
                            (!item.status || item.status === 'assigned' || item.status === 'pending_assignment') && 'bg-amber-50 text-amber-700 border-amber-200',
                            item.status === 'accepted' && 'bg-purple-50 text-[#5B3FD9] border-purple-200',
                            item.status === 'declined' && 'bg-red-50 text-red-700 border-red-200',
                            (item.status === 'completed' || item.status === 'approved') && 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          )}
                        >
                          {!item.status || item.status === 'assigned' ? 'Waiting Acceptance' : item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={navUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] inline-flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                          >
                            <Navigation size={12} /> Maps
                          </a>
                        </div>
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
