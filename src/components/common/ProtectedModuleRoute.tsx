import React from 'react'
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CrmModuleId } from '@/types/teamAccess'
import { useTeamPermissions } from '@/hooks/useTeamPermissions'
import { useAuth } from '@/hooks/useAuth'
import { getCrewSession } from '@/services/crewSessionService'

interface ProtectedModuleRouteProps {
  module: CrmModuleId
  children: React.ReactNode
}

export function ProtectedModuleRoute({ module, children }: ProtectedModuleRouteProps) {
  const { user } = useAuth()
  const crewUser = getCrewSession()
  const { canAccessModule, activeRoleConfig } = useTeamPermissions()

  // If user is logged in via Crew Portal, block all CRM Admin routes
  if (crewUser && !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 font-sans text-xs bg-[#0B0F17] text-white">
        <div className="max-w-md w-full bg-[#111827] rounded-3xl border border-red-500/30 p-8 text-center space-y-5 shadow-2xl">
          <div className="size-16 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20 shadow-xs">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 font-extrabold text-[10px] uppercase">
              <Lock size={12} /> 403 - Restricted Crew Access
            </div>
            <h1 className="text-xl font-extrabold text-white">CRM Admin Restricted</h1>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              You are signed in to the <strong>Trufocus Crew Portal</strong>. Access to CRM admin modules is reserved for Owners, Administrators, and Managers.
            </p>
          </div>

          <div className="pt-3 border-t border-gray-800 flex items-center justify-center gap-3">
            <Link
              to="/crew/dashboard"
              className="px-5 py-2.5 text-xs font-extrabold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] inline-flex items-center gap-2 shadow-lg shadow-[#5B3FD9]/30 transition-all"
            >
              <ArrowLeft size={14} /> Back to Trufocus Crew
            </Link>
          </div>
        </div>
      </div>
    )
  }

  let hasAccess = canAccessModule(module)
  if (module === 'dashboard') {
    hasAccess = true
  } else if (user?.module_access && typeof user.module_access[module] === 'boolean') {
    hasAccess = user.module_access[module]
  }

  if (hasAccess) {
    return <>{children}</>
  }

  const moduleTitles: Record<CrmModuleId, string> = {
    dashboard: 'Dashboard',
    enquiries: 'Enquiries & Leads',
    work_orders: 'Work Orders & Projects',
    post_production: 'Post Production',
    data: 'Data & Files',
    team: 'Team & Staff',
    finances: 'Finances & Ledger',
    client_requests: 'Client Requests',
    trufocus_ai: 'Trufocus AI Assistant',
    reports: 'Reports & Analytics',
    settings: 'Settings',
    portal_management: 'Customer Portal Management',
    gallery: 'Photo Gallery',
    documents: 'Documents',
    analytics: 'Analytics',
    notifications: 'Notifications',
  }

  const moduleName = moduleTitles[module] || module

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 font-sans text-xs">
      <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center space-y-5 shadow-sm">
        <div className="size-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100 shadow-xs">
          <ShieldAlert size={32} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 font-extrabold text-[10px]">
            <Lock size={12} /> Restricted Access
          </div>
          <h1 className="text-xl font-extrabold text-gray-900">403 - Access Denied</h1>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            You do not have permission to access the <strong className="text-gray-800">{moduleName}</strong> module under your currently assigned role (<strong className="text-[#5B3FD9]">{activeRoleConfig?.role_name || 'Assigned Role'}</strong>).
          </p>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] inline-flex items-center gap-2 shadow-xs transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
