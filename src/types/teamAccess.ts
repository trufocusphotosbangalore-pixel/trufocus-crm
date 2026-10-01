export type CrmModuleId =
  | 'dashboard'
  | 'enquiries'
  | 'work_orders'
  | 'post_production'
  | 'data'
  | 'team'
  | 'finances'
  | 'client_requests'
  | 'trufocus_ai'
  | 'reports'
  | 'settings'
  | 'portal_management'
  | 'gallery'
  | 'documents'
  | 'analytics'
  | 'notifications'

export type CrmRoleId =
  | 'owner'
  | 'administrator'
  | 'manager'
  | 'sales_executive'
  | 'project_coordinator'
  | 'photographer'
  | 'videographer'
  | 'photo_editor'
  | 'video_editor'
  | 'album_designer'
  | 'graphic_designer'
  | 'accounts'
  | 'marketing'
  | 'freelancer'
  | string // Support for custom role IDs

export interface ModuleCrudPermission {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
  approve: boolean
  export_share: boolean
}

export interface SpecializedWorkOrderPermissions {
  can_create_work_order: boolean
  can_edit_work_order: boolean
  can_delete_work_order: boolean
  can_assign_team: boolean
  can_record_payments: boolean
  can_publish_gallery: boolean
  can_edit_contract: boolean
  can_generate_invoice: boolean
  can_generate_receipt: boolean
}

export interface SpecializedPostProductionPermissions {
  view_deliverables: boolean
  assign_editors: boolean
  change_status: boolean
  upload_gallery: boolean
  approve_deliverables: boolean
}

export interface SpecializedFinancePermissions {
  view_finance: boolean
  record_receipt: boolean
  record_payment: boolean
  generate_invoice: boolean
  generate_receipt: boolean
  export_reports: boolean
}

export interface SpecializedTeamPermissions {
  view_team: boolean
  add_team_member: boolean
  edit_team_member: boolean
  delete_team_member: boolean
  manage_attendance: boolean
  manage_payroll: boolean
}

export interface SpecializedClientRequestPermissions {
  view_requests: boolean
  reply: boolean
  assign_requests: boolean
  close_requests: boolean
}

export interface SpecializedSettingsPermissions {
  manage_services: boolean
  manage_deliverables: boolean
  manage_payment_plans: boolean
  manage_contracts: boolean
  manage_team_access: boolean
  manage_system_settings: boolean
}

export type ProductionStage = 'pre_production' | 'on_production' | 'post_production' | 'management'

export interface RolePermissionConfig {
  role_id: string
  role_name: string
  production_stage?: ProductionStage
  is_custom?: boolean
  is_default?: boolean
  description?: string
  modules: Record<CrmModuleId, ModuleCrudPermission>
  work_order_actions: SpecializedWorkOrderPermissions
  post_production_actions: SpecializedPostProductionPermissions
  finance_actions: SpecializedFinancePermissions
  team_actions: SpecializedTeamPermissions
  client_request_actions: SpecializedClientRequestPermissions
  settings_actions: SpecializedSettingsPermissions
}

export interface UserRoleAssignment {
  user_id: string
  user_name: string
  email: string
  department: string
  role_id: string
  status: 'active' | 'inactive'
}

export interface PermissionAuditLog {
  id: string
  action: string
  actor: string
  target_role: string
  details: string
  created_at: string
}
