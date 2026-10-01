import { pushEntityToCloud } from '@/services/cloudSyncService'

export type JobRoleCategory =
  | 'Photography'
  | 'Videography'
  | 'Editing'
  | 'Production'
  | 'Studio'
  | 'Technical'
  | 'Custom'

export interface JobRoleItem {
  id: string
  role_name: string
  category: JobRoleCategory
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const JOB_ROLES_KEY = 'trufocus_crm_job_roles_v1'

export const DEFAULT_JOB_ROLES: JobRoleItem[] = [
  // Photography
  { id: 'jr-1', role_name: 'Traditional Photographer', category: 'Photography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-2', role_name: 'Candid Photographer', category: 'Photography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-3', role_name: 'Wedding Photographer', category: 'Photography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-4', role_name: 'Event Photographer', category: 'Photography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-5', role_name: 'Pre-Wedding Photographer', category: 'Photography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-6', role_name: 'Maternity Photographer', category: 'Photography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-7', role_name: 'Baby Shoot Photographer', category: 'Photography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-8', role_name: 'Product Photographer', category: 'Photography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-9', role_name: 'Food Photographer', category: 'Photography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-10', role_name: 'Architecture Photographer', category: 'Photography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-11', role_name: 'Studio Photographer', category: 'Photography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-12', role_name: 'Fashion Photographer', category: 'Photography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-13', role_name: 'Assistant Photographer', category: 'Photography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },

  // Videography
  { id: 'jr-14', role_name: 'Traditional Videographer', category: 'Videography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-15', role_name: 'Candid Videographer', category: 'Videography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-16', role_name: 'Cinematographer', category: 'Videography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-17', role_name: 'Drone Pilot', category: 'Videography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-18', role_name: 'Gimbal Operator', category: 'Videography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-19', role_name: 'Live Streaming Operator', category: 'Videography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-20', role_name: 'Camera Assistant', category: 'Videography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-21', role_name: 'Assistant Videographer', category: 'Videography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-22', role_name: 'Crane Operator', category: 'Videography', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },

  // Editing
  { id: 'jr-23', role_name: 'Photo Editor', category: 'Editing', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-24', role_name: 'Photo Retoucher', category: 'Editing', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-25', role_name: 'Album Designer', category: 'Editing', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-26', role_name: 'Video Editor', category: 'Editing', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-27', role_name: 'Color Grading Artist', category: 'Editing', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-28', role_name: 'Motion Graphics Designer', category: 'Editing', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-29', role_name: 'Reels Editor', category: 'Editing', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-30', role_name: 'AI Photo Editor', category: 'Editing', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },

  // Production
  { id: 'jr-31', role_name: 'Production Manager', category: 'Production', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-32', role_name: 'Event Coordinator', category: 'Production', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-33', role_name: 'Shoot Coordinator', category: 'Production', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-34', role_name: 'Operations Manager', category: 'Production', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-35', role_name: 'DIT (Digital Imaging Technician)', category: 'Production', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-36', role_name: 'Data Backup Operator', category: 'Production', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },

  // Studio
  { id: 'jr-37', role_name: 'Studio Manager', category: 'Studio', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-38', role_name: 'Receptionist', category: 'Studio', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-39', role_name: 'Customer Support', category: 'Studio', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-40', role_name: 'Sales Executive', category: 'Studio', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-41', role_name: 'Marketing Executive', category: 'Studio', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-42', role_name: 'Accountant', category: 'Studio', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-43', role_name: 'Equipment Manager', category: 'Studio', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-44', role_name: 'Social Media Manager', category: 'Studio', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },

  // Technical
  { id: 'jr-45', role_name: 'LED Operator', category: 'Technical', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-46', role_name: 'Audio Technician', category: 'Technical', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-47', role_name: 'Lighting Technician', category: 'Technical', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-48', role_name: 'Podcast Technician', category: 'Technical', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'jr-49', role_name: 'Live Mixer', category: 'Technical', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
]

function broadcastJobRolesUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trufocus_job_roles_updated'))
    window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
  }
}

export function getAllJobRoles(): JobRoleItem[] {
  try {
    const raw = localStorage.getItem(JOB_ROLES_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error loading job roles', e)
  }
  return DEFAULT_JOB_ROLES
}

export function getJobRoles(): JobRoleItem[] {
  return getAllJobRoles().filter(r => r.is_active)
}

export function getJobRolesByCategory(): Record<JobRoleCategory, JobRoleItem[]> {
  const activeRoles = getJobRoles()
  const grouped: Record<JobRoleCategory, JobRoleItem[]> = {
    Photography: [],
    Videography: [],
    Editing: [],
    Production: [],
    Studio: [],
    Technical: [],
    Custom: [],
  }

  activeRoles.forEach((role) => {
    const cat = role.category || 'Custom'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(role)
  })

  return grouped
}

export function saveAllJobRoles(roles: JobRoleItem[]): void {
  try {
    localStorage.setItem(JOB_ROLES_KEY, JSON.stringify(roles))
    pushEntityToCloud('job_roles', 'main', roles)
    broadcastJobRolesUpdate()
  } catch (e) {
    console.error('Error saving job roles', e)
  }
}

export function saveJobRole(role: Partial<JobRoleItem>): JobRoleItem {
  const current = getAllJobRoles()
  const now = new Date().toISOString()

  if (role.id) {
    const idx = current.findIndex(r => r.id === role.id)
    if (idx !== -1) {
      const updated: JobRoleItem = {
        ...current[idx],
        ...role,
        updated_at: now,
      } as JobRoleItem
      current[idx] = updated
      saveAllJobRoles(current)
      return updated
    }
  }

  const newRole: JobRoleItem = {
    id: `jr-${Date.now()}`,
    role_name: role.role_name?.trim() || 'New Custom Role',
    category: (role.category as JobRoleCategory) || 'Custom',
    description: role.description?.trim() || '',
    is_active: role.is_active ?? true,
    created_at: now,
    updated_at: now,
  }

  const updatedList = [newRole, ...current]
  saveAllJobRoles(updatedList)
  return newRole
}

export function toggleJobRoleStatus(id: string): void {
  const current = getAllJobRoles()
  const updated = current.map(r => r.id === id ? { ...r, is_active: !r.is_active, updated_at: new Date().toISOString() } : r)
  saveAllJobRoles(updated)
}

export function deleteJobRole(id: string): void {
  const current = getAllJobRoles()
  const updated = current.filter(r => r.id !== id)
  saveAllJobRoles(updated)
}
