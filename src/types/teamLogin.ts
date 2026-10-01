export type AccountStatus = 'active' | 'inactive' | 'locked'

export type LoginStatusBadge = 'active' | 'never_logged_in' | 'disabled'

export type EmploymentType = 'in_house' | 'freelancer' | 'vendor' | 'intern'
export type TeamType = EmploymentType // Alias for backward compatibility

export type SystemRole = 'admin' | 'manager' | 'staff'

export type WorkspaceRole =
  | 'owner'
  | 'administrator'
  | 'manager'
  | 'photographer'
  | 'videographer'
  | 'photo_editor'
  | 'video_editor'
  | 'album_designer'
  | 'data_operator'
  | 'finance'
  | 'sales_executive'
  | 'client_manager'

export interface ModuleAccessSettings {
  [key: string]: boolean
  dashboard: boolean
  enquiries: boolean
  projects: boolean
  post_production: boolean
  data: boolean
  team: boolean
  finances: boolean
  client_requests: boolean
  trufocus_ai: boolean
  settings: boolean
  reports: boolean
}

export interface UserAccount {
  id: string
  employee_id: string
  employee_name: string
  full_name?: string
  profile_photo?: string
  photo_url?: string
  department: string
  username: string
  email: string
  email_address?: string
  mobile: string
  mobile_number?: string
  password_hash: string
  plain_temp_password?: string // Exposed temporarily when generated/reset
  role_id: string
  role_name: string
  workspace_role: WorkspaceRole
  employment_type: EmploymentType
  specializations: string[] // Skills only (does not control login permissions)
  tenant_id: string // SaaS Studio/Tenant ID for multi-studio isolation
  system_role: SystemRole
  team_type: TeamType
  job_roles: string[]
  module_access: ModuleAccessSettings
  auth_user_id?: string
  account_status: AccountStatus
  status?: AccountStatus
  login_enabled: boolean
  is_active?: boolean
  last_login_at: string | null
  last_logout_at?: string | null
  last_ip_address?: string
  last_device?: string
  last_browser?: string
  failed_attempts: number
  locked_until: string | null
  force_password_change?: boolean
  created_at: string
  updated_at: string
  job_role?: string
}

export interface LoginHistoryEntry {
  id: string
  user_id: string
  username: string
  timestamp: string
  logout_timestamp?: string | null
  ip_address: string
  browser: string
  device: string
  status: 'success' | 'failed' | 'locked'
  failure_reason?: string
}

export interface LoginAuditLog {
  id: string
  action: string
  actor: string
  target_user: string
  details: string
  created_at: string
}
