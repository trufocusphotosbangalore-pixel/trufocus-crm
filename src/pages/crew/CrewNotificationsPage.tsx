import { Bell } from 'lucide-react'

export default function CrewNotificationsPage() {
  const notifications = [
    { id: '1', title: 'New Shoot Assignment', desc: 'Assigned as Lead Photographer for Royal Wedding Reception.', time: '10 mins ago', type: 'assignment' },
    { id: '2', title: 'Venue Location Updated', desc: 'Royal Palace Banquet Hall address verified.', time: '1 hour ago', type: 'venue' },
    { id: '3', title: 'Shift Check-in Reminder', desc: 'Please log your attendance check-in for today.', time: '2 hours ago', type: 'reminder' },
  ]

  return (
    <div className="space-y-6 text-gray-900 font-sans max-w-7xl mx-auto">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Bell size={24} className="text-[#5B3FD9]" /> Crew Notifications
        </h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Realtime updates for assignments, venue updates, reminders, and shift approvals.
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-start gap-4 hover:border-[#5B3FD9]/40 transition-all">
            <div className="size-10 rounded-xl bg-purple-50 border border-purple-200 text-[#5B3FD9] flex items-center justify-center shrink-0">
              <Bell size={18} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-gray-900">{n.title}</h4>
                <span className="text-[10px] font-bold text-gray-400">{n.time}</span>
              </div>
              <p className="text-xs text-gray-500 font-medium">{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
