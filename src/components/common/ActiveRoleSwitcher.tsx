import { useState } from 'react'
import { ShieldCheck, ChevronDown, Check, User } from 'lucide-react'
import { useTeamPermissions } from '@/hooks/useTeamPermissions'

export function ActiveRoleSwitcher() {
  const { activeRoleId, activeRoleConfig, allRoles, setTestRole } = useTeamPermissions()
  const [isOpen, setIsOpen] = useState(false)

  // Requirement: Only Owner and Administrator can access the Role Switcher dropdown
  // Check if current base role is owner or administrator
  const isOwnerOrAdmin = activeRoleId === 'owner' || activeRoleId === 'administrator' || activeRoleId === 'admin'

  // Non-admin users see static role badge with no dropdown
  if (!isOwnerOrAdmin) {
    return (
      <div className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/80 text-[#2563EB] font-extrabold flex items-center gap-1.5 text-xs shadow-2xs select-none">
        <ShieldCheck size={14} className="text-[#2563EB]" />
        <span>Role: <strong>{activeRoleConfig?.role_name || 'Staff'}</strong></span>
      </div>
    )
  }

  // Owner & Administrator see interactive role switcher for real-time testing & impersonation
  return (
    <div className="relative font-sans text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/80 hover:bg-purple-100/80 text-[#5B3FD9] font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
        title="Owner/Admin Role Switcher: Test CRM as different team roles"
      >
        <ShieldCheck size={14} className="text-[#5B3FD9]" />
        <span>Role: <strong className="font-extrabold">{activeRoleConfig?.role_name || 'Owner'}</strong></span>
        <ChevronDown size={13} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#E5E7EB] shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-[#5B3FD9] tracking-wider">RBAC Role Switcher</p>
                <p className="text-[11px] text-gray-500 font-medium">Impersonate role for testing</p>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-purple-100 text-[#5B3FD9] text-[9px] font-extrabold">Admin Only</span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-0.5">
              {allRoles.map((role) => {
                const isSelected = role.role_id === activeRoleId
                return (
                  <button
                    key={role.role_id}
                    onClick={() => {
                      setTestRole(role.role_id)
                      setIsOpen(false)
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#5B3FD9] text-white font-bold'
                        : 'hover:bg-gray-100 text-gray-800 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User size={13} className={isSelected ? 'text-white' : 'text-gray-400'} />
                      <span>{role.role_name}</span>
                    </div>
                    {isSelected && <Check size={13} className="text-white" />}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
