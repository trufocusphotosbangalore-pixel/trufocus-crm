export type TeamType = 'in_house' | 'freelancer'

export type AvailabilityStatus = 'available' | 'busy' | 'leave' | 'inactive'

export type DepartmentName =
  | 'Photography'
  | 'Videography'
  | 'Editing'
  | 'Sales'
  | 'Marketing'
  | 'Accounts'
  | 'Technical'
  | 'Management'
  | 'Other'

export interface RoleMaster {
  id: string
  role_name: string
  department: DepartmentName
}

export interface TeamMemberRole {
  id: string
  team_member_id: string
  role_id: string
  created_at: string
}

export interface BankDetails {
  account_number?: string
  bank_name?: string
  ifsc_code?: string
  account_holder?: string
}

export interface TeamMember {
  id: string
  employee_id: string
  full_name: string
  mobile_number: string
  whatsapp_number?: string
  email_address?: string
  photo_url?: string
  team_type: TeamType
  job_roles: string[] // Multi-select job roles
  job_role?: string // Backward compatibility single role fallback
  department: DepartmentName
  experience_years?: number
  monthly_salary?: number // For In-House
  daily_rate?: number // For Freelancers
  availability: AvailabilityStatus
  preferred_city?: string
  address?: string
  emergency_contact?: string
  pan_number?: string
  aadhaar_number?: string
  upi_id?: string
  bank_details?: BankDetails
  skills?: string[]
  current_assignment?: string
  total_assignments?: number
  last_assignment_date?: string
  joining_date?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export const CATEGORIZED_JOB_ROLES: { category: string; roles: string[] }[] = [
  {
    category: 'Photography',
    roles: [
      'Traditional Photographer',
      'Candid Photographer',
      'Event Photographer',
      'Studio Photographer',
      'Product Photographer',
      'Maternity Photographer',
      'Newborn Photographer',
    ],
  },
  {
    category: 'Videography',
    roles: [
      'Traditional Videographer',
      'Candid Videographer',
      'Cinematographer',
      'Drone Operator',
      'Live Streaming Operator',
    ],
  },
  {
    category: 'Editing',
    roles: [
      'Photo Editor',
      'Video Editor',
      'Album Designer',
      'Graphic Designer',
    ],
  },
  {
    category: 'Management',
    roles: [
      'Manager',
      'Project Coordinator',
      'Team Lead',
    ],
  },
  {
    category: 'Sales',
    roles: [
      'Sales Executive',
      'Marketing Executive',
    ],
  },
  {
    category: 'Accounts',
    roles: [
      'Accountant',
    ],
  },
  {
    category: 'Technical',
    roles: [
      'LED Operator',
      'Audio Technician',
      'Lighting Technician',
    ],
  },
  {
    category: 'Other',
    roles: [
      'Other',
    ],
  },
]

export const ALL_JOB_ROLES: string[] = CATEGORIZED_JOB_ROLES.flatMap((c) => c.roles)

export const DEPARTMENTS: DepartmentName[] = [
  'Photography',
  'Videography',
  'Editing',
  'Sales',
  'Marketing',
  'Accounts',
  'Technical',
  'Management',
  'Other',
]

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  available: 'Available',
  busy: 'Busy',
  leave: 'On Leave',
  inactive: 'Inactive',
}

export const AVAILABILITY_COLORS: Record<AvailabilityStatus, { bg: string; text: string; dot: string }> = {
  available: { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  busy:      { bg: 'bg-amber-50 border border-amber-200',     text: 'text-amber-700',   dot: 'bg-amber-500' },
  leave:     { bg: 'bg-red-50 border border-red-200',         text: 'text-red-700',     dot: 'bg-red-500' },
  inactive:  { bg: 'bg-gray-100 border border-gray-200',      text: 'text-gray-600',    dot: 'bg-gray-400' },
}
