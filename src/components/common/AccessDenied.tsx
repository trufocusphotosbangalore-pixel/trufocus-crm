import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getActiveRoleId, getRolePermissionConfig } from '@/services/permissionService'

interface AccessDeniedProps {
  moduleName?: string
}

export function AccessDenied({ moduleName }: AccessDeniedProps) {
  const navigate = useNavigate()
  const activeRoleId = getActiveRoleId()
  const roleConfig = getRolePermissionConfig(activeRoleId)

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-8 sm:p-10 space-y-6 relative overflow-hidden">
        {/* Soft Ambient Background Glow */}
        <div className="absolute -top-10 -right-10 size-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Lock Icon Badge */}
        <div className="size-20 rounded-3xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mx-auto shadow-md">
          <ShieldAlert size={40} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-[10px] font-extrabold uppercase tracking-wider">
            <Lock size={12} /> 403 Forbidden
          </div>

          <h1 className="text-2xl font-black text-[#0F172A]">
            Access Denied
          </h1>

          <p className="text-xs font-semibold text-[#64748B] leading-relaxed">
            You do not have permission to access the{' '}
            <strong className="text-[#0F172A] uppercase">{moduleName || 'requested'}</strong> module.
          </p>
        </div>

        {/* User Role Pill */}
        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium space-y-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Your Current Active Role</span>
          <span className="font-extrabold text-[#2563EB] bg-[#2563EB]/10 border border-[#2563EB]/20 px-3 py-1 rounded-lg inline-block">
            {roleConfig.role_name}
          </span>
          <p className="text-[11px] text-gray-500 pt-1">
            Contact your Studio Owner or Administrator to request permission access.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-[#0F172A] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft size={14} /> Go Back
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Home size={14} /> Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
