import type { RolePermissionConfig } from '@/types/teamAccess'
import { loadAllRoleConfigs } from './permissionService'
import { pushEntityToCloud } from './cloudSyncService'

export interface EmployeeWorkRoleRecord {
  id: string
  employee_id: string
  role_id: string
  assigned_by: string
  assigned_at: string
  is_active: boolean
}

const STORAGE_KEY = 'trufocus_crm_employee_work_roles_v1'

function broadcastSync() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trufocus_employee_work_roles_updated'))
    }
  } catch (e) {
    console.error('Error broadcasting work roles sync:', e)
  }
}

// Seed default initial work roles mapping if empty
function seedInitialWorkRoles(): EmployeeWorkRoleRecord[] {
  const allRoles = loadAllRoleConfigs()
  const findId = (name: string) => allRoles.find((r) => r.role_name.toLowerCase() === name.toLowerCase() || r.role_id === name)?.role_id || name

  return [
    // Admin Owner
    { id: 'ewr_1', employee_id: 'acc_admin_owner', role_id: findId('Manager'), assigned_by: 'System', assigned_at: new Date().toISOString(), is_active: true },
    { id: 'ewr_2', employee_id: 'acc_admin_owner', role_id: findId('Creative Director'), assigned_by: 'System', assigned_at: new Date().toISOString(), is_active: true },

    // Lead Photographer
    { id: 'ewr_3', employee_id: 'acc_photographer_01', role_id: findId('Traditional Photographer'), assigned_by: 'System', assigned_at: new Date().toISOString(), is_active: true },
    { id: 'ewr_4', employee_id: 'acc_photographer_01', role_id: findId('Candid Photographer'), assigned_by: 'System', assigned_at: new Date().toISOString(), is_active: true },
    { id: 'ewr_5', employee_id: 'acc_photographer_01', role_id: findId('Photo Editor'), assigned_by: 'System', assigned_at: new Date().toISOString(), is_active: true },

    // Sales Manager
    { id: 'ewr_6', employee_id: 'acc_sales_manager', role_id: findId('Sales Executive'), assigned_by: 'System', assigned_at: new Date().toISOString(), is_active: true },
    { id: 'ewr_7', employee_id: 'acc_sales_manager', role_id: findId('Client Coordinator'), assigned_by: 'System', assigned_at: new Date().toISOString(), is_active: true },

    // Video Editor
    { id: 'ewr_8', employee_id: 'acc_video_editor', role_id: findId('Video Editor'), assigned_by: 'System', assigned_at: new Date().toISOString(), is_active: true },
    { id: 'ewr_9', employee_id: 'acc_video_editor', role_id: findId('Cinematic Video Editor'), assigned_by: 'System', assigned_at: new Date().toISOString(), is_active: true },
  ]
}

export function loadAllEmployeeWorkRoles(): EmployeeWorkRoleRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error loading employee work roles:', e)
  }

  const seeded = seedInitialWorkRoles()
  saveAllEmployeeWorkRoles(seeded)
  return seeded
}

export function saveAllEmployeeWorkRoles(records: EmployeeWorkRoleRecord[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    pushEntityToCloud('employee_work_roles', 'main', records)
    broadcastSync()
  } catch (e) {
    console.error('Error saving employee work roles:', e)
  }
}

export function getWorkRoleIdsForEmployee(employeeId: string): string[] {
  const records = loadAllEmployeeWorkRoles()
  return records
    .filter((r) => r.employee_id === employeeId && r.is_active !== false)
    .map((r) => r.role_id)
}

export function getWorkRolesForEmployee(employeeId: string): RolePermissionConfig[] {
  const roleIds = getWorkRoleIdsForEmployee(employeeId)
  const allRoles = loadAllRoleConfigs()
  return allRoles.filter((r) => roleIds.includes(r.role_id) || roleIds.includes(r.role_name.toLowerCase()))
}

export function assignWorkRoleToEmployee(
  employeeId: string,
  roleId: string,
  assignedBy = 'Admin'
): void {
  const records = loadAllEmployeeWorkRoles()
  const exists = records.some((r) => r.employee_id === employeeId && r.role_id === roleId && r.is_active !== false)
  if (exists) return

  const newRecord: EmployeeWorkRoleRecord = {
    id: `ewr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    employee_id: employeeId,
    role_id: roleId,
    assigned_by: assignedBy,
    assigned_at: new Date().toISOString(),
    is_active: true,
  }

  records.push(newRecord)
  saveAllEmployeeWorkRoles(records)
}

export function removeWorkRoleFromEmployee(employeeId: string, roleId: string): void {
  const records = loadAllEmployeeWorkRoles()
  const filtered = records.filter((r) => !(r.employee_id === employeeId && r.role_id === roleId))
  saveAllEmployeeWorkRoles(filtered)
}

export function syncEmployeeWorkRoles(
  employeeId: string,
  targetRoleIds: string[],
  assignedBy = 'Admin'
): { addedCount: number; removedCount: number } {
  const records = loadAllEmployeeWorkRoles()
  const existingRecords = records.filter((r) => r.employee_id === employeeId && r.is_active !== false)
  const existingRoleIds = new Set(existingRecords.map((r) => r.role_id))
  const targetSet = new Set(targetRoleIds)

  // Roles to add
  const toAdd = targetRoleIds.filter((id) => !existingRoleIds.has(id))

  // Records to keep from other employees
  const otherEmployeesRecords = records.filter((r) => r.employee_id !== employeeId)

  // Records to keep for this employee (only those still in targetSet)
  const keptEmployeeRecords = existingRecords.filter((r) => targetSet.has(r.role_id))

  // New records to insert
  const newRecords: EmployeeWorkRoleRecord[] = toAdd.map((roleId) => ({
    id: `ewr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    employee_id: employeeId,
    role_id: roleId,
    assigned_by: assignedBy,
    assigned_at: new Date().toISOString(),
    is_active: true,
  }))

  const finalRecords = [...otherEmployeesRecords, ...keptEmployeeRecords, ...newRecords]
  saveAllEmployeeWorkRoles(finalRecords)

  const removedCount = existingRecords.length - keptEmployeeRecords.length
  return { addedCount: toAdd.length, removedCount }
}

export function setEmployeeWorkRoles(employeeId: string, roleIds: string[], assignedBy = 'Admin'): void {
  syncEmployeeWorkRoles(employeeId, roleIds, assignedBy)
}
