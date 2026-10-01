import { TeamAccessTab } from '@/components/settings/TeamAccessTab'
import { ShieldCheck } from 'lucide-react'

export default function TeamRolesPage() {
  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <span className="p-3 rounded-2xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
            <ShieldCheck size={26} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-1 rounded-md text-xs">
                ROLES & PERMISSIONS GOVERNANCE
              </span>
              <h1 className="ui-page-title text-[32px] font-extrabold text-[#111827]">Roles & Access Management</h1>
            </div>
            <p className="ui-small-label text-[13px] text-gray-500 mt-1">
              Configure workspace roles, module-level access permissions, and system authority levels.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
        <TeamAccessTab />
      </div>
    </div>
  )
}
