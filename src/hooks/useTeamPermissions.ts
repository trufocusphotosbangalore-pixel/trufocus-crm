import { useState, useEffect } from 'react'
import type { CrmModuleId, RolePermissionConfig } from '@/types/teamAccess'
import {
  loadAllRoleConfigs,
  getActiveRoleId,
  setActiveRoleId,
} from '@/services/permissionService'
import { useRealtimeSync } from './useRealtimeSync'

export function useTeamPermissions() {
  const [activeRoleId, setActiveRoleIdState] = useState<string>(getActiveRoleId())
  const [roles, setRoles] = useState<RolePermissionConfig[]>(loadAllRoleConfigs())

  const refreshPermissions = () => {
    setActiveRoleIdState(getActiveRoleId())
    setRoles(loadAllRoleConfigs())
  }

  useRealtimeSync(refreshPermissions)

  useEffect(() => {
    const handleStorageChange = () => refreshPermissions()
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('trufocus_permissions_updated', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('trufocus_permissions_updated', handleStorageChange)
    }
  }, [])

  const activeRoleConfig =
    roles.find((r) => r.role_id === activeRoleId) ||
    roles.find((r) => r.role_id === 'owner') ||
    roles[0]

  const setTestRole = (newRoleId: string) => {
    setActiveRoleId(newRoleId)
    setActiveRoleIdState(newRoleId)
  }

  const hasPermission = (
    module: CrmModuleId,
    action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export_share' = 'view'
  ): boolean => {
    const roleId = activeRoleId || activeRoleConfig?.role_id || 'owner'

    // Owner role always has full unrestricted access
    if (roleId === 'owner') {
      return true
    }

    // RULE 3: Delete permissions are strictly reserved for Owner and Administrator
    if (action === 'delete') {
      return roleId === 'owner' || roleId === 'administrator'
    }

    if (!activeRoleConfig?.modules?.[module]) {
      return false
    }

    return Boolean(activeRoleConfig.modules[module][action])
  }

  const canAccessModule = (module: CrmModuleId): boolean => {
    return hasPermission(module, 'view')
  }

  return {
    activeRoleId,
    activeRoleConfig,
    allRoles: roles,
    setTestRole,
    hasPermission,
    canAccessModule,
    refreshPermissions,
  }
}
