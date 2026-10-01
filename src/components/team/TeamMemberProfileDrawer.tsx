import {
  X, Phone, MessageSquare, Mail, MapPin, CreditCard,
} from 'lucide-react'
import type { TeamMember } from '@/types/team'
import { AVAILABILITY_COLORS, AVAILABILITY_LABELS } from '@/types/team'

interface TeamMemberProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
  member: TeamMember | null
}

export function TeamMemberProfileDrawer({
  isOpen,
  onClose,
  member,
}: TeamMemberProfileDrawerProps) {
  if (!isOpen || !member) return null

  const availConfig = AVAILABILITY_COLORS[member.availability] || AVAILABILITY_COLORS.available

  const handleWhatsApp = () => {
    const cleanNum = member.whatsapp_number || member.mobile_number
    const numOnly = cleanNum.replace(/[^\d]/g, '')
    window.open(`https://wa.me/${numOnly}`, '_blank')
  }

  const handleCall = () => {
    window.open(`tel:${member.mobile_number}`, '_self')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={member.full_name}
                  className="size-12 rounded-2xl object-cover border border-gray-200 shadow-xs"
                />
              ) : (
                <div className="size-12 rounded-2xl bg-[#5B3FD9] text-white flex items-center justify-center font-extrabold text-base shadow-md shadow-[#5B3FD9]/20">
                  {member.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#111827]">{member.full_name}</h2>
                  <span className="font-mono text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {member.employee_id}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(member.job_roles && member.job_roles.length > 0 ? member.job_roles : [member.job_role || 'Photographer']).map((role, idx) => (
                    <span
                      key={idx}
                      className="bg-purple-50 text-[#5B3FD9] border border-purple-100 px-2 py-0.5 rounded-md text-[10px] font-bold"
                    >
                      {role}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 font-medium mt-1">Department: <strong>{member.department}</strong></p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="size-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleWhatsApp}
                className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <MessageSquare size={15} /> Chat WhatsApp
              </button>
              <button
                onClick={handleCall}
                className="h-10 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Phone size={15} /> Call Employee
              </button>
            </div>

            {/* Status Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status & Role</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${availConfig.bg} ${availConfig.text}`}>
                  {AVAILABILITY_LABELS[member.availability]}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                <div>
                  <span className="text-gray-400 text-[11px] block">Team Type</span>
                  <span className="font-bold text-gray-800 uppercase">{member.team_type.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">Experience</span>
                  <span className="font-bold text-gray-800">{member.experience_years || 1} Years</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">
                    {member.team_type === 'freelancer' ? 'Daily Rate' : 'Monthly Salary'}
                  </span>
                  <span className="font-mono font-extrabold text-[#5B3FD9]">
                    ₹{((member.team_type === 'freelancer' ? member.daily_rate : member.monthly_salary) || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">Total Assignments</span>
                  <span className="font-mono font-bold text-gray-800">{member.total_assignments || 0} Shoots</span>
                </div>
              </div>
            </div>

            {/* Current Assignment */}
            {member.current_assignment && (
              <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Active Work Order</span>
                <p className="text-xs font-bold text-purple-900">{member.current_assignment}</p>
              </div>
            )}

            {/* Contact Details */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-400">Contact Details</h4>
              <div className="space-y-2 text-gray-700 font-medium">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-[#5B3FD9]" />
                  <span>{member.mobile_number}</span>
                </div>
                {member.email_address && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-[#5B3FD9]" />
                    <span>{member.email_address}</span>
                  </div>
                )}
                {member.preferred_city && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#5B3FD9]" />
                    <span>{member.preferred_city}</span>
                  </div>
                )}
                {member.address && (
                  <p className="text-gray-500 text-[11px] pt-1 pl-6">{member.address}</p>
                )}
              </div>
            </div>

            {/* Bank & Payment Information */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <CreditCard size={14} /> Bank & Verification
              </h4>
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 space-y-2 text-xs">
                {member.upi_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">UPI ID</span>
                    <span className="font-mono font-bold text-[#5B3FD9]">{member.upi_id}</span>
                  </div>
                )}
                {member.bank_details?.bank_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Bank Name</span>
                    <span className="font-bold text-gray-800">{member.bank_details.bank_name}</span>
                  </div>
                )}
                {member.bank_details?.account_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Account No</span>
                    <span className="font-mono text-gray-800">{member.bank_details.account_number}</span>
                  </div>
                )}
                {member.bank_details?.ifsc_code && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">IFSC Code</span>
                    <span className="font-mono text-gray-800">{member.bank_details.ifsc_code}</span>
                  </div>
                )}
                {member.pan_number && (
                  <div className="flex justify-between pt-1 border-t border-gray-200">
                    <span className="text-gray-500 font-medium">PAN</span>
                    <span className="font-mono uppercase font-bold text-gray-800">{member.pan_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Skills Badges */}
            {member.skills && member.skills.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-400">Skills & Equipment</h4>
                <div className="flex flex-wrap gap-1.5">
                  {member.skills.map((skill, idx) => (
                    <span key={idx} className="bg-purple-50 text-[#5B3FD9] border border-purple-100 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Work Orders */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-400">Assigned Work Orders</h4>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/work-orders/wo_001"
                  className="px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-[#5B3FD9]/10 text-[#5B3FD9] hover:bg-[#5B3FD9]/20 hover:underline"
                >
                  WO-2025-001
                </a>
                <a
                  href="/work-orders/wo_002"
                  className="px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-[#5B3FD9]/10 text-[#5B3FD9] hover:bg-[#5B3FD9]/20 hover:underline"
                >
                  WO-2025-002
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
