import { X, User, Phone, Mail, ShieldCheck, Briefcase, Calendar } from 'lucide-react'
import type { UserAccount } from '@/types/teamLogin'

interface EmployeeProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
  employee: UserAccount | null
  activeAssignmentCount?: number
}

export function EmployeeProfileDrawer({
  isOpen,
  onClose,
  employee,
  activeAssignmentCount = 0,
}: EmployeeProfileDrawerProps) {
  if (!isOpen || !employee) return null

  const fullName = employee.full_name || employee.employee_name || employee.username || 'Staff Member'
  const mobile = employee.mobile || employee.mobile_number || ''
  const email = employee.email || employee.email_address || ''
  const roleName = employee.workspace_role || employee.role_name || 'Staff'

  const roles = employee.job_roles && employee.job_roles.length > 0
    ? employee.job_roles.join(', ')
    : employee.job_role || roleName

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-gray-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4 mt-2">
            <div className="size-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-black text-xl text-indigo-200 shadow-inner">
              {fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                {employee.team_type === 'in_house' ? 'In-House Staff' : 'Freelance Partner'}
              </span>
              <h2 className="text-lg font-black mt-1 text-white">{fullName}</h2>
              <p className="text-xs text-indigo-200">{roles}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-purple-700 block tracking-wider">
                Active Assignments
              </span>
              <span className="text-2xl font-black text-[#5B3FD9]">{activeAssignmentCount}</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-emerald-700 block tracking-wider">
                Status
              </span>
              <span className="text-sm font-extrabold text-emerald-600 block mt-1">
                {employee.status === 'active' || employee.account_status === 'active' ? '● Active Staff' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-2">
              Staff Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500 flex items-center gap-2 font-medium">
                  <User size={14} className="text-[#5B3FD9]" /> Employee ID
                </span>
                <span className="font-mono font-bold text-gray-900">{employee.employee_id || employee.id}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500 flex items-center gap-2 font-medium">
                  <Briefcase size={14} className="text-[#5B3FD9]" /> Department
                </span>
                <span className="font-semibold text-gray-800">{employee.department || 'Production'}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500 flex items-center gap-2 font-medium">
                  <ShieldCheck size={14} className="text-[#5B3FD9]" /> Workspace Role
                </span>
                <span className="font-semibold text-gray-800 uppercase text-[11px] bg-gray-100 px-2 py-0.5 rounded">
                  {roleName}
                </span>
              </div>

              {mobile && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500 flex items-center gap-2 font-medium">
                    <Phone size={14} className="text-[#5B3FD9]" /> Phone
                  </span>
                  <span className="font-semibold text-gray-900">{mobile}</span>
                </div>
              )}

              {email && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500 flex items-center gap-2 font-medium">
                    <Mail size={14} className="text-[#5B3FD9]" /> Email
                  </span>
                  <span className="font-semibold text-gray-900">{email}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500 flex items-center gap-2 font-medium">
                  <Calendar size={14} className="text-[#5B3FD9]" /> Date Joined
                </span>
                <span className="font-semibold text-gray-800">
                  {employee.created_at ? new Date(employee.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  )
}
