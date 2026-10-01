import React from 'react'
import type { CrmModuleId } from '@/types/teamAccess'
import { canAccessModule } from '@/services/permissionService'
import { AccessDenied } from './AccessDenied'

interface ProtectedRouteProps {
  module: CrmModuleId
  children: React.ReactNode
}

export function ProtectedRoute({ module, children }: ProtectedRouteProps) {
  const hasAccess = canAccessModule(module)

  if (!hasAccess) {
    return <AccessDenied moduleName={module.replace('_', ' ')} />
  }

  return <>{children}</>
}
