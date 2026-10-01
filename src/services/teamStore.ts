import { getCachedUserAccounts, updateUserAccount, deleteUserAccount as deleteUserAcc } from '@/services/employeeService'
import type { TeamMember, DepartmentName } from '@/types/team'

export function getTeamMemberFromAccount(a: any): TeamMember {
  const rolesArray =
    a.specializations && a.specializations.length > 0
      ? a.specializations
      : a.job_roles && a.job_roles.length > 0
      ? a.job_roles
      : [a.role_name || 'Staff']

  return {
    id: a.id,
    employee_id: a.employee_id || 'EMP-1000',
    full_name: a.employee_name || a.full_name || 'Team Member',
    mobile_number: a.mobile || a.mobile_number || '',
    whatsapp_number: a.mobile || a.mobile_number || '',
    email_address: a.email || '',
    photo_url: a.profile_photo || '',
    team_type: (a.employment_type === 'freelancer' || a.team_type === 'freelancer' || a.employment_type === 'vendor') ? 'freelancer' : 'in_house',
    job_roles: rolesArray,
    job_role: rolesArray[0],
    department: (a.department as DepartmentName) || 'Photography',
    experience_years: 3,
    availability: (a.account_status === 'active' || a.is_active !== false) ? 'available' : 'busy',
    preferred_city: 'Bangalore',
    status: (a.account_status === 'active' || a.is_active !== false) ? 'active' : 'inactive',
    skills: rolesArray,
    total_assignments: 0,
    joining_date: a.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    created_at: a.created_at,
    updated_at: a.updated_at,
  }
}

/**
 * MASTER SINGLE SOURCE OF TRUTH BRIDGE:
 * Reads employee records directly from teamLoginStore / Supabase DB user_accounts & team_members tables.
 */
export function getTeamMembers(): TeamMember[] {
  const accounts = getCachedUserAccounts()
  return accounts.map((a) => getTeamMemberFromAccount(a))
}

export function saveTeamMembers(_members: TeamMember[]): void {
  // Sync wrapper kept for legacy callers
}

export function saveTeamMember(member: Partial<TeamMember>): TeamMember {
  if (member.id) {
    updateUserAccount(member.id, {
      employee_name: member.full_name,
      mobile: member.mobile_number,
      email: member.email_address,
      specializations: member.job_roles || (member.job_role ? [member.job_role] : undefined),
      department: member.department,
      employment_type: member.team_type,
      team_type: member.team_type,
    })
  }
  const members = getTeamMembers()
  return members.find((m) => m.id === member.id) || members[0]
}

export function deleteTeamMember(id: string): void {
  deleteUserAcc(id)
}

/**
 * Assignment Helper: Fetch employees possessing a required job role / skill.
 */
export function getMembersByRole(roleName: string): TeamMember[] {
  const all = getTeamMembers()
  const query = roleName.toLowerCase()

  const matching = all.filter((m) => {
    if (m.job_roles && m.job_roles.some((r) => r.toLowerCase().includes(query))) return true
    if (m.job_role && m.job_role.toLowerCase().includes(query)) return true
    return false
  })

  return matching.sort((a, b) => {
    if (a.availability === 'available' && b.availability !== 'available') return -1
    if (a.availability !== 'available' && b.availability === 'available') return 1
    return a.full_name.localeCompare(b.full_name)
  })
}

export function exportTeamToCSV(teamType?: 'in_house' | 'freelancer'): void {
  const members = getTeamMembers().filter((m) => !teamType || m.team_type === teamType)
  const headers = [
    'Employee ID',
    'Full Name',
    'Team Type',
    'Job Roles',
    'Department',
    'Mobile Number',
    'WhatsApp Number',
    'Email Address',
    'Availability',
    'Status',
  ]

  const rows = members.map((m) => [
    m.employee_id,
    `"${m.full_name}"`,
    m.team_type,
    `"${(m.job_roles || [m.job_role]).join(';')}"`,
    m.department,
    m.mobile_number,
    m.whatsapp_number || '',
    m.email_address || '',
    m.availability,
    m.status,
  ])

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `trufocus_employees_${teamType || 'all'}_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
