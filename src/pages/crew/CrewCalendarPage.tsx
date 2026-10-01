import { Calendar as CalendarIcon, MapPin } from 'lucide-react'

export default function CrewCalendarPage() {
  const events = [
    { date: '2026-08-07', type: 'Shoot', title: 'Grand Royal Wedding Shoot', venue: 'Royal Palace Banquet' },
    { date: '2026-08-09', type: 'Editing', title: 'Teaser Delivery Deadline', venue: 'Post-Production Desk' },
    { date: '2026-08-12', type: 'Shoot', title: 'Corporate Gala Night', venue: 'Marriott Hotel' },
    { date: '2026-08-15', type: 'Holiday', title: 'Independence Day Holiday', venue: 'Studio Closed' },
  ]

  return (
    <div className="space-y-6 text-gray-900 font-sans max-w-7xl mx-auto">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <CalendarIcon size={24} className="text-[#5B3FD9]" /> Schedule & Calendar
        </h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Unified view of shoots, editing deadlines, meetings, and leaves.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((e, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-slate-50 border border-gray-200 space-y-2 hover:border-[#5B3FD9]/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-[#5B3FD9] border border-purple-200 uppercase">
                  {e.type}
                </span>
                <span className="text-xs font-bold text-gray-500">{e.date}</span>
              </div>
              <h4 className="text-sm font-extrabold text-gray-900">{e.title}</h4>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                <MapPin size={13} className="text-[#5B3FD9]" /> {e.venue}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
