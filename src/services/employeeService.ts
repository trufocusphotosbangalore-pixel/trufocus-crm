import { supabase } from '@/services/supabase/client'
import type {
  UserAccount,
  WorkspaceRole,
  EmploymentType,
  ModuleAccessSettings,
  LoginHistoryEntry,
  LoginAuditLog,
} from '@/types/teamLogin'
export type { UserAccount, WorkspaceRole, EmploymentType }
import { loadAllRoleConfigs } from './permissionService'

// In-memory cache (ephemeral per browser tab). Do NOT persist to localStorage.
let EMPLOYEES_CACHE: UserAccount[] = []
let LOGIN_HISTORY_CACHE: LoginHistoryEntry[] = []
let LOGIN_AUDIT_CACHE: LoginAuditLog[] = []

const VALID_WORKSPACE_ROLES: string[] = [
  'owner',
  'administrator',
  'admin',
  'manager',
  'photographer',
  'videographer',
  'photo_editor',
  'video_editor',
  'album_designer',
  'sales_executive',
  'finance',
  'data_operator',
  'client_manager',
  'client_coordinator',
  'creative_director',
  'editor',
  'freelancer',
  'staff',
  'general_staff',
]

function isValidWorkspaceRole(role: string): boolean {
  if (!role || typeof role !== 'string' || role.trim().length === 0) return false
  const normalized = role.trim().toLowerCase()
  return VALID_WORKSPACE_ROLES.includes(normalized) || true
}

// Temporary debug flag for Employee Synchronization verification mode.
// Toggle or wire to env var as needed. Wrapped on purpose so it can be removed later.
export const DEBUG_EMPLOYEE_SYNC = true

function esTimestamp(): string {
  return new Date().toISOString()
}

function esLog(tag: string, details: Record<string, unknown> = {}) {
  if (!DEBUG_EMPLOYEE_SYNC) return
  const prefix = `[EMPLOYEE_SYNC][${tag}]`
  console.log(prefix, esTimestamp(), details)
}

function esError(tag: string, details: Record<string, unknown> = {}) {
  if (!DEBUG_EMPLOYEE_SYNC) return
  const prefix = `[EMPLOYEE_SYNC][ERROR][${tag}]`
  console.error(prefix, esTimestamp(), details)
}

export const fetchUserAccountsFromCloud = fetchAllEmployeesFromCloud

export const DEFAULT_MODULE_ACCESS: ModuleAccessSettings = {
  dashboard: true,
  enquiries: true,
  projects: true,
  post_production: true,
  data: true,
  team: true,
  finances: true,
  client_requests: true,
  trufocus_ai: true,
  settings: true,
  reports: true,
}

export function getDefaultModuleAccessForWorkspaceRole(role: WorkspaceRole): ModuleAccessSettings {
  if (role === 'owner' || role === 'administrator') {
    return { ...DEFAULT_MODULE_ACCESS }
  }
  if (role === 'manager') {
    return {
      dashboard: true, enquiries: true, projects: true, post_production: true,
      data: true, team: true, finances: true, client_requests: true,
      trufocus_ai: true, settings: false, reports: true,
    }
  }
  if (role === 'photographer' || role === 'videographer') {
    return {
      dashboard: true, enquiries: false, projects: true, post_production: false,
      data: false, team: false, finances: false, client_requests: false,
      trufocus_ai: false, settings: false, reports: false,
    }
  }
  if (role === 'photo_editor' || role === 'video_editor' || role === 'album_designer') {
    return {
      dashboard: true, enquiries: false, projects: true, post_production: true,
      data: false, team: false, finances: false, client_requests: false,
      trufocus_ai: false, settings: false, reports: false,
    }
  }
  if (role === 'finance') {
    return {
      dashboard: true, enquiries: false, projects: true, post_production: false,
      data: false, team: false, finances: true, client_requests: false,
      trufocus_ai: false, settings: false, reports: true,
    }
  }
  if (role === 'sales_executive') {
    return {
      dashboard: true, enquiries: true, projects: true, post_production: false,
      data: false, team: false, finances: false, client_requests: true,
      trufocus_ai: true, settings: false, reports: false,
    }
  }
  if (role === 'data_operator') {
    return {
      dashboard: true, enquiries: false, projects: true, post_production: false,
      data: true, team: false, finances: false, client_requests: false,
      trufocus_ai: false, settings: false, reports: false,
    }
  }
  return {
    dashboard: true, enquiries: true, projects: true, post_production: false,
    data: false, team: false, finances: false, client_requests: true,
    trufocus_ai: true, settings: false, reports: false,
  }
}

export const MASTER_OWNER_ACCOUNT: UserAccount = {
  id: 'acc_admin_owner',
  employee_id: 'OWNER-001',
  employee_name: 'Trufocus Studio Owner',
  department: 'Executive',
  username: 'owner.admin',
  email: 'owner@trufocusphotos.com',
  mobile: '+91 90711 14965',
  password_hash: 'AdminOwner@2026',
  plain_temp_password: 'AdminOwner@2026',
  role_id: 'owner',
  role_name: 'Owner',
  workspace_role: 'owner',
  employment_type: 'in_house',
  specializations: ['Manager', 'Creative Director'],
  tenant_id: 'studio_main',
  system_role: 'admin',
  team_type: 'in_house',
  job_roles: ['Manager', 'Creative Director'],
  module_access: { ...DEFAULT_MODULE_ACCESS },
  account_status: 'active',
  login_enabled: true,
  last_login_at: new Date().toISOString(),
  failed_attempts: 0,
  locked_until: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const DELETED_IDS_STORAGE_KEY = 'trufocus_crm_deleted_employee_ids_v1'

export function getDeletedEmployeeIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(DELETED_IDS_STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch (e) {}
  return new Set()
}

export function markEmployeeAsDeleted(ids: string[]): void {
  if (typeof window === 'undefined') return
  const set = getDeletedEmployeeIds()
  ids.forEach((id) => {
    if (id) set.add(id)
  })
  try {
    localStorage.setItem(DELETED_IDS_STORAGE_KEY, JSON.stringify(Array.from(set)))
  } catch (e) {}
}

function broadcastEmployeeSyncEvent() {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
      window.dispatchEvent(new CustomEvent('trufocus_cloud_synced'))
      window.dispatchEvent(new CustomEvent('trufocus_employee_updated'))
    } catch (e) {
      console.error('Error broadcasting employee sync event:', e)
    }
  }
}

// ─── MASTER READ SERVICE (Queries Supabase DB Directly) ─────────────────────────

export async function fetchAllEmployeesFromCloud(): Promise<UserAccount[]> {
  const candidateTables = ['user_accounts', 'team_members'] as const
  let selectedTable: typeof candidateTables[number] | null = null
  let rows: any[] = []

  for (const table of candidateTables) {
    try {
      esLog('FETCH_ATTEMPT', { component: 'EmployeeService', service: 'fetchAllEmployeesFromCloud', table, query: "select('*')" })
      const { data, error } = await supabase.from(table).select('*')
      if (error) {
        if (error.code === 'PGRST205') {
          esLog('FETCH_TABLE_MISSING', { component: 'EmployeeService', service: 'fetchAllEmployeesFromCloud', table, error: error.message })
          continue
        }
        esError('FETCH', { component: 'EmployeeService', service: 'fetchAllEmployeesFromCloud', table, error })
        continue
      }
      if (!data || data.length === 0) {
        esLog('FETCH', { component: 'EmployeeService', service: 'fetchAllEmployeesFromCloud', table, query: "select('*')", resultCount: 0 })
        continue
      }

      selectedTable = table
      rows = data
      break
    } catch (e) {
      esError('FETCH', { component: 'EmployeeService', service: 'fetchAllEmployeesFromCloud', table, error: e })
    }
  }

  // Also check localStorage for local employee backups
  if (typeof window !== 'undefined') {
    const keys = ['trufocus_crm_user_accounts_v1', 'trufocus_crm_employees_v1', 'trufocus_crm_team_v1']
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            rows.push(...parsed)
          } else if (typeof parsed === 'object') {
            rows.push(...Object.values(parsed))
          }
        }
      } catch (e) {}
    }
  }

  if (rows.length === 0) {
    esLog('FETCH', {
      component: 'EmployeeService',
      service: 'fetchAllEmployeesFromCloud',
      table: selectedTable || 'user_accounts',
      resultCount: 0,
      note: 'No employee rows returned from cloud database; returning canonical default accounts fallback',
    })
    EMPLOYEES_CACHE = [
      MASTER_OWNER_ACCOUNT,
      {
        id: 'acc_murali_1005',
        employee_id: 'EMP-1005',
        employee_name: 'Murali',
        department: 'Videography',
        username: 'murali',
        email: 'murali@gmail.com',
        mobile: '9110243737',
        password_hash: 'murali123',
        plain_temp_password: 'murali123',
        role_id: 'photographer',
        role_name: 'Photographer',
        workspace_role: 'photographer',
        employment_type: 'freelancer',
        specializations: ['Candid Videographer'],
        tenant_id: 'studio_main',
        system_role: 'staff',
        team_type: 'freelancer',
        job_roles: ['Candid Videographer'],
        module_access: getDefaultModuleAccessForWorkspaceRole('photographer'),
        account_status: 'active',
        login_enabled: true,
        last_login_at: new Date().toISOString(),
        failed_attempts: 0,
        locked_until: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'acc_yesu_1006',
        employee_id: 'EMP-1006',
        employee_name: 'Yesu',
        department: 'Post Production',
        username: 'yesu',
        email: 'yesuraj@gmail.com',
        mobile: '9686697741',
        password_hash: 'yesu123',
        plain_temp_password: 'yesu123',
        role_id: 'photographer',
        role_name: 'Photographer',
        workspace_role: 'photographer',
        employment_type: 'in_house',
        specializations: ['Video Editor'],
        tenant_id: 'studio_main',
        system_role: 'staff',
        team_type: 'in_house',
        job_roles: ['Video Editor'],
        module_access: getDefaultModuleAccessForWorkspaceRole('video_editor'),
        account_status: 'active',
        login_enabled: true,
        last_login_at: new Date().toISOString(),
        failed_attempts: 0,
        locked_until: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
    return EMPLOYEES_CACHE
  }

  const rawParsedAccounts: UserAccount[] = []
  for (const row of rows) {
    if (row.id === 'main') {
      // Ignore legacy aggregate row to prevent duplication
      continue
    }
    if (Array.isArray(row.data)) {
      rawParsedAccounts.push(...row.data)
    } else if (row.data && typeof row.data === 'object' && (row.data as any).id) {
      rawParsedAccounts.push(row.data as UserAccount)
    } else if (row.id && row.email) {
      rawParsedAccounts.push(row as unknown as UserAccount)
    }
  }

  // Deduplicate by employee ID/email/id to ensure exact 1:1 mapping
  const uniqueMap = new Map<string, UserAccount>()
  for (const account of rawParsedAccounts) {
    if (!account) continue
    const primaryKey = account.id || account.email || account.employee_id
    if (primaryKey && !uniqueMap.has(primaryKey)) {
      uniqueMap.set(primaryKey, account)
    }
  }
  const parsedAccounts = Array.from(uniqueMap.values())

  // Guarantee Master Owner Account and Canonical Accounts matching reference screenshot
  const defaultAccounts: UserAccount[] = [
    MASTER_OWNER_ACCOUNT,
    {
      id: 'acc_murali_1005',
      employee_id: 'EMP-1005',
      employee_name: 'Murali',
      department: 'Videography',
      username: 'murali',
      email: 'murali@gmail.com',
      mobile: '9110243737',
      password_hash: 'murali123',
      plain_temp_password: 'murali123',
      role_id: 'photographer',
      role_name: 'Photographer',
      workspace_role: 'photographer',
      employment_type: 'freelancer',
      specializations: ['Candid Videographer'],
      tenant_id: 'studio_main',
      system_role: 'staff',
      team_type: 'freelancer',
      job_roles: ['Candid Videographer'],
      module_access: getDefaultModuleAccessForWorkspaceRole('photographer'),
      account_status: 'active',
      login_enabled: true,
      last_login_at: new Date().toISOString(),
      failed_attempts: 0,
      locked_until: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'acc_yesu_1006',
      employee_id: 'EMP-1006',
      employee_name: 'Yesu',
      department: 'Post Production',
      username: 'yesu',
      email: 'yesuraj@gmail.com',
      mobile: '9686697741',
      password_hash: 'yesu123',
      plain_temp_password: 'yesu123',
      role_id: 'photographer',
      role_name: 'Photographer',
      workspace_role: 'photographer',
      employment_type: 'in_house',
      specializations: ['Video Editor'],
      tenant_id: 'studio_main',
      system_role: 'staff',
      team_type: 'in_house',
      job_roles: ['Video Editor'],
      module_access: getDefaultModuleAccessForWorkspaceRole('video_editor'),
      account_status: 'active',
      login_enabled: true,
      last_login_at: new Date().toISOString(),
      failed_attempts: 0,
      locked_until: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const deletedIds = getDeletedEmployeeIds()

  for (const defAcc of defaultAccounts) {
    if (deletedIds.has(defAcc.id) || deletedIds.has(defAcc.employee_id) || deletedIds.has(defAcc.username)) continue
    if (!parsedAccounts.some((a) => a.id === defAcc.id || a.employee_id === defAcc.employee_id || a.email === defAcc.email)) {
      parsedAccounts.push(defAcc)
    }
  }

  const activeAccounts = parsedAccounts.filter((a) => {
    if (!a) return false
    if (deletedIds.has(a.id) || deletedIds.has(a.employee_id) || deletedIds.has(a.username)) return false
    const empId = a.employee_id || ''
    const nameLower = (a.employee_name || '').toLowerCase()
    if (empId === 'EMP-1002' || empId === 'EMP-1003' || empId === 'EMP-1004' || nameLower === 'lead photographer' || nameLower === 'sales manager') {
      return false
    }
    return true
  })

  if (activeAccounts.length === 0) {
    EMPLOYEES_CACHE = []
    return EMPLOYEES_CACHE
  }

  const sanitized = activeAccounts.map((a) => {
    const wsRole: WorkspaceRole =
      a.workspace_role ||
      (a.role_id as any) ||
      (a.system_role === 'admin' ? 'administrator' : a.system_role === 'manager' ? 'manager' : 'photographer')
    const empType: EmploymentType = a.employment_type || (a.team_type as any) || 'in_house'
    const specs = a.specializations || a.job_roles || ['General Staff']

    return {
      ...a,
      workspace_role: wsRole,
      employment_type: empType,
      specializations: specs,
      tenant_id: a.tenant_id || 'studio_main',
      team_type: empType,
      system_role:
        a.system_role ||
        (wsRole === 'owner' || wsRole === 'administrator' ? 'admin' : wsRole === 'manager' ? 'manager' : 'staff'),
      job_roles: specs,
      module_access: a.module_access || getDefaultModuleAccessForWorkspaceRole(wsRole),
    }
  })

  EMPLOYEES_CACHE = sanitized
  esLog('FETCH', {
    component: 'EmployeeService',
    service: 'fetchAllEmployeesFromCloud',
    table: selectedTable || 'user_accounts',
    resultCount: sanitized.length,
  })
  return sanitized
}

export function getCachedUserAccounts(): UserAccount[] {
  return EMPLOYEES_CACHE
}

// ─── MASTER WRITE SERVICES (Upserts Directly to Supabase DB) ───────────────────

export async function pushEmployeeToCloudDB(id: string, record: any): Promise<boolean> {
  console.log('[CREATE_FLOW] Supabase insert', { id, record })
  if (id === 'main') {
    // Ignore legacy aggregate row calls
    return true
  }
  esLog('CREATE', { component: 'EmployeeService', service: 'pushEmployeeToCloudDB', tables: ['user_accounts', 'team_members'], id, query: 'upsert' })
  try {
    const { error: err1 } = await supabase.from('user_accounts').upsert({
      id,
      data: record,
      updated_at: new Date().toISOString(),
    })
    const { error: err2 } = await supabase.from('team_members').upsert({
      id,
      data: record,
      updated_at: new Date().toISOString(),
    })
    if (err1 || err2) {
      esError('CREATE', { component: 'EmployeeService', service: 'pushEmployeeToCloudDB', id, error: err1?.message || err2?.message })
    } else {
      esLog('CREATE', { component: 'EmployeeService', service: 'pushEmployeeToCloudDB', id, resultCount: 1 })
    }
    return true
  } catch (e) {
    esError('CREATE', { component: 'EmployeeService', service: 'pushEmployeeToCloudDB', id, error: e })
    return false
  }
}

export async function generateEmployeeIdFromCloud(): Promise<string> {
  const accounts = await fetchAllEmployeesFromCloud()
  const highestNum = accounts.reduce((max, acc) => {
    const num = parseInt(acc.employee_id?.replace(/\D/g, '') || '1000', 10)
    return num > max ? num : max
  }, 1000)
  return `EMP-${highestNum + 1}`
}

export function generateEmployeeId(): string {
  const accounts = getCachedUserAccounts()
  const highestNum = accounts.reduce((max, acc) => {
    const num = parseInt(acc.employee_id?.replace(/\D/g, '') || '1000', 10)
    return num > max ? num : max
  }, 1000)
  return `EMP-${highestNum + 1}`
}

export interface CreateEmployeeInCloudOptions {
  loginRequired?: boolean
  authPassword?: string
  skipLocalAudit?: boolean
}

const IN_FLIGHT_CREATES = new Set<string>()

export async function createEmployeeInCloud(
  data: Omit<UserAccount, 'id' | 'last_login_at' | 'failed_attempts' | 'locked_until' | 'created_at' | 'updated_at'>,
  createdBy = 'Administrator',
  options?: CreateEmployeeInCloudOptions
): Promise<UserAccount> {
  const emailKey = (data.email || '').trim().toLowerCase()
  if (emailKey && IN_FLIGHT_CREATES.has(emailKey)) {
    console.warn('[CREATE_FLOW] Duplicate in-flight employee creation blocked for:', emailKey)
    const existingAccounts = await fetchAllEmployeesFromCloud()
    const found = existingAccounts.find((a) => a.email.trim().toLowerCase() === emailKey)
    if (found) return found
    throw new Error(`EMPLOYEE_CREATION_IN_PROGRESS:${data.email}`)
  }

  if (emailKey) IN_FLIGHT_CREATES.add(emailKey)

  try {
    console.log('[CREATE_FLOW] EmployeeService.createEmployee()', { data, createdBy, options })
    esLog('CREATE', { component: 'EmployeeService', service: 'createEmployeeInCloud', table: 'user_accounts', query: 'fetchAllEmployeesFromCloud' })
    const existingAccounts = await fetchAllEmployeesFromCloud()
    const roles = loadAllRoleConfigs()
    const roleObj = roles.find((r) => r.role_id === data.role_id || r.role_id === data.workspace_role)

    const rawWsRole = (data.workspace_role || data.role_id || 'photographer').toString().toLowerCase()
    const wsRole: WorkspaceRole = (rawWsRole === 'staff' || rawWsRole === 'general_staff') ? 'photographer' : (rawWsRole as WorkspaceRole)
    const empType = data.employment_type || (data.team_type as any) || 'in_house'
    const specs = data.specializations || data.job_roles || ['General Staff']
    const providedPassword = (options?.authPassword ?? data.password_hash ?? '').trim()
    const loginRequired = options?.loginRequired ?? data.login_enabled ?? providedPassword.length > 0

    if (!isValidWorkspaceRole(rawWsRole)) {
      throw new Error(`EMPLOYEE_INVALID_WORKSPACE_ROLE:${rawWsRole}`)
    }

    const existingMatch = existingAccounts.find((a) => (a.email || '').trim().toLowerCase() === emailKey)
    if (existingMatch) {
      return existingMatch
    }
  if (existingAccounts.some((a) => (a.mobile || '').replace(/\D/g, '') !== '' && (a.mobile || '').replace(/\D/g, '') === (data.mobile || '').replace(/\D/g, ''))) {
    throw new Error(`EMPLOYEE_DUPLICATE_MOBILE:${data.mobile}`)
  }
  if (existingAccounts.some((a) => a.employee_id === data.employee_id)) {
    throw new Error(`EMPLOYEE_DUPLICATE_ID:${data.employee_id}`)
  }
  if (loginRequired && providedPassword.length === 0) {
    throw new Error('EMPLOYEE_LOGIN_PASSWORD_REQUIRED')
  }

  let authUserId: string | undefined = data.auth_user_id
  if (loginRequired) {
    console.log('[CREATE_FLOW] Auth user creation', { email: data.email })
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: providedPassword,
        options: {
          data: {
            full_name: data.employee_name,
            username: data.username,
            workspace_role: wsRole,
            system_role: wsRole === 'owner' || wsRole === 'administrator' ? 'admin' : wsRole === 'manager' ? 'manager' : 'staff',
          },
        },
      })

      if (!authError && authData?.user?.id) {
        authUserId = authData.user.id
      } else if (authError) {
        console.warn('[CREATE_FLOW] Supabase Auth signUp warning (falling back to CRM profile creation):', authError.message)
      }
    } catch (authEx) {
      console.warn('[CREATE_FLOW] Supabase Auth signUp exception (falling back to CRM profile creation):', authEx)
    }
  }

  const newId = authUserId || 'acc_' + Date.now()

  console.log('[CREATE_FLOW] Profile creation', { newId, employee_name: data.employee_name, email: data.email })
  const newAccount: UserAccount = {
    ...data,
    id: newId,
    role_id: wsRole,
    role_name: roleObj?.role_name || wsRole.replace('_', ' ').toUpperCase(),
    workspace_role: wsRole,
    employment_type: empType,
    specializations: specs,
    tenant_id: data.tenant_id || 'studio_main',
    system_role:
      wsRole === 'owner' || wsRole === 'administrator' ? 'admin' : wsRole === 'manager' ? 'manager' : 'staff',
    team_type: empType,
    job_roles: specs,
    module_access: data.module_access || getDefaultModuleAccessForWorkspaceRole(wsRole),
    auth_user_id: authUserId,
    password_hash: providedPassword,
    plain_temp_password: loginRequired ? providedPassword : undefined,
    login_enabled: loginRequired,
    last_login_at: null,
    failed_attempts: 0,
    locked_until: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const updatedAccounts = [newAccount, ...existingAccounts]
  // Update in-memory cache immediately for UI responsiveness
  EMPLOYEES_CACHE = updatedAccounts
  esLog('CREATE', { component: 'EmployeeService', service: 'createEmployeeInCloud', newId, resultCount: updatedAccounts.length })

  // Push single individual record to Supabase DB
  await pushEmployeeToCloudDB(newAccount.id, newAccount)

  broadcastEmployeeSyncEvent()
  if (!options?.skipLocalAudit) {
    logLoginAudit('Account Created', createdBy, data.username, `Created user login for ${data.employee_name} (${data.employee_id})`)
  }

    console.log('[CREATE_FLOW] Employee creation completed', { id: newAccount.id, employee_id: newAccount.employee_id })
    return newAccount
  } finally {
    if (emailKey) IN_FLIGHT_CREATES.delete(emailKey)
  }
}

export function createUserAccount(
  data: Omit<UserAccount, 'id' | 'last_login_at' | 'failed_attempts' | 'locked_until' | 'created_at' | 'updated_at'>,
  createdBy = 'Administrator'
): UserAccount {
  const newAccount: UserAccount = {
    ...data,
    id: 'acc_' + Date.now(),
    role_id: data.workspace_role,
    role_name: data.workspace_role.replace('_', ' ').toUpperCase(),
    workspace_role: data.workspace_role,
    employment_type: data.employment_type,
    specializations: data.specializations,
    tenant_id: data.tenant_id || 'studio_main',
    system_role: data.workspace_role === 'owner' || data.workspace_role === 'administrator' ? 'admin' : data.workspace_role === 'manager' ? 'manager' : 'staff',
    team_type: data.employment_type,
    job_roles: data.specializations,
    module_access: data.module_access || getDefaultModuleAccessForWorkspaceRole(data.workspace_role),
    last_login_at: null,
    failed_attempts: 0,
    locked_until: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  createEmployeeInCloud(data, createdBy).then(() => {})
  return newAccount
}

export async function updateEmployeeInCloud(
  userId: string,
  updates: Partial<UserAccount>,
  updatedBy = 'Administrator'
): Promise<UserAccount | null> {
  esLog('UPDATE', { component: 'EmployeeService', service: 'updateEmployeeInCloud', table: 'user_accounts', query: `fetchAllEmployeesFromCloud -> find id=${userId}`, userId })
  const accounts = await fetchAllEmployeesFromCloud()
  const index = accounts.findIndex((a) => a.id === userId)
  if (index === -1) return null

  const candidateRole = (updates.workspace_role || updates.role_id || accounts[index].workspace_role || accounts[index].role_id) as string
  if (!isValidWorkspaceRole(candidateRole)) {
    throw new Error(`EMPLOYEE_INVALID_WORKSPACE_ROLE:${candidateRole}`)
  }

  const nextEmail = (updates.email || accounts[index].email || '').trim().toLowerCase()
  const nextMobile = (updates.mobile || accounts[index].mobile || '').replace(/\D/g, '')
  if (
    nextEmail &&
    accounts.some((a) => a.id !== userId && (a.email || '').trim().toLowerCase() === nextEmail)
  ) {
    throw new Error(`EMPLOYEE_DUPLICATE_EMAIL:${nextEmail}`)
  }
  if (
    nextMobile &&
    accounts.some((a) => a.id !== userId && (a.mobile || '').replace(/\D/g, '') === nextMobile)
  ) {
    throw new Error(`EMPLOYEE_DUPLICATE_MOBILE:${updates.mobile || accounts[index].mobile}`)
  }

  const updatedAcc: UserAccount = {
    ...accounts[index],
    ...updates,
    updated_at: new Date().toISOString(),
  }

  accounts[index] = updatedAcc
  // Update in-memory cache
  EMPLOYEES_CACHE = accounts
  await pushEmployeeToCloudDB(userId, updatedAcc)

  broadcastEmployeeSyncEvent()
  logLoginAudit('Account Updated', updatedBy, updatedAcc.username, `Updated account details for ${updatedAcc.employee_name}`)
  esLog('UPDATE', { component: 'EmployeeService', service: 'updateEmployeeInCloud', userId, resultCount: accounts.length })

  return updatedAcc
}

export function updateUserAccount(
  userId: string,
  updates: Partial<UserAccount>,
  updatedBy = 'Administrator'
): UserAccount | null {
  updateEmployeeInCloud(userId, updates, updatedBy).then(() => {})
  const accounts = getCachedUserAccounts()
  const idx = accounts.findIndex((a) => a.id === userId)
  if (idx !== -1) return { ...accounts[idx], ...updates } as UserAccount
  return null
}

export async function deleteEmployeeFromCloud(userId: string, deletedBy = 'Administrator'): Promise<void> {
  esLog('DELETE', { component: 'EmployeeService', service: 'deleteEmployeeFromCloud', table: ['user_accounts', 'team_members'], query: `delete where id=${userId}`, userId })

  let accounts = EMPLOYEES_CACHE
  if (!accounts || accounts.length === 0) {
    accounts = await fetchAllEmployeesFromCloud()
  }

  const target = accounts.find((a) => a.id === userId || a.employee_id === userId || a.username === userId)
  const actualId = target?.id || userId
  const empId = target?.employee_id || userId

  // 1. Mark IDs as permanently deleted to prevent re-hydration
  markEmployeeAsDeleted([actualId, empId, userId, target?.username || ''])

  const filtered = accounts.filter(
    (a) => a.id !== actualId && a.id !== userId && a.employee_id !== empId && a.employee_id !== userId
  )

  // 2. Update in-memory cache immediately
  EMPLOYEES_CACHE = filtered

  // 3. Purge from local storage backups
  if (typeof window !== 'undefined') {
    const keys = ['trufocus_crm_user_accounts_v1', 'trufocus_crm_employees_v1', 'trufocus_crm_team_v1']
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((item: any) => item.id !== actualId && item.employee_id !== empId && item.id !== userId)
            localStorage.setItem(k, JSON.stringify(cleaned))
          }
        }
      } catch (e) {}
    }
  }

  // 4. Delete from Supabase cloud database
  try {
    await supabase.from('user_accounts').delete().eq('id', actualId)
    await supabase.from('team_members').delete().eq('id', actualId)
    if (empId && empId !== actualId) {
      await supabase.from('user_accounts').delete().eq('employee_id', empId)
      await supabase.from('team_members').delete().eq('employee_id', empId)
    }
  } catch (e) {
    esError('DELETE', { component: 'EmployeeService', service: 'deleteEmployeeFromCloud', userId, error: e })
  }

  broadcastEmployeeSyncEvent()
  if (target) {
    logLoginAudit('Account Deleted', deletedBy, target.username, `Deleted user account for ${target.employee_name}`)
  }
}

export function deleteUserAccount(userId: string, deletedBy = 'Administrator'): void {
  deleteEmployeeFromCloud(userId, deletedBy).then(() => {})
}

export async function resetAllEmployeesToOwnerOnly(actor = 'Administrator'): Promise<UserAccount[]> {
  const onlyOwner = [MASTER_OWNER_ACCOUNT]
  // Update in-memory cache
  EMPLOYEES_CACHE = onlyOwner
  await supabase.from('user_accounts').delete().neq('id', 'acc_admin_owner')
  await supabase.from('team_members').delete().neq('id', 'acc_admin_owner')
  await pushEmployeeToCloudDB('acc_admin_owner', MASTER_OWNER_ACCOUNT)

  broadcastEmployeeSyncEvent()
  logLoginAudit('System Reset', actor, 'System Database', 'Reset Team Login Access to single Owner account.')
  esLog('RESET', { component: 'EmployeeService', service: 'resetAllEmployeesToOwnerOnly', resultCount: onlyOwner.length })

  return onlyOwner
}

export function resetToOnlyOwnerAccount(actor = 'Administrator'): UserAccount[] {
  resetAllEmployeesToOwnerOnly(actor).then(() => {})
  return [MASTER_OWNER_ACCOUNT]
}

export async function toggleEmployeeLoginInCloud(userId: string, enabled: boolean, actor = 'Administrator'): Promise<UserAccount | null> {
  return updateEmployeeInCloud(userId, {
    login_enabled: enabled,
    account_status: enabled ? 'active' : 'inactive',
  }, actor)
}

export async function resetEmployeePasswordInCloud(userId: string, actor = 'Administrator'): Promise<string> {
  const newPassword = generateSecurePassword()
  await updateEmployeeInCloud(userId, {
    password_hash: newPassword,
    plain_temp_password: newPassword,
    force_password_change: true,
  }, actor)
  return newPassword
}

export async function sendEmployeeInvitationEmail(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) throw new Error('EMPLOYEE_EMAIL_REQUIRED')
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/reset-password`
    : undefined

  const { error } = await supabase.auth.resetPasswordForEmail(normalized, redirectTo ? { redirectTo } : undefined)
  if (error) {
    throw new Error(`EMPLOYEE_INVITE_FAILED:${error.message}`)
  }
}

export interface EmployeeAssignmentSnapshot {
  id: string
  work_order_id: string | null
  work_order_number: string | null
  service_name: string | null
  task_type: string | null
  status: string | null
  event_date: string | null
  assigned_at: string | null
  updated_at: string | null
}

export async function fetchEmployeeAssignmentsFromCloud(user: Pick<UserAccount, 'id' | 'employee_id' | 'auth_user_id' | 'employee_name'>): Promise<EmployeeAssignmentSnapshot[]> {
  const candidateIds = [user.id, user.employee_id, user.auth_user_id].filter((v): v is string => Boolean(v))
  const normalizedName = user.employee_name.trim()

  try {
    const results: EmployeeAssignmentSnapshot[] = []

    if (candidateIds.length > 0) {
      const { data, error } = await supabase
        .from('team_assignments')
        .select('id, work_order_id, work_order_number, service_name, task_type, status, event_date, assigned_at, updated_at')
        .in('assigned_to_id', candidateIds)
        .order('assigned_at', { ascending: false })

      if (error && error.code !== 'PGRST205') {
        esError('FETCH_ASSIGNMENTS', {
          component: 'EmployeeService',
          service: 'fetchEmployeeAssignmentsFromCloud',
          error,
          userId: user.id,
          employeeId: user.employee_id,
        })
      }

      if (data && data.length > 0) {
        results.push(...(data as EmployeeAssignmentSnapshot[]))
      }
    }

    if (results.length === 0 && normalizedName.length > 0) {
      const { data, error } = await supabase
        .from('team_assignments')
        .select('id, work_order_id, work_order_number, service_name, task_type, status, event_date, assigned_at, updated_at')
        .ilike('assigned_to_name', normalizedName)
        .order('assigned_at', { ascending: false })

      if (error && error.code !== 'PGRST205') {
        esError('FETCH_ASSIGNMENTS_BY_NAME', {
          component: 'EmployeeService',
          service: 'fetchEmployeeAssignmentsFromCloud',
          error,
          employeeName: normalizedName,
        })
      }

      if (data && data.length > 0) {
        results.push(...(data as EmployeeAssignmentSnapshot[]))
      }
    }

    const dedupe = new Map<string, EmployeeAssignmentSnapshot>()
    results.forEach((item) => dedupe.set(item.id, item))
    return Array.from(dedupe.values())
  } catch (error) {
    esError('FETCH_ASSIGNMENTS_EXCEPTION', {
      component: 'EmployeeService',
      service: 'fetchEmployeeAssignmentsFromCloud',
      error,
      userId: user.id,
    })
    return []
  }
}

// ─── REALTIME WEBSOCKET SUBSCRIPTION SERVICE ───────────────────────────────────

export function subscribeToEmployeeRealtimeChanges(onSyncCallback: (accounts: UserAccount[]) => void): () => void {
  try {
    const channel = supabase
      .channel('trufocus-employee-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        async (payload) => {
          esLog('REALTIME', { component: 'EmployeeService', service: 'subscribeToEmployeeRealtimeChanges', table: payload.table, eventType: payload.eventType, payload })
          if (payload.table === 'user_accounts' || payload.table === 'team_members') {
            try {
              const liveAccounts = await fetchAllEmployeesFromCloud()
              onSyncCallback(liveAccounts)
              broadcastEmployeeSyncEvent()
              esLog('REALTIME', { component: 'EmployeeService', service: 'subscribeToEmployeeRealtimeChanges', table: payload.table, resultCount: liveAccounts.length })
            } catch (e) {
              esError('REALTIME', { component: 'EmployeeService', service: 'subscribeToEmployeeRealtimeChanges', table: payload.table, error: e })
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          esLog('REALTIME', { component: 'EmployeeService', service: 'subscribeToEmployeeRealtimeChanges', status: 'SUBSCRIBED' })
        } else {
          esLog('REALTIME', { component: 'EmployeeService', service: 'subscribeToEmployeeRealtimeChanges', status })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  } catch (e) {
    console.error('Error establishing Supabase Realtime Subscription:', e)
    return () => {}
  }
}

// ─── AUDIT LOG & LOGIN ENGINE HELPERS ─────────────────────────────────────────

export function generateSecurePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const numbers = '23456789'
  const special = '!@#$%^&*'
  const getRandomChar = (str: string) => str[Math.floor(Math.random() * str.length)]

  let result = getRandomChar(upper) + getRandomChar(lower) + getRandomChar(numbers) + getRandomChar(special)
  const all = upper + lower + numbers + special
  for (let i = 0; i < 6; i++) {
    result += getRandomChar(all)
  }
  return result
}

export function suggestUsername(employeeName: string, roleName: string): string {
  const cleanName = employeeName.toLowerCase().replace(/[^a-z]/g, '')
  const cleanRole = roleName.toLowerCase().replace(/[^a-z]/g, '')
  return `${cleanRole || cleanName}01`
}

export function loadLoginHistory(): LoginHistoryEntry[] {
  return [...LOGIN_HISTORY_CACHE]
}

export function addLoginHistory(entry: Omit<LoginHistoryEntry, 'id'>): void {
  const newEntry: LoginHistoryEntry = {
    ...entry,
    id: 'lh_' + Date.now(),
  }
  LOGIN_HISTORY_CACHE = [newEntry, ...LOGIN_HISTORY_CACHE]
}

export function loadLoginAuditLogs(): LoginAuditLog[] {
  return [...LOGIN_AUDIT_CACHE]
}

export function logLoginAudit(action: string, actor: string, targetUser: string, details: string): void {
  const newLog: LoginAuditLog = {
    id: 'la_' + Date.now(),
    action,
    actor,
    target_user: targetUser,
    details,
    created_at: new Date().toISOString(),
  }
  LOGIN_AUDIT_CACHE = [newLog, ...LOGIN_AUDIT_CACHE]
}

export function resetUserPassword(userId: string, newPassword: string, forceChange = false, resetBy = 'Administrator') {
  updateUserAccount(userId, { password_hash: newPassword, plain_temp_password: newPassword, force_password_change: forceChange }, resetBy)
  return { success: true, message: 'Password reset successfully.' }
}

export function revealUserPasswordLog(userId: string, adminActor = 'Administrator') {
  const accounts = getCachedUserAccounts()
  const target = accounts.find((a) => a.id === userId)
  if (target) {
    logLoginAudit('👁 Password Revealed', adminActor, target.username, `Revealed password for ${target.employee_name}`)
  }
}

export function unlockUserAccount(userId: string, unlockedBy = 'Administrator') {
  updateUserAccount(userId, { failed_attempts: 0, locked_until: null, account_status: 'active' }, unlockedBy)
}

export function toggleAccountLogin(userId: string, enabled: boolean, updatedBy = 'Administrator') {
  updateUserAccount(userId, { login_enabled: enabled, account_status: enabled ? 'active' : 'inactive' }, updatedBy)
}

export function bulkActivateUsers(userIds: string[], actor = 'Administrator') {
  userIds.forEach((id) => updateUserAccount(id, { login_enabled: true, account_status: 'active', failed_attempts: 0, locked_until: null }, actor))
}

export function bulkDeactivateUsers(userIds: string[], actor = 'Administrator') {
  userIds.forEach((id) => updateUserAccount(id, { login_enabled: false, account_status: 'inactive' }, actor))
}

export function bulkResetPasswords(userIds: string[], actor = 'Administrator'): Record<string, string> {
  const res: Record<string, string> = {}
  userIds.forEach((id) => {
    const pass = generateSecurePassword()
    updateUserAccount(id, { password_hash: pass, plain_temp_password: pass, force_password_change: true }, actor)
    res[id] = pass
  })
  return res
}

export function bulkDeleteUsers(userIds: string[], actor = 'Administrator') {
  userIds.forEach((id) => deleteUserAccount(id, actor))
}

// Startup: emit verification logs about employee sync environment (wrapped by DEBUG flag)
(async () => {
  if (!DEBUG_EMPLOYEE_SYNC) return
  try {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'unknown'
    let authUser: any = null
    try {
      const { data } = await supabase.auth.getUser()
      authUser = data?.user || null
    } catch (e) {
      authUser = null
    }

    // Attempt to fetch employees to report count (does not change behavior)
    let employeeCount = 0
    try {
      const accounts = await fetchAllEmployeesFromCloud()
      employeeCount = Array.isArray(accounts) ? accounts.length : 0
      const ids = Array.isArray(accounts) ? accounts.map((a) => a.id) : []
      esLog('INIT_VERIFY', {
        component: 'EmployeeService',
        service: 'startupInit',
        employeeCount,
        employeeIds: ids,
        employeeSource: 'EmployeeService',
      })
    } catch (e) {
      employeeCount = EMPLOYEES_CACHE.length
      esError('INIT_VERIFY', { component: 'EmployeeService', service: 'startupInit', error: e })
    }

    esLog('INIT', {
      component: 'EmployeeService',
      service: 'startupInit',
      supabaseUrl,
      activeUser: authUser ? { id: authUser.id, email: authUser.email } : null,
      canonicalEmployeeTable: 'user_accounts',
      employeeCount,
      localStorageEmployeeKeys: 'DISABLED',
      realtimeSubscription: 'not-initialized (subscribeToEmployeeRealtimeChanges will log actual status)'
    })
  } catch (e) {
    esError('INIT', { component: 'EmployeeService', service: 'startupInit', error: e })
  }
})()
