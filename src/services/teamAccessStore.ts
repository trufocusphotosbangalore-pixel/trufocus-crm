import type {
  CrmModuleId,
  RolePermissionConfig,
  UserRoleAssignment,
  PermissionAuditLog,
  ModuleCrudPermission,
  ProductionStage,
} from '@/types/teamAccess'

function broadcastSync() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
    }
  } catch (e) {
    console.error('Error broadcasting sync:', e)
  }
}

const ROLES_STORAGE_KEY = 'trufocus_crm_roles_v1'
const ACTIVE_ROLE_KEY = 'trufocus_crm_active_test_role_v1'
const MEMBER_ROLES_KEY = 'trufocus_crm_member_roles_v1'
const AUDIT_LOGS_KEY = 'trufocus_crm_permission_audit_logs_v1'

const MODULE_LIST: CrmModuleId[] = [
  'dashboard', 'enquiries', 'work_orders', 'post_production',
  'data', 'team', 'finances', 'client_requests', 'trufocus_ai',
  'reports', 'settings', 'portal_management', 'gallery',
  'documents', 'analytics', 'notifications',
]

function createDefaultCrud(
  view = true,
  create = true,
  edit = true,
  del = true,
  approve = true,
  export_share = true
): ModuleCrudPermission {
  return { view, create, edit, delete: del, approve, export_share }
}

function createDefaultModules(all = true): Record<CrmModuleId, ModuleCrudPermission> {
  const result = {} as Record<CrmModuleId, ModuleCrudPermission>
  MODULE_LIST.forEach((m) => {
    result[m] = createDefaultCrud(all, all, all, all, all, all)
  })
  return result
}

function createDefaultModulesForRole(production_stage: ProductionStage): Record<CrmModuleId, ModuleCrudPermission> {
  const isManagement = production_stage === 'management'
  const isPreProd = production_stage === 'pre_production'
  const result = {} as Record<CrmModuleId, ModuleCrudPermission>

  MODULE_LIST.forEach((m) => {
    if (isManagement) {
      result[m] = createDefaultCrud(true, true, true, true, true, true)
    } else if (isPreProd && (m === 'enquiries' || m === 'dashboard' || m === 'documents' || m === 'client_requests' || m === 'gallery' || m === 'portal_management')) {
      result[m] = createDefaultCrud(true, true, true, false, true, true)
    } else {
      result[m] = createDefaultCrud(true, false, false, false, false, false)
    }
  })
  return result
}

function makeDefaultRole(
  role_id: string,
  role_name: string,
  production_stage: ProductionStage,
  description = ''
): RolePermissionConfig {
  const isManagement = production_stage === 'management'
  const isPreProd = production_stage === 'pre_production'
  const canManageWO = isManagement || isPreProd

  return {
    role_id,
    role_name,
    production_stage,
    is_default: true,
    is_custom: false,
    description: description || `Default canonical role for ${role_name} in ${production_stage.replace('_', ' ')}.`,
    modules: createDefaultModulesForRole(production_stage),
    work_order_actions: {
      can_create_work_order: canManageWO, can_edit_work_order: canManageWO, can_delete_work_order: isManagement,
      can_assign_team: canManageWO, can_record_payments: canManageWO, can_publish_gallery: true,
      can_edit_contract: canManageWO, can_generate_invoice: canManageWO, can_generate_receipt: canManageWO,
    },
    post_production_actions: {
      view_deliverables: true, assign_editors: canManageWO, change_status: true,
      upload_gallery: true, approve_deliverables: canManageWO,
    },
    finance_actions: {
      view_finance: canManageWO, record_receipt: canManageWO, record_payment: canManageWO,
      generate_invoice: canManageWO, generate_receipt: canManageWO, export_reports: canManageWO,
    },
    team_actions: {
      view_team: true, add_team_member: isManagement, edit_team_member: isManagement,
      delete_team_member: isManagement, manage_attendance: true, manage_payroll: isManagement,
    },
    client_request_actions: { view_requests: true, reply: true, assign_requests: canManageWO, close_requests: canManageWO },
    settings_actions: {
      manage_services: canManageWO, manage_deliverables: canManageWO, manage_payment_plans: canManageWO,
      manage_contracts: canManageWO, manage_team_access: isManagement, manage_system_settings: isManagement,
    },
  }
}

// 29 Canonical Default Role Templates
export const CANONICAL_29_DEFAULT_ROLES: RolePermissionConfig[] = [
  // Pre-Production (5)
  makeDefaultRole('client_coordinator', 'Client Coordinator', 'pre_production', 'Coordinates client onboarding, requirement gathering, and shoot scheduling.'),
  makeDefaultRole('creative_director', 'Creative Director', 'pre_production', 'Oversees creative concept design, mood boards, and aesthetic direction.'),
  makeDefaultRole('pre_production_planner', 'Pre-Production Planner', 'pre_production', 'Manages event timelines, shot list creation, and equipment checklists.'),
  makeDefaultRole('sales', 'Sales', 'pre_production', 'Handles inbound enquiries, packages, and client proposals.'),
  makeDefaultRole('sales_executive', 'Sales Executive', 'pre_production', 'Lead management, client consultation, quotation creation, and enquiries.'),

  // On-Production (14)
  makeDefaultRole('assistant_photographer', 'Assistant Photographer', 'on_production', 'Assists lead photographers with lighting, lenses, and gear setup.'),
  makeDefaultRole('bts_shooter', 'BTS Shooter', 'on_production', 'Captures behind-the-scenes moments, reels, and candid team coverage.'),
  makeDefaultRole('candid_photographer', 'Candid Photographer', 'on_production', 'Specialized candid moment photography during events.'),
  makeDefaultRole('cinematographer', 'Cinematographer', 'on_production', 'Leads cinematic video capture, composition, and direction.'),
  makeDefaultRole('drone_operator', 'Drone Operator', 'on_production', 'Licensed aerial video and photography coverage.'),
  makeDefaultRole('drone_shooter', 'Drone Shooter', 'on_production', 'Aerial drone camera operation during outdoor and venue shoots.'),
  makeDefaultRole('lighting_technician', 'Lighting Technician', 'on_production', 'Manages studio and venue flash, continuous lights, and modifiers.'),
  makeDefaultRole('mobile_cinematographer', 'Mobile Cinematographer', 'on_production', 'Captures instant smartphone videos and social media reels live.'),
  makeDefaultRole('photographer', 'Photographer', 'on_production', 'General event, portrait, and studio photography coverage.'),
  makeDefaultRole('traditional_photographer', 'Traditional Photographer', 'on_production', 'Traditional stage and group portraiture photography.'),
  makeDefaultRole('traditional_videographer', 'Traditional Videographer', 'on_production', 'Full-length traditional event video recording.'),
  makeDefaultRole('candid_videographer', 'Candid Videographer', 'on_production', 'Candid cinematic video clips and highlight capturing.'),
  makeDefaultRole('led_display', 'LED Display', 'on_production', 'Manages live venue LED screens and live camera feeds.'),
  makeDefaultRole('spot_mixing', 'Spot Mixing', 'on_production', 'Live video switching and multi-cam spot mixing.'),

  // Post-Production (8)
  makeDefaultRole('album_designer', 'Album Designer', 'post_production', 'Photobook page layout creation, print proofing, and sheet approvals.'),
  makeDefaultRole('cinematic_video_editor', 'Cinematic Video Editor', 'post_production', 'Crafts cinematic feature films, teasers, and storytelling edits.'),
  makeDefaultRole('data_manager', 'Data Manager', 'post_production', 'RAW footage ingestion, backup verification, and hard drive indexing.'),
  makeDefaultRole('editor', 'Editor', 'post_production', 'General photo and video post-production editing.'),
  makeDefaultRole('image_editor', 'Image Editor', 'post_production', 'High-end retouching, skin smoothing, and color correction.'),
  makeDefaultRole('photo_editor', 'Photo Editor', 'post_production', 'Post-production desk access for color grading, gallery uploads, and deliverables.'),
  makeDefaultRole('same_day_video_editor', 'Same Day Video Editor', 'post_production', 'Edits same-day edit (SDE) teasers for venue screening.'),
  makeDefaultRole('video_editor', 'Video Editor', 'post_production', 'Cinematic video editing, sound mixing, color grading, and teaser cuts.'),

  // Management / Other (2)
  makeDefaultRole('manager', 'Manager', 'management', 'Manages projects, team schedules, client requests, and operations.'),
  makeDefaultRole('operations_manager', 'Operations Manager', 'management', 'Oversees daily studio workflow, resource allocation, and logistics.'),
]

const DEFAULT_TEAM_MEMBERS: UserRoleAssignment[] = []

import { pushEntityToCloud } from '@/services/cloudSyncService'

export function loadAllRoleConfigs(): RolePermissionConfig[] {
  let roles: RolePermissionConfig[] = []
  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY)
    if (raw) roles = JSON.parse(raw)
  } catch (e) {
    console.error('Error loading roles:', e)
  }

  if (!roles || roles.length === 0) {
    roles = [...CANONICAL_29_DEFAULT_ROLES]
    saveAllRoleConfigs(roles, true)
  } else {
    // Ensure all 29 canonical default roles exist
    let updated = false
    CANONICAL_29_DEFAULT_ROLES.forEach((defRole) => {
      const idx = roles.findIndex((r) => r.role_id === defRole.role_id || r.role_name.toLowerCase() === defRole.role_name.toLowerCase())
      if (idx === -1) {
        roles.push(defRole)
        updated = true
      } else {
        // Enforce is_default flag & production_stage
        if (!roles[idx].is_custom) {
          roles[idx].is_default = true
          roles[idx].production_stage = defRole.production_stage
          if (!roles[idx].modules?.['enquiries']?.create) {
            roles[idx].modules = defRole.modules
            roles[idx].work_order_actions = defRole.work_order_actions
            updated = true
          }
        }
      }
    })
    if (updated) {
      saveAllRoleConfigs(roles, true)
    }
  }

  return roles
}

export function saveAllRoleConfigs(configs: RolePermissionConfig[], skipBroadcast = false): void {
  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(configs))
    pushEntityToCloud('role_permissions', 'main', configs)
    if (!skipBroadcast) broadcastSync()
  } catch (e) {
    console.error('Error saving roles:', e)
  }
}

export function getActiveRoleId(): string {
  try {
    return localStorage.getItem(ACTIVE_ROLE_KEY) || 'manager'
  } catch {
    return 'manager'
  }
}

export function setActiveRoleId(roleId: string): void {
  try {
    localStorage.setItem(ACTIVE_ROLE_KEY, roleId)
    broadcastSync()
  } catch (e) {
    console.error('Error setting active role:', e)
  }
}

export function loadUserAssignments(): UserRoleAssignment[] {
  try {
    const raw = localStorage.getItem(MEMBER_ROLES_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error loading member assignments:', e)
  }
  return DEFAULT_TEAM_MEMBERS
}

export function saveUserAssignments(members: UserRoleAssignment[]): void {
  try {
    localStorage.setItem(MEMBER_ROLES_KEY, JSON.stringify(members))
    pushEntityToCloud('user_role_assignments', 'main', members)
    broadcastSync()
  } catch (e) {
    console.error('Error saving member assignments:', e)
  }
}

export function loadAuditLogs(): PermissionAuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error loading audit logs:', e)
  }
  return []
}

export function logPermissionAction(
  action: string,
  actor: string,
  targetRole: string,
  details: string
): void {
  const logs = loadAuditLogs()
  const newEntry: PermissionAuditLog = {
    id: 'log_' + Date.now(),
    action,
    actor,
    target_role: targetRole,
    details,
    created_at: new Date().toISOString(),
  }
  try {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify([newEntry, ...logs]))
  } catch (e) {
    console.error('Error logging permission action:', e)
  }
}

export function createCustomRole(
  roleName: string,
  description: string,
  productionStage: ProductionStage = 'management',
  customModules?: Record<CrmModuleId, ModuleCrudPermission>,
  createdBy = 'Admin'
): RolePermissionConfig {
  const roles = loadAllRoleConfigs()
  const roleId = 'custom_' + roleName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4)

  const newRole: RolePermissionConfig = {
    role_id: roleId,
    role_name: roleName,
    production_stage: productionStage,
    is_custom: true,
    is_default: false,
    description: description || `Custom role created for ${productionStage.replace('_', ' ')}`,
    modules: customModules || createDefaultModules(false),
    work_order_actions: {
      can_create_work_order: false, can_edit_work_order: false, can_delete_work_order: false,
      can_assign_team: false, can_record_payments: false, can_publish_gallery: false,
      can_edit_contract: false, can_generate_invoice: false, can_generate_receipt: false,
    },
    post_production_actions: {
      view_deliverables: false, assign_editors: false, change_status: false,
      upload_gallery: false, approve_deliverables: false,
    },
    finance_actions: {
      view_finance: false, record_receipt: false, record_payment: false,
      generate_invoice: false, generate_receipt: false, export_reports: false,
    },
    team_actions: {
      view_team: false, add_team_member: false, edit_team_member: false,
      delete_team_member: false, manage_attendance: false, manage_payroll: false,
    },
    client_request_actions: { view_requests: false, reply: false, assign_requests: false, close_requests: false },
    settings_actions: {
      manage_services: false, manage_deliverables: false, manage_payment_plans: false,
      manage_contracts: false, manage_team_access: false, manage_system_settings: false,
    },
  }

  roles.push(newRole)
  saveAllRoleConfigs(roles)
  logPermissionAction('Role Created', createdBy, roleName, `Created custom role '${roleName}' in ${productionStage}`)
  return newRole
}

export function getRolePermissionConfig(roleId: string): RolePermissionConfig {
  const roles = loadAllRoleConfigs()
  let found = roles.find((r) => r.role_id === roleId || r.role_name.toLowerCase() === roleId.toLowerCase())

  if (!found) {
    found = CANONICAL_29_DEFAULT_ROLES.find((r) => r.role_id === roleId) || CANONICAL_29_DEFAULT_ROLES[0]
  }

  return found
}

export function getModulePermissions(moduleId: CrmModuleId, roleId?: string): ModuleCrudPermission {
  const activeRoleId = roleId || getActiveRoleId()
  const config = getRolePermissionConfig(activeRoleId)

  if (activeRoleId === 'owner' || activeRoleId === 'administrator') {
    return createDefaultCrud(true, true, true, true, true, true)
  }

  const mod = config.modules[moduleId]
  if (!mod) {
    return createDefaultCrud(false, false, false, false, false, false)
  }

  return mod
}

export function canUserAccessModule(moduleId: CrmModuleId, roleId?: string): boolean {
  const activeRoleId = roleId || getActiveRoleId()
  if (activeRoleId === 'owner' || activeRoleId === 'administrator') return true
  const perm = getModulePermissions(moduleId, activeRoleId)
  return perm.view
}

export function duplicateRole(
  roleId: string,
  newRoleName: string,
  actor = 'Admin'
): RolePermissionConfig {
  const source = getRolePermissionConfig(roleId)
  const roles = loadAllRoleConfigs()
  const newRoleId = 'custom_' + newRoleName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4)

  const newRole: RolePermissionConfig = {
    ...JSON.parse(JSON.stringify(source)),
    role_id: newRoleId,
    role_name: newRoleName,
    is_custom: true,
    is_default: false,
    description: `Duplicated from ${source.role_name}`,
  }

  roles.push(newRole)
  saveAllRoleConfigs(roles)
  logPermissionAction('Role Duplicated', actor, newRoleName, `Duplicated role '${source.role_name}' as '${newRoleName}'`)
  return newRole
}

export function deleteRole(roleId: string, actor = 'Admin'): boolean {
  const roles = loadAllRoleConfigs()
  const target = roles.find((r) => r.role_id === roleId || r.role_name.toLowerCase() === roleId.toLowerCase())
  if (!target || target.is_default || !target.is_custom) return false

  const filtered = roles.filter((r) => r.role_id !== target.role_id)
  saveAllRoleConfigs(filtered)
  logPermissionAction('Role Deleted', actor, target.role_name, `Deleted custom role '${target.role_name}'`)
  return true
}

export function renameRole(roleId: string, newName: string, actor = 'Admin'): boolean {
  const roles = loadAllRoleConfigs()
  const target = roles.find((r) => r.role_id === roleId)
  if (!target || target.is_default) return false

  const oldName = target.role_name
  target.role_name = newName
  saveAllRoleConfigs(roles)
  logPermissionAction('Role Renamed', actor, newName, `Renamed role '${oldName}' to '${newName}'`)
  return true
}

export function resetRoleToDefaults(roleId: string, actor = 'Admin'): RolePermissionConfig {
  const defaultTemplate = CANONICAL_29_DEFAULT_ROLES.find((r) => r.role_id === roleId || r.role_name.toLowerCase() === roleId.toLowerCase())
  if (!defaultTemplate) return getRolePermissionConfig(roleId)

  const roles = loadAllRoleConfigs()
  const idx = roles.findIndex((r) => r.role_id === roleId || r.role_name.toLowerCase() === roleId.toLowerCase())
  if (idx !== -1) {
    roles[idx] = JSON.parse(JSON.stringify(defaultTemplate))
    saveAllRoleConfigs(roles)
  }

  logPermissionAction('Role Reset', actor, defaultTemplate.role_name, `Reset permissions for '${defaultTemplate.role_name}' to defaults`)
  return defaultTemplate
}

export function canUserPerformDelete(_module?: CrmModuleId, roleId?: string): boolean {
  const activeRole = roleId || getActiveRoleId() || 'manager'
  return activeRole === 'owner' || activeRole === 'administrator'
}

export function canUserDeleteWorkOrder(): boolean {
  return canUserPerformDelete('work_orders')
}

export function canUserDeleteEnquiry(): boolean {
  const activeRole = getActiveRoleId()
  const perm = getModulePermissions('enquiries', activeRole)
  return perm.delete
}
