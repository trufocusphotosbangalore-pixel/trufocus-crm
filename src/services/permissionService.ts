import type { CrmModuleId } from '@/types/teamAccess'
import {
  getActiveRoleId as _getActiveRoleId,
  getRolePermissionConfig as _getRolePermissionConfig,
  getModulePermissions as _getModulePermissions,
  loadAllRoleConfigs as _loadAllRoleConfigs,
  saveAllRoleConfigs as _saveAllRoleConfigs,
  setActiveRoleId as _setActiveRoleId,
  loadUserAssignments as _loadUserAssignments,
  saveUserAssignments as _saveUserAssignments,
  loadAuditLogs as _loadAuditLogs,
  logPermissionAction as _logPermissionAction,
  duplicateRole as _duplicateRole,
  deleteRole as _deleteRole,
  renameRole as _renameRole,
  resetRoleToDefaults as _resetRoleToDefaults,
  createCustomRole as _createCustomRole,
} from './teamAccessStore'

export function loadAllRoleConfigs() {
  return _loadAllRoleConfigs()
}

export function saveAllRoleConfigs(configs: Parameters<typeof _saveAllRoleConfigs>[0]) {
  return _saveAllRoleConfigs(configs)
}

export function getActiveRoleId() {
  return _getActiveRoleId()
}

export function setActiveRoleId(roleId: string) {
  return _setActiveRoleId(roleId)
}

export function getRolePermissionConfig(roleId: string) {
  return _getRolePermissionConfig(roleId)
}

export function getModulePermissions(moduleId: CrmModuleId, roleId?: string) {
  return _getModulePermissions(moduleId, roleId)
}

export function canAccessModule(moduleId: CrmModuleId, roleId?: string) {
  return getModulePermissions(moduleId, roleId).view
}

export function hasPermission(
  moduleId: CrmModuleId,
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export_share' = 'view',
  roleId?: string
) {
  const activeRole = roleId || getActiveRoleId()
  if (activeRole === 'owner') return true

  const perm = getModulePermissions(moduleId, activeRole)
  if (!perm) return false

  switch (action) {
    case 'create':
      return Boolean(perm.create)
    case 'edit':
      return Boolean(perm.edit)
    case 'delete':
      return Boolean(perm.delete)
    case 'approve':
      return Boolean(perm.approve)
    case 'export_share':
      return Boolean(perm.export_share)
    default:
      return Boolean(perm.view)
  }
}

export function canPerformDelete(_moduleId?: CrmModuleId, roleId?: string) {
  const activeRole = roleId || getActiveRoleId()
  return activeRole === 'owner' || activeRole === 'administrator'
}

export function canUserPerformDelete(moduleId?: CrmModuleId, roleId?: string) {
  return canPerformDelete(moduleId, roleId)
}

export function loadUserAssignments() {
  return _loadUserAssignments()
}

export function saveUserAssignments(members: Parameters<typeof _saveUserAssignments>[0]) {
  return _saveUserAssignments(members)
}

export function loadPermissionAuditLogs() {
  return _loadAuditLogs()
}

export function logPermissionAction(action: string, actor: string, targetRole: string, details: string) {
  return _logPermissionAction(action, actor, targetRole, details)
}

export function createCustomRole(
  roleName: string,
  description: string,
  productionStage: Parameters<typeof _createCustomRole>[2] = 'management',
  customModules?: Parameters<typeof _createCustomRole>[3],
  createdBy = 'Admin'
) {
  return _createCustomRole(roleName, description, productionStage, customModules, createdBy)
}

export function duplicateRole(roleId: string, newRoleName: string, actor = 'Admin') {
  return _duplicateRole(roleId, newRoleName, actor)
}

export function deleteRole(roleId: string, actor = 'Admin') {
  return _deleteRole(roleId, actor)
}

export function renameRole(roleId: string, newName: string, actor = 'Admin') {
  return _renameRole(roleId, newName, actor)
}

export function resetRoleToDefaults(roleId: string, actor = 'Admin') {
  return _resetRoleToDefaults(roleId, actor)
}
