import {
  MessageSquare, Eye, Pencil, Trash2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import type { TeamMember } from '@/types/team'
import { AVAILABILITY_LABELS, AVAILABILITY_COLORS } from '@/types/team'

interface TeamTableProps {
  members: TeamMember[]
  onViewProfile: (member: TeamMember) => void
  onEdit: (member: TeamMember) => void
  onDelete: (id: string, name: string) => void
}

export function TeamTable({
  members,
  onViewProfile,
  onEdit,
  onDelete,
}: TeamTableProps) {
  const handleWhatsApp = (number: string) => {
    const cleanNum = number.replace(/[^\d]/g, '')
    window.open(`https://wa.me/${cleanNum}`, '_blank')
  }

  if (members.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center text-xs text-gray-500 font-sans space-y-3">
        <div className="size-14 rounded-2xl bg-purple-50 text-[#5B3FD9] flex items-center justify-center mx-auto border border-purple-100 shadow-2xs">
          <MessageSquare size={28} />
        </div>
        <h3 className="text-sm font-extrabold text-gray-900">No Registered Team Members Found</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Your studio staff directory is empty. Click <strong>+ Add Team Member</strong> above to register your photographers, videographers, editors, or managers.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs font-sans overflow-hidden">
      {/* ─── Mobile Team Cards View (< md) ─── */}
      <div className="md:hidden space-y-3 p-3 bg-[#FAFAFC]">
        {members.map((m) => {
          const availConfig = AVAILABILITY_COLORS[m.availability] || AVAILABILITY_COLORS.available
          return (
            <div
              key={m.id}
              onClick={() => onViewProfile(m)}
              className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-3 cursor-pointer hover:border-[#5B3FD9] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {m.photo_url ? (
                    <img
                      src={m.photo_url}
                      alt={m.full_name}
                      className="size-10 rounded-xl object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="size-10 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center font-bold text-xs">
                      {m.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-extrabold text-[#111827]">{m.full_name}</h4>
                    <span className="text-[10px] font-bold text-[#5B3FD9] uppercase block">{m.job_role || (m.job_roles && m.job_roles[0]) || 'Staff'}</span>
                  </div>
                </div>

                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase', availConfig.bg, availConfig.text)}>
                  {AVAILABILITY_LABELS[m.availability] || m.availability}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 font-medium pt-2 border-t border-gray-100">
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-mono block">Department</span>
                  <span className="font-bold text-[#111827] block">{m.department || 'Production'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-mono block">Phone</span>
                  <span className="font-bold text-[#111827] block">{m.mobile_number || m.whatsapp_number || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleWhatsApp(m.whatsapp_number || m.mobile_number || '')
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-[11px] flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                >
                  <MessageSquare size={13} /> WhatsApp
                </button>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onViewProfile(m)}
                    className="p-2 rounded-xl text-gray-500 hover:text-[#5B3FD9] hover:bg-purple-50 transition-colors"
                    title="View Profile"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => onEdit(m)}
                    className="p-2 rounded-xl text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    title="Edit Member"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(m.id, m.full_name)}
                    className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Member"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── Desktop Team Table View (≥ md) ─── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FAFAFC] border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="px-3.5 py-3">Member</th>
              <th className="px-3.5 py-3">Job Role</th>
              <th className="px-3.5 py-3">Department</th>
              <th className="px-3.5 py-3">Type</th>
              <th className="px-3.5 py-3">Pay Rate</th>
              <th className="px-3.5 py-3">Mobile & WhatsApp</th>
              <th className="px-3.5 py-3">Availability</th>
              <th className="px-3.5 py-3">Current Assignment</th>
              <th className="px-3.5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {members.map((m) => {
              const availConfig = AVAILABILITY_COLORS[m.availability] || AVAILABILITY_COLORS.available

            return (
              <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                {/* Photo & Name */}
                <td className="px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    {m.photo_url ? (
                      <img
                        src={m.photo_url}
                        alt={m.full_name}
                        className="size-8 rounded-xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="size-8 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center font-bold text-xs">
                        {m.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-[#111827]">{m.full_name}</div>
                      <span className="font-mono text-[10px] text-gray-400 font-semibold">{m.employee_id}</span>
                    </div>
                  </div>
                </td>

                {/* Job Roles */}
                <td className="px-3.5 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[220px]">
                    {(m.job_roles && m.job_roles.length > 0 ? m.job_roles : [m.job_role || 'Photographer']).map((role, idx) => (
                      <span
                        key={idx}
                        className="bg-purple-50 text-[#5B3FD9] border border-purple-100 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Department */}
                <td className="px-3.5 py-3 font-semibold text-gray-600 whitespace-nowrap">
                  {m.department}
                </td>

                {/* Team Type */}
                <td className="px-3.5 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    m.team_type === 'in_house' ? 'bg-purple-50 text-[#5B3FD9] border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {m.team_type === 'in_house' ? 'In-House' : 'Freelancer'}
                  </span>
                </td>

                {/* Pay Rate */}
                <td className="px-3.5 py-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                  {m.team_type === 'freelancer' ? (
                    <span>₹{(m.daily_rate || 0).toLocaleString()}<span className="text-[10px] font-normal text-gray-400">/day</span></span>
                  ) : (
                    <span>₹{(m.monthly_salary || 0).toLocaleString()}<span className="text-[10px] font-normal text-gray-400">/mo</span></span>
                  )}
                </td>

                {/* Mobile & WhatsApp */}
                <td className="px-3.5 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-700">{m.mobile_number}</span>
                    <button
                      onClick={() => handleWhatsApp(m.whatsapp_number || m.mobile_number)}
                      title="Chat on WhatsApp"
                      className="size-6 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors"
                    >
                      <MessageSquare size={12} />
                    </button>
                  </div>
                </td>

                {/* Availability */}
                <td className="px-3.5 py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${availConfig.bg} ${availConfig.text}`}>
                    {AVAILABILITY_LABELS[m.availability]}
                  </span>
                </td>

                {/* Current Assignment */}
                <td className="px-3.5 py-3 text-gray-600">
                  {m.current_assignment ? (
                    <span className="truncate max-w-[150px] block font-medium" title={m.current_assignment}>
                      {m.current_assignment}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic text-[11px]">No Active Project</span>
                  )}
                </td>

                {/* Action Buttons */}
                <td className="px-3.5 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onViewProfile(m)}
                      title="View Profile"
                      className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-[#5B3FD9] hover:text-white transition-colors"
                    >
                      <Eye size={13} />
                    </button>

                    <button
                      onClick={() => onEdit(m)}
                      title="Edit Member"
                      className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      onClick={() => onDelete(m.id, m.full_name)}
                      title="Delete Member"
                      className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </div>
  )
}
