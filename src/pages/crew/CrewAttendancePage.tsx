import { useState } from 'react'
import { Clock, MapPin, CheckCircle, Calendar, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function CrewAttendancePage() {
  const [checkedIn, setCheckedIn] = useState(true)

  const handleCheckInOut = () => {
    if (checkedIn) {
      setCheckedIn(false)
      toast.success('Successfully checked out via GPS!')
    } else {
      setCheckedIn(true)
      toast.success('Successfully checked in via GPS!')
    }
  }

  const attendanceLogs = [
    { date: '2026-08-07', checkIn: '08:30 AM', checkOut: '06:30 PM', hours: '10 hrs', location: 'Studio / On Location', status: 'Present' },
    { date: '2026-08-06', checkIn: '08:45 AM', checkOut: '07:00 PM', hours: '10.25 hrs', location: 'Royal Palace Banquet', status: 'Present' },
    { date: '2026-08-05', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9 hrs', location: 'Studio Desk', status: 'Present' },
    { date: '2026-08-04', checkIn: '08:30 AM', checkOut: '06:30 PM', hours: '10 hrs', location: 'Grand Pavilion', status: 'Present' },
  ]

  return (
    <div className="space-y-6 text-gray-900 font-sans max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Clock size={24} className="text-[#5B3FD9]" /> Attendance & GPS Check-In
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Log your daily check-in, check-out, and on-venue GPS location verification.
          </p>
        </div>

        <button
          onClick={handleCheckInOut}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-2 ${
            checkedIn
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-[#5B3FD9] hover:bg-[#4C34C3] text-white'
          }`}
        >
          <Clock size={16} /> {checkedIn ? 'GPS Check-Out' : 'GPS Check-In'}
        </button>
      </div>

      {/* 4 CRM KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block">Present Days</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">22 / 24</span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">91.6% Attendance</span>
          </div>
          <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block">Total Hours (Month)</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">186 hrs</span>
            <span className="text-[11px] text-purple-600 font-semibold mt-0.5 block">Avg 8.4 hrs/day</span>
          </div>
          <div className="size-12 rounded-2xl bg-purple-50 text-[#5B3FD9] border border-purple-100 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block">Late Arrivals</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">1</span>
            <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">On-Time Rate 95.8%</span>
          </div>
          <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold">
            <AlertCircle size={22} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block">Overtime Hours</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">14 hrs</span>
            <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">Approved OT</span>
          </div>
          <div className="size-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
            <Calendar size={22} />
          </div>
        </div>
      </div>

      {/* Attendance History CRM Data Table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-gray-900">Attendance Log History</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold uppercase">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Check In</th>
                <th className="py-3.5 px-4">Check Out</th>
                <th className="py-3.5 px-4">Logged Hours</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {attendanceLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-gray-900">{log.date}</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold">{log.checkIn}</td>
                  <td className="py-3.5 px-4 text-rose-600 font-bold">{log.checkOut}</td>
                  <td className="py-3.5 px-4 text-gray-700">{log.hours}</td>
                  <td className="py-3.5 px-4 text-gray-700 flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#5B3FD9]" /> {log.location}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
