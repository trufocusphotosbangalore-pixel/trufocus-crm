import { getWorkRolesForEmployee } from './employeeWorkRolesService'
import { getStaffPortalRecord } from './crewAuthService'
import type { UserAccount } from '@/types/teamLogin'

export interface CrewPermissionSet {
  allowedModules: Set<string>
  isShootRole: boolean
  isEditRole: boolean
  isAlbumRole: boolean
  isDroneRole: boolean
  isManagementRole: boolean
}

// Canonical default modules per production category
const ON_PRODUCTION_DEFAULT_MODULES = [
  'dashboard',
  'my_assignments',
  'today_schedule',
  'calendar',
  'my_shoots',
  'attendance',
  'equipment',
  'reports',
  'help_center',
  'notifications',
  'ai_assistant',
  'profile',
]

const POST_PRODUCTION_DEFAULT_MODULES = [
  'dashboard',
  'my_editing',
  'reports',
  'calendar',
  'attendance',
  'help_center',
  'notifications',
  'ai_assistant',
  'profile',
]

const MANAGEMENT_DEFAULT_MODULES = [
  'dashboard',
  'my_assignments',
  'today_schedule',
  'calendar',
  'attendance',
  'reports',
  'help_center',
  'notifications',
  'ai_assistant',
  'profile',
]

export function getPermissionsForCrewUser(userIdOrUser: string | UserAccount | null | undefined): CrewPermissionSet {
  if (!userIdOrUser) {
    return {
      allowedModules: new Set(['dashboard', 'profile']),
      isShootRole: false,
      isEditRole: false,
      isAlbumRole: false,
      isDroneRole: false,
      isManagementRole: false,
    }
  }

  const identifiers = new Set<string>()
  let primaryId = ''

  if (typeof userIdOrUser === 'string') {
    primaryId = userIdOrUser
    if (primaryId.trim()) identifiers.add(primaryId.trim().toLowerCase())
  } else if (typeof userIdOrUser === 'object') {
    const u = userIdOrUser as UserAccount
    primaryId = u.id || u.employee_id || ''
    if (u.id) identifiers.add(String(u.id).trim().toLowerCase())
    if (u.employee_id) identifiers.add(String(u.employee_id).trim().toLowerCase())
    if (u.employee_name) identifiers.add(String(u.employee_name).trim().toLowerCase())
    if (u.full_name) identifiers.add(String(u.full_name).trim().toLowerCase())
    if (u.email) identifiers.add(String(u.email).trim().toLowerCase())
  }

  const workRoles = getWorkRolesForEmployee(primaryId)
  const portalRec = getStaffPortalRecord(primaryId)

  const allowedModules = new Set<string>()
  let isShootRole = false
  let isEditRole = false
  let isAlbumRole = false
  let isDroneRole = false
  let isManagementRole = false

  if (!workRoles || workRoles.length === 0) {
    // Fallback default On-Production modules
    ON_PRODUCTION_DEFAULT_MODULES.forEach((m) => allowedModules.add(m))
    isShootRole = true
  } else {
    for (const r of workRoles) {
      const stage = (r.production_stage || '').toLowerCase()
      const roleName = (r.role_name || '').toLowerCase()

      if (roleName.includes('photographer') || roleName.includes('videographer') || roleName.includes('cinematographer') || roleName.includes('shooter') || roleName.includes('drone') || stage === 'on_production') {
        isShootRole = true
        ON_PRODUCTION_DEFAULT_MODULES.forEach((m) => allowedModules.add(m))
      }

      if (roleName.includes('editor') || roleName.includes('editing') || roleName.includes('album') || roleName.includes('image') || stage === 'post_production') {
        isEditRole = true
        POST_PRODUCTION_DEFAULT_MODULES.forEach((m) => allowedModules.add(m))
      }

      if (roleName.includes('album')) isAlbumRole = true
      if (roleName.includes('drone')) isDroneRole = true

      if (roleName.includes('manager') || roleName.includes('coordinator') || roleName.includes('director') || roleName.includes('sales') || stage === 'management' || stage === 'pre_production') {
        isManagementRole = true
        MANAGEMENT_DEFAULT_MODULES.forEach((m) => allowedModules.add(m))
      }
    }
  }

  // Dynamic Check: If user has assigned post-production tasks in Supabase using canonical identifier matching
  try {
    const rawData = typeof window !== 'undefined' ? localStorage.getItem('trufocus_crm_post_production_v1') : null
    if (rawData) {
      let parsed = JSON.parse(rawData)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray((parsed as any).data)) {
        parsed = (parsed as any).data
      }
      if (Array.isArray(parsed)) {
        const idList = Array.from(identifiers)
        const hasAssignedEditingTasks = parsed.some((item: any) => {
          if (!item) return false
          const edName = (item.assigned_editor_name || '').toLowerCase()
          const edId = (item.assigned_editor_id || item.assigned_to || '').toLowerCase()
          return idList.some(
            (target) =>
              (edId && (edId === target || edId.includes(target) || target.includes(edId))) ||
              (edName && (edName === target || edName.includes(target) || target.includes(edName)))
          )
        })
        if (hasAssignedEditingTasks) {
          isEditRole = true
          POST_PRODUCTION_DEFAULT_MODULES.forEach((m) => allowedModules.add(m))
        }
      }
    }
  } catch (e) {
    console.error('Error dynamically checking crew editing tasks for permissions:', e)
  }

  // Intercept with Admin Module Settings (from Staff Portal Management Drawer)
  if (portalRec && portalRec.module_settings) {
    const s = portalRec.module_settings
    if (s.dashboard === false) allowedModules.delete('dashboard')
    if (s.my_assignments === false) allowedModules.delete('my_assignments')
    if (s.today_schedule === false) allowedModules.delete('today_schedule')
    if (s.calendar === false) allowedModules.delete('calendar')
    if (s.attendance === false) allowedModules.delete('attendance')
    if (s.my_shoots === false) allowedModules.delete('my_shoots')
    if (s.my_editing === false) allowedModules.delete('my_editing')
    if (s.equipment === false) allowedModules.delete('equipment')
    if (s.reports === false) allowedModules.delete('reports')
    if (s.notifications === false) allowedModules.delete('notifications')
    if (s.ai_assistant === false) allowedModules.delete('ai_assistant')
    if (s.profile === false) allowedModules.delete('profile')
  }

  // Always ensure Dashboard and Profile exist as baseline
  allowedModules.add('dashboard')
  allowedModules.add('profile')

  return {
    allowedModules,
    isShootRole,
    isEditRole,
    isAlbumRole,
    isDroneRole,
    isManagementRole,
  }
}

export function canCrewUserAccessModule(userIdOrUser: string | UserAccount | null | undefined, moduleKey: string): boolean {
  const permSet = getPermissionsForCrewUser(userIdOrUser)
  return permSet.allowedModules.has(moduleKey)
}

export function canCrewUserAccessPath(userIdOrUser: string | UserAccount | null | undefined, pathname: string): boolean {
  if (pathname.includes('/crew/dashboard')) return canCrewUserAccessModule(userIdOrUser, 'dashboard')
  if (pathname.includes('/crew/assignments')) return canCrewUserAccessModule(userIdOrUser, 'my_assignments')
  if (pathname.includes('/crew/schedule')) return canCrewUserAccessModule(userIdOrUser, 'today_schedule')
  if (pathname.includes('/crew/calendar')) return canCrewUserAccessModule(userIdOrUser, 'calendar')
  if (pathname.includes('/crew/shoots')) return canCrewUserAccessModule(userIdOrUser, 'my_shoots')
  if (pathname.includes('/crew/editing')) return canCrewUserAccessModule(userIdOrUser, 'my_editing')
  if (pathname.includes('/crew/attendance')) return canCrewUserAccessModule(userIdOrUser, 'attendance')
  if (pathname.includes('/crew/equipment')) return canCrewUserAccessModule(userIdOrUser, 'equipment')
  if (pathname.includes('/crew/reports')) return canCrewUserAccessModule(userIdOrUser, 'reports')
  if (pathname.includes('/crew/help-center')) return canCrewUserAccessModule(userIdOrUser, 'help_center')
  if (pathname.includes('/crew/notifications')) return canCrewUserAccessModule(userIdOrUser, 'notifications')
  if (pathname.includes('/crew/ai')) return canCrewUserAccessModule(userIdOrUser, 'ai_assistant')
  if (pathname.includes('/crew/profile')) return canCrewUserAccessModule(userIdOrUser, 'profile')
  return true
}
