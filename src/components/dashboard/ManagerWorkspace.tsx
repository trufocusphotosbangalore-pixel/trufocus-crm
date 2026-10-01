import { useState, useEffect } from 'react'
import {
  Users, CheckCircle2, UserCheck, ArrowUpRight, Calendar, BarChart3,
  Clock, RefreshCw
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AssignmentActivityLog } from '@/types/personalQueue'
import {
  AssignmentService,
  type StaffAvailabilityItem,
  type StaffWorkloadSummary,
} from '@/services/assignmentService'
import { cn } from '@/utils/cn'

interface ManagerWorkspaceProps {
  userName: string
  onRefresh: () => void
  logs: AssignmentActivityLog[]
  unassignedCount: number
}

export function ManagerWorkspace({ userName, onRefresh, logs, unassignedCount }: ManagerWorkspaceProps) {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'activity' | 'availability' | 'workload'>('activity')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10))

  const [availabilityList, setAvailabilityList] = useState<StaffAvailabilityItem[]>([])
  const [workloadList, setWorkloadList] = useState<StaffWorkloadSummary[]>([])
  const [loading, setLoading] = useState(false)

  // Load Availability when selectedDate or tab changes
  useEffect(() => {
    if (activeTab === 'availability') {
      setLoading(true)
      AssignmentService.getStaffAvailability(selectedDate)
        .then((res) => setAvailabilityList(res))
        .finally(() => setLoading(false))
    } else if (activeTab === 'workload') {
      setLoading(true)
      AssignmentService.getStaffWorkload()
        .then((res) => setWorkloadList(res))
        .finally(() => setLoading(false))
    }
  }, [activeTab, selectedDate])

  // Pending acceptances & active counts
  const pendingAcceptanceLogs = logs.filter((l) => l.current_stage === 'assigned')
  const inProgressLogs = logs.filter((l) => l.current_stage === 'in_progress')

  return (
    <div className="space-y-6 font-sans">
      {/* ─── MANAGER BANNER ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-400/30">
            <Users size={30} className="text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Operations & Team Monitor
              </span>
              <span className="text-xs text-slate-300">Manager: {userName}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black mt-0.5">Team Assignment Engine</h1>
            <p className="text-xs text-slate-400 mt-1">
              Field status, staff availability, team workload, and assignment manager
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xs">
          <div className="text-center px-3">
            <span className="text-[10px] font-extrabold uppercase text-amber-400 block">Waiting Accept</span>
            <span className="text-base font-black text-amber-400">{pendingAcceptanceLogs.length}</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="text-center px-3">
            <span className="text-[10px] font-extrabold uppercase text-emerald-400 block">Active Now</span>
            <span className="text-base font-black text-emerald-400">{inProgressLogs.length}</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="text-center px-3">
            <span className="text-[10px] font-extrabold uppercase text-rose-400 block">Unassigned</span>
            <span className="text-base font-black text-rose-400">{unassignedCount}</span>
          </div>
        </div>
      </div>

      {/* ─── LIVE OPERATIONAL CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-amber-700 block tracking-wider">
            ⚠️ Assignments Awaiting Acceptance
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">{pendingAcceptanceLogs.length}</span>
            <span className="text-xs text-gray-500 font-medium">Pending field confirmation</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-emerald-700 block tracking-wider">
            🎥 Staff Shooting / Editing Now
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{inProgressLogs.length}</span>
            <span className="text-xs text-gray-500 font-medium">Currently in progress</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-rose-700 block tracking-wider">
            🚨 Unassigned Work Orders
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-600">{unassignedCount}</span>
            <button
              onClick={() => navigate('/projects')}
              className="text-xs font-bold text-[#5B3FD9] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Assign Team Now <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── NAVIGATION TABS ─── */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('activity')}
          className={cn(
            'px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'activity'
              ? 'bg-[#5B3FD9] text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
          )}
        >
          <Clock size={14} /> Live Activity Log
        </button>
        <button
          onClick={() => setActiveTab('availability')}
          className={cn(
            'px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'availability'
              ? 'bg-[#5B3FD9] text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
          )}
        >
          <Calendar size={14} /> Staff Availability
        </button>
        <button
          onClick={() => setActiveTab('workload')}
          className={cn(
            'px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'workload'
              ? 'bg-[#5B3FD9] text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
          )}
        >
          <BarChart3 size={14} /> Team Workload Monitor
        </button>
      </div>

      {/* ─── TAB CONTENT 1: LIVE ACTIVITY FEED ─── */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Live Assignment Activity Feed</h3>
              <p className="text-xs text-gray-500">Real-time status updates from field crews and editors</p>
            </div>
            <button
              onClick={() => navigate('/projects')}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] transition-colors shadow-2xs cursor-pointer"
            >
              Manage Work Orders
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 space-y-2">
              <UserCheck size={32} className="mx-auto text-gray-300" />
              <p className="text-xs font-medium">No activity logged yet today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.slice(0, 15).map((log) => {
                const isAccepted = log.current_stage === 'picked_up'
                const isShooting = log.current_stage === 'in_progress'
                const isDone = log.current_stage === 'completed'

                return (
                  <div
                    key={log.id}
                    className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100 gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-9 rounded-xl flex items-center justify-center font-bold ${
                          isShooting
                            ? 'bg-amber-100 text-amber-800'
                            : isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {log.assigned_to_name ? log.assigned_to_name[0].toUpperCase() : 'T'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-gray-900">{log.assigned_to_name}</strong>
                          <span className="font-mono text-[11px] font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2 py-0.5 rounded">
                            {log.work_order_number}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-0.5">{log.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isAccepted && (
                        <span className="px-3 py-1 font-extrabold rounded-full bg-blue-100 text-blue-800">
                          Accepted
                        </span>
                      )}
                      {isShooting && (
                        <span className="px-3 py-1 font-extrabold rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                          <span className="size-2 rounded-full bg-amber-600 animate-ping" /> In Progress
                        </span>
                      )}
                      {isDone && (
                        <span className="px-3 py-1 font-extrabold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      )}

                      <span className="text-gray-400 font-mono text-[11px]">
                        {new Date(log.completed_at || log.started_at || log.accepted_at || log.assigned_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB CONTENT 2: STAFF AVAILABILITY ─── */}
      {activeTab === 'availability' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Staff Availability Calendar</h3>
              <p className="text-xs text-gray-500">Check who is free or booked on any given shoot date</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600">Select Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 px-3 text-xs rounded-xl bg-gray-50 border border-gray-300 font-semibold focus:ring-2 focus:ring-[#5B3FD9]"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : availabilityList.length === 0 ? (
            <div className="p-8 text-center text-gray-400 space-y-2">
              <Users size={32} className="mx-auto text-gray-300" />
              <p className="text-xs font-medium">No team members found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availabilityList.map((item) => {
                const empName = item.employee.full_name || item.employee.employee_name || item.employee.username || 'Staff'

                return (
                  <div
                    key={item.employee.id}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-[#5B3FD9] text-white flex items-center justify-center font-bold text-xs">
                        {empName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{empName}</h4>
                        <p className="text-[11px] text-gray-500 font-medium">
                          {item.employee.job_role || (item.employee.job_roles && item.employee.job_roles[0]) || 'Staff'} •{' '}
                          {item.employee.department || 'Production'}
                        </p>
                      </div>
                    </div>

                    <div>
                      {item.is_available ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ Available
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                          Booked ({item.assigned_count_today} Shoot{item.assigned_count_today > 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB CONTENT 3: TEAM WORKLOAD MONITOR ─── */}
      {activeTab === 'workload' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Complete Team Workload Distribution</h3>
              <p className="text-xs text-gray-500">Summary of active shoots, pending tasks, and completed projects per staff member</p>
            </div>
            <button
              onClick={() => onRefresh()}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} /> Refresh Workload
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : workloadList.length === 0 ? (
            <div className="p-8 text-center text-gray-400 space-y-2">
              <BarChart3 size={32} className="mx-auto text-gray-300" />
              <p className="text-xs font-medium">No team workload data available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-[10px] uppercase tracking-wider text-gray-400 font-extrabold">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-center">Pending Accept</th>
                    <th className="py-3 px-4 text-center">Active Shoots</th>
                    <th className="py-3 px-4 text-center">Active Editing</th>
                    <th className="py-3 px-4 text-center">Completed</th>
                    <th className="py-3 px-4 text-right">Total Assigned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workloadList.map((w) => (
                    <tr key={w.employee_id} className="hover:bg-gray-50/60 font-medium text-gray-800">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{w.employee_name}</td>
                      <td className="py-3.5 px-4 text-gray-500">{w.job_role}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${w.pending_acceptances > 0 ? 'bg-amber-100 text-amber-800' : 'text-gray-400'}`}>
                          {w.pending_acceptances}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${w.active_shoots > 0 ? 'bg-indigo-100 text-indigo-800' : 'text-gray-400'}`}>
                          {w.active_shoots}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${w.active_editing > 0 ? 'bg-purple-100 text-purple-800' : 'text-gray-400'}`}>
                          {w.active_editing}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${w.completed > 0 ? 'bg-emerald-100 text-emerald-800' : 'text-gray-400'}`}>
                          {w.completed}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-[#5B3FD9]">{w.total_assignments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
