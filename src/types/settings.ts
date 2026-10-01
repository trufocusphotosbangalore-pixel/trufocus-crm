export interface EventTypeMaster {
  id: string
  name: string
  code: string
  description?: string
  is_active: boolean
}

export interface ServiceMaster {
  id: string
  name: string
  department_id: string
  department_name?: string
  default_rate?: number
  description?: string
  is_active: boolean
}

export interface DeliverableMaster {
  id: string
  name: string
  category?: string
  description?: string
  is_active: boolean
}

export interface PaymentModeMaster {
  id: string
  name: string
  code: string
  requires_reference: boolean
  is_active: boolean
}

export interface ContractTemplateMaster {
  id: string
  title: string
  content: string // Rich Text HTML or plain text
  is_default?: boolean
  is_active: boolean
}

export interface DepartmentMaster {
  id: string
  name: string
  code: string
  is_active: boolean
}

export interface EmployeeRoleMaster {
  id: string
  title: string
  department_id: string
  department_name?: string
  is_active: boolean
}

export interface EmployeeProfile {
  id: string
  full_name: string
  role_id: string
  role_title?: string
  department_id: string
  department_name?: string
  mobile: string
  email?: string
  eligible_service_ids: string[] // List of ServiceMaster IDs employee can be assigned to
  is_active: boolean
}

export interface SettingsState {
  eventTypes: EventTypeMaster[]
  services: ServiceMaster[]
  deliverables: DeliverableMaster[]
  paymentModes: PaymentModeMaster[]
  contractTemplates: ContractTemplateMaster[]
  departments: DepartmentMaster[]
  employeeRoles: EmployeeRoleMaster[]
  employees: EmployeeProfile[]
}
