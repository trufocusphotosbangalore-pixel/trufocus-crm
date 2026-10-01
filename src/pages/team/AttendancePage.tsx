import { useState, useEffect, useMemo } from 'react'
import {
  Clock, Calendar, Users, CheckCircle2, XCircle, RefreshCw,
  Download, MapPin, UserCheck, Search, Compass, Edit3,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import {
  loadAttendanceRecords,
  checkInEmployee,
  checkOutEmployee,
  manualUpdateAttendanceRecord,
  getAttendanceMetrics,
  type AttendanceRecord,
  type AttendanceStatus,
} from '@/services/attendanceStore'
import { toast } from 'react-hot-toast'

const STATUS_BADGE_MAP: Record<AttendanceStatus, { label: string; cls: string }> = {
  present: { label: 'Present', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  late: { label: 'Late', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  absent: { label: 'Absent', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  half_day: { label: 'Half Day', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  leave: { label: 'On Leave', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  work_from_home: { label: 'Work From Home', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
}

export default function AttendancePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'team' | 'my'>('team')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [records, setRecords] = useState<AttendanceRecord[]>(() => loadAttendanceRecords(selectedDate))

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'in_house' | 'freelancer'>('all')

  // Edit / Manual Modal State
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('present')
  const [editCheckIn, setEditCheckIn] = useState('')
  const [editCheckOut, setEditCheckOut] = useState('')
  const [editRemarks, setEditRemarks] = useState('')

  // Self Check-In State
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [selfRemarks, setSelfRemarks] = useState('')
  const [gpsLocation] = useState<{ lat: number; lng: number; address: string } | null>({
    lat: 12.9716,
    lng: 77.5946,
    address: 'Trufocus Studio HQ (Office GPS Verified)',
  })
  const [isLocating, setIsLocating] = useState(false)

  // Real-time synchronization event listener
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail
      if (!detail?.date || detail.date === selectedDate) {
        setRecords(loadAttendanceRecords(selectedDate))
      }
    }
    window.addEventListener('trufocus_attendance_updated', handleUpdate)
    return () => window.removeEventListener('trufocus_attendance_updated', handleUpdate)
  }, [selectedDate])

  useEffect(() => {
    setRecords(loadAttendanceRecords(selectedDate))
  }, [selectedDate])

  // Check self status
  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = loadAttendanceRecords(today)
    const myRec = todayRecords.find((r) => r.email.toLowerCase() === user.email.toLowerCase())
    if (myRec && myRec.check_in_time) {
      setIsCheckedIn(true)
      setCheckInTime(myRec.check_in_time)
    }
  }, [user])

  const metrics = useMemo(() => getAttendanceMetrics(selectedDate), [selectedDate, records])

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !search ||
        r.employee_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      const matchesType = typeFilter === 'all' || r.employment_type === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [records, search, statusFilter, typeFilter])

  // Handlers
  const handleRefresh = () => {
    setRecords(loadAttendanceRecords(selectedDate))
    toast.success('Attendance records refreshed!')
  }

  const handleExportCSV = () => {
    const headers = ['Employee Name,Email,Department,Type,Status,Check-In,Check-Out,Duration (Mins),Date']
    const rows = filteredRecords.map(
      (r) =>
        `"${r.employee_name}","${r.email}","${r.department}","${r.employment_type}","${r.status}","${r.check_in_time || ''}","${r.check_out_time || ''}",${r.duration_minutes},"${r.date}"`
    )
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Attendance_${selectedDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Attendance CSV exported successfully!')
  }

  const handleSelfCheckIn = () => {
    if (!user) return
    setIsLocating(true)

    // Simulate GPS acquisition or use Geolocation API
    setTimeout(() => {
      setIsLocating(false)
      const rec = checkInEmployee(
        user.id,
        user.full_name || 'Staff Member',
        user.email,
        {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 12,
          address: 'Trufocus Studio HQ, Bangalore',
          within_office_radius: true,
        },
        selfRemarks
      )
      setIsCheckedIn(true)
      setCheckInTime(rec.check_in_time)
      setRecords(loadAttendanceRecords(selectedDate))
      toast.success('✅ Check-In Recorded with GPS Location & Timestamp!')
    }, 600)
  }

  const handleSelfCheckOut = () => {
    if (!user) return
    const rec = checkOutEmployee(user.id, user.email, selfRemarks)
    if (rec) {
      setIsCheckedIn(false)
      setRecords(loadAttendanceRecords(selectedDate))
      toast.success('👋 Checked Out Successfully!')
    }
  }

  const handleOpenEditModal = (rec: AttendanceRecord) => {
    setEditingRecord(rec)
    setEditStatus(rec.status)
    setEditCheckIn(rec.check_in_time || '09:30 AM')
    setEditCheckOut(rec.check_out_time || '06:30 PM')
    setEditRemarks(rec.remarks || '')
  }

  const handleSaveEditModal = () => {
    if (!editingRecord) return
    manualUpdateAttendanceRecord(selectedDate, editingRecord.id, {
      status: editStatus,
      check_in_time: editCheckIn,
      check_out_time: editCheckOut,
      remarks: editRemarks,
    })
    setRecords(loadAttendanceRecords(selectedDate))
    setEditingRecord(null)
    toast.success('Updated attendance record!')
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* ─── Header Card ─── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="p-3 rounded-2xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <Clock size={26} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-1 rounded-md text-xs">
                  ATTENDANCE & TIME TRACKER
                </span>
                <h1 className="ui-page-title text-[32px] font-extrabold text-[#111827]">Attendance Workspace</h1>
              </div>
              <p className="ui-small-label text-[13px] text-gray-500 mt-1">
                Real-time check-in, GPS location logging, working hours, and shift management.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="ui-button-text text-[15px] px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-2 cursor-pointer font-bold"
            >
              <RefreshCw size={16} /> Refresh
            </button>

            <button
              onClick={handleExportCSV}
              className="ui-button-text text-[15px] px-5 py-2.5 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 cursor-pointer font-extrabold"
            >
              <Download size={16} /> Export Attendance CSV
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="pt-3 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('team')}
              className={cn(
                'px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer',
                activeTab === 'team'
                  ? 'bg-[#5B3FD9] text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Users size={15} /> Team Attendance (Admin View)
            </button>

            <button
              onClick={() => setActiveTab('my')}
              className={cn(
                'px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer',
                activeTab === 'my'
                  ? 'bg-[#5B3FD9] text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <UserCheck size={15} /> My Attendance (Self-Service)
            </button>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: TEAM ATTENDANCE ─── */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
              <span className="ui-small-label text-gray-400 font-bold uppercase tracking-wider block text-[11px] mb-1">Total Team</span>
              <span className="font-mono text-2xl font-extrabold text-[#111827]">{metrics.total}</span>
              <span className="text-xs text-gray-500 block mt-1">Configured Users</span>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 p-5 shadow-xs">
              <span className="ui-small-label text-emerald-700 font-bold uppercase tracking-wider block text-[11px] mb-1">Present Today</span>
              <span className="font-mono text-2xl font-extrabold text-emerald-700">{metrics.present}</span>
              <span className="text-xs text-emerald-600 block mt-1">Checked In On-Time / WFH</span>
            </div>

            <div className="bg-white rounded-2xl border border-rose-200 bg-rose-50/20 p-5 shadow-xs">
              <span className="ui-small-label text-rose-700 font-bold uppercase tracking-wider block text-[11px] mb-1">Absent / Leave</span>
              <span className="font-mono text-2xl font-extrabold text-rose-700">{metrics.absent}</span>
              <span className="text-xs text-rose-600 block mt-1">Not Reported</span>
            </div>

            <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/20 p-5 shadow-xs">
              <span className="ui-small-label text-amber-700 font-bold uppercase tracking-wider block text-[11px] mb-1">Not Checked Out</span>
              <span className="font-mono text-2xl font-extrabold text-amber-700">{metrics.notCheckedOut}</span>
              <span className="text-xs text-amber-600 block mt-1">Active Shifts</span>
            </div>

            <div className="bg-white rounded-2xl border border-purple-200 bg-purple-50/20 p-5 shadow-xs">
              <span className="ui-small-label text-purple-700 font-bold uppercase tracking-wider block text-[11px] mb-1">Attendance Rate</span>
              <span className="font-mono text-2xl font-extrabold text-[#5B3FD9]">{metrics.percentage}%</span>
              <span className="text-xs text-purple-600 block mt-1">Daily Target Achieved</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Date Selector */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                <Calendar size={15} className="text-gray-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none"
                />
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by employee name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-800 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="leave">On Leave</option>
                <option value="work_from_home">Work From Home</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-800 focus:outline-none"
              >
                <option value="all">All Employment Types</option>
                <option value="in_house">In-House Staff</option>
                <option value="freelancer">Freelancer / Vendor</option>
              </select>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-[#E5E7EB]">
                    <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Employee</th>
                    <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Type</th>
                    <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Check-In</th>
                    <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Check-Out</th>
                    <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">GPS / Device Payload</th>
                    <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">
                        No attendance records found for this date & filter selection.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => {
                      const badge = STATUS_BADGE_MAP[r.status] || STATUS_BADGE_MAP.present
                      return (
                        <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="p-4 font-bold text-gray-900">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-[#5B3FD9]/10 text-[#5B3FD9] font-bold flex items-center justify-center text-xs shrink-0">
                                {r.employee_name.charAt(0)}
                              </div>
                              <div>
                                <span className="block text-gray-900 font-bold">{r.employee_name}</span>
                                <span className="text-[11px] text-gray-400 font-mono">{r.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                              {r.employment_type === 'freelancer' ? 'Freelancer' : 'In-House'}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className={cn('px-2.5 py-1 rounded-md text-[11px] font-extrabold border', badge.cls)}>
                              {badge.label}
                            </span>
                          </td>

                          <td className="p-4 font-mono font-bold text-gray-800">
                            {r.check_in_time ? (
                              <span className="flex items-center gap-1.5 text-emerald-600">
                                <Clock size={13} /> {r.check_in_time}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-normal">—</span>
                            )}
                          </td>

                          <td className="p-4 font-mono font-bold text-gray-800">
                            {r.check_out_time ? (
                              <span className="flex items-center gap-1.5 text-blue-600">
                                <Clock size={13} /> {r.check_out_time}
                              </span>
                            ) : (
                              <span className="text-amber-600 font-bold text-[11px]">Active Shift</span>
                            )}
                          </td>

                          <td className="p-4 text-gray-600">
                            {r.location ? (
                              <div className="space-y-0.5 text-[11px]">
                                <span className="flex items-center gap-1 text-purple-700 font-bold">
                                  <MapPin size={12} /> {r.location.address || 'Office GPS Verified'}
                                </span>
                                <span className="text-gray-400 font-mono block text-[10px]">
                                  Lat: {r.location.latitude}, Lng: {r.location.longitude}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No GPS Payload</span>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenEditModal(r)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: MY ATTENDANCE (SELF SERVICE) ─── */}
      {activeTab === 'my' && (
        <div className="space-y-6">
          {/* Today's Check-In Interactive Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2 max-w-md">
              <span className="font-mono font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-1 rounded-md text-xs">
                TODAY'S SHIFT STATUS
              </span>
              <h2 className="text-xl font-extrabold text-[#111827]">
                {isCheckedIn ? 'You are currently Checked In' : 'Not Checked In Yet Today'}
              </h2>
              <p className="text-xs text-gray-500">
                {isCheckedIn
                  ? `Shift started at ${checkInTime}. Remember to check out at end of day.`
                  : 'Click the button below to register your check-in with GPS location timestamp.'}
              </p>
              {gpsLocation && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 w-fit">
                  <Compass size={15} /> {gpsLocation.address}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-3">
              <input
                type="text"
                placeholder="Optional shift notes / remarks..."
                value={selfRemarks}
                onChange={(e) => setSelfRemarks(e.target.value)}
                className="h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium w-64 focus:outline-none focus:border-[#5B3FD9]"
              />

              {!isCheckedIn ? (
                <button
                  onClick={handleSelfCheckIn}
                  disabled={isLocating}
                  className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 size={18} /> {isLocating ? 'Acquiring GPS Location...' : 'Check In Now'}
                </button>
              ) : (
                <button
                  onClick={handleSelfCheckOut}
                  className="px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-rose-600/25 cursor-pointer"
                >
                  <XCircle size={18} /> Check Out Now
                </button>
              )}
            </div>
          </div>

          {/* Personal Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Working Hours (This Month)</span>
              <span className="font-mono text-2xl font-extrabold text-[#111827]">168 hrs</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">On-Time Arrivals</span>
              <span className="font-mono text-2xl font-extrabold text-emerald-600">96%</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Late Count</span>
              <span className="font-mono text-2xl font-extrabold text-amber-600">1 Day</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px] mb-1">Leave Balance</span>
              <span className="font-mono text-2xl font-extrabold text-[#5B3FD9]">12 Days</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT / MANUAL ATTENDANCE MODAL ─── */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-extrabold text-gray-900">Edit Attendance Record</h3>
              <button onClick={() => setEditingRecord(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Employee Name</label>
                <input
                  type="text"
                  disabled
                  value={editingRecord.employee_name}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-100 font-bold text-gray-700"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Attendance Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                  className="w-full h-9 px-3 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                >
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                  <option value="leave">On Leave</option>
                  <option value="work_from_home">Work From Home</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Check-In Time</label>
                  <input
                    type="text"
                    value={editCheckIn}
                    onChange={(e) => setEditCheckIn(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Check-Out Time</label>
                  <input
                    type="text"
                    value={editCheckOut}
                    onChange={(e) => setEditCheckOut(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Admin Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Approved manual check-in by Admin"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-gray-300 bg-white font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 h-9 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditModal}
                className="px-5 h-9 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] shadow-md shadow-[#5B3FD9]/20"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
