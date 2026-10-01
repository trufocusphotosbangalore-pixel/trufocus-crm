import type { CrmModuleId } from '@/types/teamAccess'
import { getActiveRoleId, loadAllRoleConfigs } from './permissionService'
import { getCachedUserAccounts } from './employeeService'
import { pushEntityToCloud } from './cloudSyncService'

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export_share'

export interface AIPermissionAuditLog {
  id: string
  user_id: string
  user_name: string
  role: string
  module: CrmModuleId | string
  requested_action: PermissionAction
  prompt_text: string
  timestamp: string
  allowed: boolean
  reason: string
}

const AUDIT_STORAGE_KEY = 'trufocus_crm_permission_audit_logs_v1'

export function getAIPermissionAuditLogs(): AIPermissionAuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error loading AI permission audit logs:', e)
  }
  return []
}

export function logAIPermissionAudit(entry: Omit<AIPermissionAuditLog, 'id' | 'timestamp'>): AIPermissionAuditLog {
  const logs = getAIPermissionAuditLogs()
  const newLog: AIPermissionAuditLog = {
    ...entry,
    id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
  }

  const updated = [newLog, ...logs].slice(0, 200)
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated))
    pushEntityToCloud('ai_permission_audit_logs', 'main', updated)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trufocus_permissions_updated'))
    }
  } catch (e) {
    console.error('Error saving permission audit log:', e)
  }
  return newLog
}

export interface CheckAIPermissionOptions {
  module: CrmModuleId
  action: PermissionAction
  promptText?: string
}

export interface CheckAIPermissionResult {
  allowed: boolean
  reason: string
  roleId: string
  roleName: string
}

export function checkAIPermission(options: CheckAIPermissionOptions): CheckAIPermissionResult {
  const { module, action, promptText = '' } = options

  const activeRoleId = getActiveRoleId() || 'owner'
  const roleConfigs = loadAllRoleConfigs()
  const activeRoleConfig = roleConfigs.find((r: any) => r.role_id === activeRoleId) || roleConfigs[0]

  const accounts = getCachedUserAccounts()
  const loggedUser = accounts.find((a) => a.role_id === activeRoleId) || accounts[0]
  const userName = loggedUser?.employee_name || 'Studio Member'
  const userId = loggedUser?.id || 'usr-default'
  const roleName = activeRoleConfig?.role_name || activeRoleId

  // RULE 3: Deletion Permissions - ONLY Owner & Administrator allowed
  if (action === 'delete') {
    const isOwnerOrAdmin = activeRoleId === 'owner' || activeRoleId === 'administrator' || activeRoleConfig?.role_id === 'owner' || activeRoleConfig?.role_id === 'administrator'

    if (!isOwnerOrAdmin) {
      const reason = "You don't have permission to delete records. Please contact an Administrator or Owner."
      logAIPermissionAudit({
        user_id: userId,
        user_name: userName,
        role: roleName,
        module: module,
        requested_action: action,
        prompt_text: promptText || `Attempted ${action} on ${module}`,
        allowed: false,
        reason: reason,
      })

      return {
        allowed: false,
        reason,
        roleId: activeRoleId,
        roleName,
      }
    }
  }

  // Owner always has full access across all modules
  if (activeRoleId === 'owner' || activeRoleConfig?.role_id === 'owner') {
    return {
      allowed: true,
      reason: 'Owner role has full unrestricted access.',
      roleId: activeRoleId,
      roleName,
    }
  }

  // Check module permission in Role Configuration
  const modulePerms = activeRoleConfig?.modules?.[module]
  let isAllowed = false

  if (modulePerms) {
    if (action === 'view') isAllowed = Boolean(modulePerms.view)
    else if (action === 'create') isAllowed = Boolean(modulePerms.create)
    else if (action === 'edit') isAllowed = Boolean(modulePerms.edit)
    else if (action === 'delete') isAllowed = Boolean(modulePerms.delete)
    else if (action === 'approve') isAllowed = Boolean(modulePerms.approve ?? modulePerms.edit)
    else if (action === 'export_share') isAllowed = Boolean(modulePerms.export_share ?? modulePerms.view)
  }

  if (!isAllowed) {
    const actionLabel = action.toUpperCase()
    const reason = `Access Denied: Your role (${roleName}) does not have '${actionLabel}' permission for the '${module}' module.`

    logAIPermissionAudit({
      user_id: userId,
      user_name: userName,
      role: roleName,
      module: module,
      requested_action: action,
      prompt_text: promptText || `Attempted ${action} on ${module}`,
      allowed: false,
      reason: reason,
    })

    return {
      allowed: false,
      reason,
      roleId: activeRoleId,
      roleName,
    }
  }

  return {
    allowed: true,
    reason: 'Permission granted.',
    roleId: activeRoleId,
    roleName,
  }
}

/**
 * Detect Intent from Natural Language Prompt
 */
export function analyzePromptPermission(promptText: string): CheckAIPermissionResult {
  const p = promptText.toLowerCase()

  // Detect Action Intent
  let action: PermissionAction = 'view'
  if (p.includes('delete') || p.includes('remove') || p.includes('cancel work order') || p.includes('purge') || p.includes('erase')) {
    action = 'delete'
  } else if (p.includes('approve') || p.includes('sign contract') || p.includes('accept quotation')) {
    action = 'approve'
  } else if (p.includes('export') || p.includes('download pdf') || p.includes('share gallery') || p.includes('export ledger')) {
    action = 'export_share'
  } else if (p.includes('create') || p.includes('add') || p.includes('record payment') || p.includes('new work order') || p.includes('generate invoice')) {
    action = 'create'
  } else if (p.includes('edit') || p.includes('update') || p.includes('modify') || p.includes('change status') || p.includes('assign team')) {
    action = 'edit'
  }

  // Detect Module Intent
  let module: CrmModuleId = 'work_orders'
  if (p.includes('finance') || p.includes('payment') || p.includes('revenue') || p.includes('ledger') || p.includes('invoice') || p.includes('receipt')) {
    module = 'finances'
  } else if (p.includes('team') || p.includes('staff') || p.includes('employee') || p.includes('crew') || p.includes('payroll')) {
    module = 'team'
  } else if (p.includes('enquiry') || p.includes('lead') || p.includes('prospect')) {
    module = 'enquiries'
  } else if (p.includes('post production') || p.includes('deliverable') || p.includes('editing') || p.includes('album')) {
    module = 'post_production'
  } else if (p.includes('gallery') || p.includes('photo gallery')) {
    module = 'gallery'
  } else if (p.includes('client request') || p.includes('support')) {
    module = 'client_requests'
  } else if (p.includes('setting') || p.includes('configuration')) {
    module = 'settings'
  } else if (p.includes('report') || p.includes('analytics')) {
    module = 'reports'
  }

  return checkAIPermission({ module, action, promptText })
}
