import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Filter,
  KeyRound,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Send,
  Shield,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { AddTeamMemberWizardModal } from '@/components/team/AddTeamMemberWizardModal'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'
import type { EmploymentType, UserAccount, WorkspaceRole } from '@/types/teamLogin'
import {
  deleteEmployeeFromCloud,
  fetchAllEmployeesFromCloud,
  fetchEmployeeAssignmentsFromCloud,
  getDefaultModuleAccessForWorkspaceRole,
  resetEmployeePasswordInCloud,
  sendEmployeeInvitationEmail,
  subscribeToEmployeeRealtimeChanges,
  toggleEmployeeLoginInCloud,
  updateEmployeeInCloud,
  type EmployeeAssignmentSnapshot,
} from '@/services/employeeService'

type DirectoryRoleKey =
  | 'owner'
  | 'manager'
  | 'photographer'
  | 'videographer'
  | 'photo_editor'
  | 'video_editor'
  | 'album_designer'
  | 'sales'
  | 'finance'

const DIRECTORY_ROLE_OPTIONS: { key: DirectoryRoleKey; label: string; workspaceRole: WorkspaceRole }[] = [
  { key: 'owner', label: 'Owner', workspaceRole: 'owner' },
  { key: 'manager', label: 'Manager', workspaceRole: 'manager' },
  { key: 'photographer', label: 'Photographer', workspaceRole: 'photographer' },
  { key: 'videographer', label: 'Videographer', workspaceRole: 'videographer' },
  { key: 'photo_editor', label: 'Photo Editor', workspaceRole: 'photo_editor' },
  { key: 'video_editor', label: 'Video Editor', workspaceRole: 'video_editor' },
  { key: 'album_designer', label: 'Album Designer', workspaceRole: 'album_designer' },
  { key: 'sales', label: 'Sales', workspaceRole: 'sales_executive' },
  { key: 'finance', label: 'Finance', workspaceRole: 'finance' },
]

const MODULE_KEYS = [
  'dashboard',
  'enquiries',
  'projects',
  'post_production',
  'data',
  'team',
  'finances',
  'client_requests',
  'trufocus_ai',
  'settings',
  'reports',
] as const

type DetailsTabId = 'overview' | 'assignments' | 'calendar' | 'permissions' | 'equipment' | 'documents' | 'activity'

const DETAILS_TABS: { id: DetailsTabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'documents', label: 'Documents' },
  { id: 'activity', label: 'Activity Log' },
]

interface TeamMemberForm {
  employeeId: string
  loginRequired: boolean
  loginEmail: string
  loginPassword: string
  employeeName: string
  primaryEmail: string
  mobile: string
  username: string
  roleKey: DirectoryRoleKey
  employmentType: EmploymentType
  department: string
  specializations: string
  moduleAccess: Record<string, boolean>
}

const INITIAL_FORM: TeamMemberForm = {
  employeeId: '',
  loginRequired: true,
  loginEmail: '',
  loginPassword: '',
  employeeName: '',
  primaryEmail: '',
  mobile: '',
  username: '',
  roleKey: 'photographer',
  employmentType: 'in_house',
  department: 'Production',
  specializations: '',
  moduleAccess: { ...getDefaultModuleAccessForWorkspaceRole('photographer') },
}

interface ActivityEvent {
  id: string
  label: string
  date: string
}

function toDateLabel(value: string | null | undefined) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return date.toLocaleString()
}

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function getRoleOptionByKey(key: DirectoryRoleKey) {
  return DIRECTORY_ROLE_OPTIONS.find((option) => option.key === key) || DIRECTORY_ROLE_OPTIONS[0]
}

function mapWorkspaceRoleToDirectoryRole(role?: string): DirectoryRoleKey {
  if (role === 'owner' || role === 'administrator') return 'owner'
  if (role === 'manager') return 'manager'
  if (role === 'photographer') return 'photographer'
  if (role === 'videographer') return 'videographer'
  if (role === 'photo_editor') return 'photo_editor'
  if (role === 'video_editor') return 'video_editor'
  if (role === 'album_designer') return 'album_designer'
  if (role === 'sales_executive') return 'sales'
  if (role === 'finance') return 'finance'
  return 'photographer'
}

function mapDirectoryRoleToWorkspaceRole(roleKey: DirectoryRoleKey): WorkspaceRole {
  return getRoleOptionByKey(roleKey).workspaceRole
}

function prettyRole(role: string | undefined) {
  if (!role) return 'Staff'
  return role.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, '')
}

function isValidDirectoryRole(roleKey: string): roleKey is DirectoryRoleKey {
  return DIRECTORY_ROLE_OPTIONS.some((option) => option.key === roleKey)
}

export function TeamDirectoryTab() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [nameSearch, setNameSearch] = useState('')
  const [employeeIdSearch, setEmployeeIdSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [employmentFilter, setEmploymentFilter] = useState<'all' | EmploymentType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [loginFilter, setLoginFilter] = useState<'all' | 'enabled' | 'disabled'>('all')

  const [isWizardOpen, setIsWizardOpen] = useState(false)

  const [editingEmployee, setEditingEmployee] = useState<UserAccount | null>(null)
  const [editForm, setEditForm] = useState<TeamMemberForm>(INITIAL_FORM)
  const [isEditSaving, setIsEditSaving] = useState(false)

  const [selectedEmployee, setSelectedEmployee] = useState<UserAccount | null>(null)
  const [detailsTab, setDetailsTab] = useState<DetailsTabId>('overview')
  const [employeeAssignments, setEmployeeAssignments] = useState<EmployeeAssignmentSnapshot[]>([])
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)

  const [activityState, setActivityState] = useState<Record<string, ActivityEvent[]>>({})
  const [latestPasswordReset, setLatestPasswordReset] = useState<{ userName: string; password: string } | null>(null)

  const currentWorkspaceRole = (user?.workspace_role || user?.role_id || user?.role || '').toLowerCase()
  const currentSystemRole = (user?.system_role || '').toLowerCase()
  const canDeleteEmployees = currentWorkspaceRole === 'owner' || currentWorkspaceRole === 'administrator' || currentSystemRole === 'admin'

  const addActivity = (employeeId: string, label: string) => {
    const event: ActivityEvent = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      label,
      date: new Date().toISOString(),
    }
    setActivityState((prev) => ({
      ...prev,
      [employeeId]: [event, ...(prev[employeeId] || [])],
    }))
  }

  const loadEmployees = async () => {
    setIsRefreshing(true)
    try {
      const data = await fetchAllEmployeesFromCloud()
      setAccounts(data)
      if (selectedEmployee) {
        const updatedSelected = data.find((item) => item.id === selectedEmployee.id)
        setSelectedEmployee(updatedSelected || null)
      }
    } catch (error) {
      console.error('Failed to load team directory:', error)
      toast.error('Failed to load team members from Supabase.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadEmployees()
    const unsubscribe = subscribeToEmployeeRealtimeChanges((liveAccounts) => {
      setAccounts(liveAccounts)
      if (selectedEmployee) {
        const updatedSelected = liveAccounts.find((item) => item.id === selectedEmployee.id)
        setSelectedEmployee(updatedSelected || null)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!selectedEmployee) return
    setIsAssignmentsLoading(true)
    fetchEmployeeAssignmentsFromCloud(selectedEmployee)
      .then((rows) => setEmployeeAssignments(rows))
      .catch((error) => {
        console.error('Failed to load employee assignments:', error)
        toast.error('Unable to load assignment details for this employee.')
      })
      .finally(() => setIsAssignmentsLoading(false))
  }, [selectedEmployee])

  const roleFilterOptions = useMemo(() => {
    const available = new Set(accounts.map((a) => mapWorkspaceRoleToDirectoryRole(a.workspace_role || a.role_id)))
    return ['all', ...DIRECTORY_ROLE_OPTIONS.filter((role) => available.has(role.key)).map((role) => role.key)]
  }, [accounts])

  const filteredAccounts = useMemo(() => {
    const nameQuery = nameSearch.trim().toLowerCase()
    const idQuery = employeeIdSearch.trim().toLowerCase()
    return accounts.filter((acc) => {
      const roleKey = mapWorkspaceRoleToDirectoryRole(acc.workspace_role || acc.role_id)
      const isActive = acc.account_status === 'active'
      const isLoginEnabled = Boolean(acc.login_enabled)
      const matchesName = nameQuery.length === 0 || acc.employee_name.toLowerCase().includes(nameQuery)
      const matchesEmployeeId = idQuery.length === 0 || acc.employee_id.toLowerCase().includes(idQuery)
      const matchesRole = roleFilter === 'all' || roleKey === roleFilter
      const matchesEmployment = employmentFilter === 'all' || (acc.employment_type || acc.team_type) === employmentFilter
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? isActive : !isActive)
      const matchesLogin = loginFilter === 'all' || (loginFilter === 'enabled' ? isLoginEnabled : !isLoginEnabled)
      return matchesName && matchesEmployeeId && matchesRole && matchesEmployment && matchesStatus && matchesLogin
    })
  }, [accounts, nameSearch, employeeIdSearch, roleFilter, employmentFilter, statusFilter, loginFilter])

  const summary = useMemo(() => {
    const active = accounts.filter((a) => a.account_status === 'active').length
    const inHouse = accounts.filter((a) => (a.employment_type || a.team_type) === 'in_house').length
    const freelancers = accounts.filter((a) => (a.employment_type || a.team_type) === 'freelancer').length
    const managers = accounts.filter((a) => mapWorkspaceRoleToDirectoryRole(a.workspace_role || a.role_id) === 'manager').length
    return {
      total: accounts.length,
      active,
      inHouse,
      freelancers,
      managers,
    }
  }, [accounts])

  const openWizard = () => {
    setIsWizardOpen(true)
  }

  const openEditModal = (employee: UserAccount) => {
    const roleKey = mapWorkspaceRoleToDirectoryRole(employee.workspace_role || employee.role_id)
    setEditingEmployee(employee)
    setEditForm({
      employeeId: employee.employee_id,
      loginRequired: employee.login_enabled,
      loginEmail: employee.email,
      loginPassword: employee.password_hash || '',
      employeeName: employee.employee_name,
      primaryEmail: employee.email,
      mobile: employee.mobile,
      username: employee.username,
      roleKey,
      employmentType: employee.employment_type || employee.team_type || 'in_house',
      department: employee.department || 'Production',
      specializations: (employee.specializations || []).join(', '),
      moduleAccess: { ...(employee.module_access || getDefaultModuleAccessForWorkspaceRole(mapDirectoryRoleToWorkspaceRole(roleKey))) },
    })
  }

  const validateRequiredFields = (candidate: TeamMemberForm) => {
    if (!candidate.employeeId.trim()) return 'Employee ID is required.'
    if (!candidate.employeeName.trim()) return 'Employee name is required.'
    if (!candidate.primaryEmail.trim()) return 'Primary email is required.'
    if (!candidate.mobile.trim()) return 'Mobile is required.'
    if (!isValidDirectoryRole(candidate.roleKey)) return 'Invalid workspace role.'
    if (candidate.loginRequired && !candidate.loginEmail.trim()) return 'Login email is required when login is enabled.'
    if (candidate.loginRequired && candidate.loginPassword.trim().length < 8) return 'Login password must be at least 8 characters.'
    return null
  }

  const validateUniqueness = (candidate: TeamMemberForm, excludeUserId?: string) => {
    const email = (candidate.loginRequired ? candidate.loginEmail : candidate.primaryEmail).trim().toLowerCase()
    const mobileDigits = normalizeDigits(candidate.mobile)
    const duplicateEmail = accounts.find((account) => account.id !== excludeUserId && account.email.trim().toLowerCase() === email)
    if (duplicateEmail) return `Duplicate email detected: ${email}`
    if (mobileDigits) {
      const duplicateMobile = accounts.find(
        (account) =>
          account.id !== excludeUserId &&
          normalizeDigits(account.mobile || '') !== '' &&
          normalizeDigits(account.mobile || '') === mobileDigits
      )
      if (duplicateMobile) return `Duplicate mobile detected: ${candidate.mobile}`
    }
    return null
  }

  const handleEditMemberSave = async () => {
    if (!editingEmployee) return

    const fieldError = validateRequiredFields(editForm)
    if (fieldError) {
      toast.error(fieldError)
      return
    }

    const uniquenessError = validateUniqueness(editForm, editingEmployee.id)
    if (uniquenessError) {
      toast.error(uniquenessError)
      return
    }

    setIsEditSaving(true)
    try {
      const workspaceRole = mapDirectoryRoleToWorkspaceRole(editForm.roleKey)
      const specializations = parseTags(editForm.specializations)
      await updateEmployeeInCloud(editingEmployee.id, {
        employee_id: editForm.employeeId.trim(),
        employee_name: editForm.employeeName.trim(),
        username: editForm.username.trim().toLowerCase(),
        email: (editForm.loginRequired ? editForm.loginEmail : editForm.primaryEmail).trim().toLowerCase(),
        mobile: editForm.mobile.trim(),
        workspace_role: workspaceRole,
        role_id: workspaceRole,
        role_name: prettyRole(workspaceRole),
        system_role: workspaceRole === 'owner' ? 'admin' : workspaceRole === 'manager' ? 'manager' : 'staff',
        employment_type: editForm.employmentType,
        team_type: editForm.employmentType,
        department: editForm.department.trim() || 'Production',
        specializations: specializations.length > 0 ? specializations : ['General Staff'],
        job_roles: specializations.length > 0 ? specializations : ['General Staff'],
        module_access: editForm.moduleAccess as any,
        login_enabled: editForm.loginRequired,
        account_status: editForm.loginRequired ? 'active' : 'inactive',
      }, 'Administrator')

      toast.success('Employee updated successfully.')
      addActivity(editingEmployee.id, 'Employee profile updated')
      setEditingEmployee(null)
      await loadEmployees()
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Failed to update employee.'
      toast.error(message)
    } finally {
      setIsEditSaving(false)
    }
  }

  const handleDeleteMember = async () => {
    if (!deleteTarget) return
    if (!canDeleteEmployees) {
      toast.error('Only Owner/Admin can delete employees.')
      return
    }
    setIsDeleteLoading(true)
    try {
      const targetId = deleteTarget.id
      const targetEmpId = deleteTarget.employee_id
      const targetName = deleteTarget.employee_name

      setAccounts((prev: UserAccount[]) => prev.filter((m: UserAccount) => m.id !== targetId && m.employee_id !== targetEmpId))
      await deleteEmployeeFromCloud(targetId, 'Administrator')
      addActivity(targetId, 'Employee deleted')
      toast.success(`Removed ${targetName} from Team Directory.`)

      if (selectedEmployee?.id === targetId || selectedEmployee?.employee_id === targetEmpId) {
        setSelectedEmployee(null)
      }
      setDeleteTarget(null)
      await loadEmployees()
    } catch (error) {
      console.error('Delete member failed:', error)
      toast.error('Failed to delete team member.')
    } finally {
      setIsDeleteLoading(false)
    }
  }

  const setEmployeeStatus = async (member: UserAccount, active: boolean) => {
    try {
      await updateEmployeeInCloud(member.id, {
        account_status: active ? 'active' : 'inactive',
      }, 'Administrator')
      addActivity(member.id, active ? 'Employee reactivated' : 'Employee disabled')
      toast.success(`${member.employee_name} is now ${active ? 'active' : 'inactive'}.`)
      await loadEmployees()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update employee status.')
    }
  }

  const setLoginEnabled = async (member: UserAccount, enabled: boolean) => {
    try {
      await toggleEmployeeLoginInCloud(member.id, enabled, 'Administrator')
      addActivity(member.id, enabled ? 'Login enabled' : 'Login disabled')
      toast.success(`${member.employee_name} login is now ${enabled ? 'enabled' : 'disabled'}.`)
      await loadEmployees()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update login status.')
    }
  }

  const handleResetPassword = async (member: UserAccount) => {
    try {
      const password = await resetEmployeePasswordInCloud(member.id, 'Administrator')
      setLatestPasswordReset({ userName: member.employee_name, password })
      addActivity(member.id, 'Password reset')
      toast.success(`Password reset for ${member.employee_name}.`)
      await loadEmployees()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reset password.')
    }
  }

  const handleSendInvitation = async (member: UserAccount) => {
    try {
      await sendEmployeeInvitationEmail(member.email)
      addActivity(member.id, 'Invitation email sent')
      toast.success(`Invitation email sent to ${member.email}.`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send invitation email.')
    }
  }

  const activityFeed = useMemo(() => {
    if (!selectedEmployee) return []
    const baseEvents: ActivityEvent[] = [
      { id: 'created', label: 'Profile created', date: selectedEmployee.created_at },
      { id: 'updated', label: 'Profile updated', date: selectedEmployee.updated_at },
      { id: 'last-login', label: 'Last login', date: selectedEmployee.last_login_at || '' },
      ...employeeAssignments.map((assignment) => ({
        id: assignment.id,
        label: `Assignment ${assignment.status} - ${assignment.service_name || assignment.task_type}`,
        date: assignment.updated_at || assignment.assigned_at || '',
      })),
      ...(activityState[selectedEmployee.id] || []),
    ]

    return baseEvents
      .filter((event) => event.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [selectedEmployee, employeeAssignments, activityState])

  const equipmentItems = useMemo(() => {
    if (!selectedEmployee) return []
    const raw = (selectedEmployee as any).equipment
    if (!Array.isArray(raw)) return []
    return raw.map((item, idx) => ({
      id: `eq-${idx}`,
      name: String(item?.name || item || 'Equipment Item'),
      status: String(item?.status || 'available'),
    }))
  }, [selectedEmployee])

  const documentItems = useMemo(() => {
    if (!selectedEmployee) return []
    const raw = (selectedEmployee as any).documents
    if (!Array.isArray(raw)) return []
    return raw.map((item, idx) => ({
      id: `doc-${idx}`,
      title: String(item?.title || item?.name || 'Document'),
      type: String(item?.type || 'general'),
    }))
  }, [selectedEmployee])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-5">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Team Directory</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">Employee CRUD, login management, and profile operations powered by Supabase.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadEmployees} isLoading={isRefreshing}>Refresh</Button>
          <Button size="sm" leftIcon={<UserPlus size={14} />} onClick={openWizard}>Add Team Member</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard title="Total Team" value={summary.total} icon={<Users size={16} />} tone="default" />
        <SummaryCard title="Active Employees" value={summary.active} icon={<CheckCircle2 size={16} />} tone="success" />
        <SummaryCard title="In-House" value={summary.inHouse} icon={<Briefcase size={16} />} tone="info" />
        <SummaryCard title="Freelancers" value={summary.freelancers} icon={<Wrench size={16} />} tone="warning" />
        <SummaryCard title="Managers" value={summary.managers} icon={<Shield size={16} />} tone="primary" />
      </div>

      <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4">
        <div className="grid gap-2 lg:grid-cols-[1fr_1fr_repeat(4,minmax(0,170px))]">
          <Input value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} placeholder="Search by name" leftIcon={<Search size={14} />} />
          <Input value={employeeIdSearch} onChange={(e) => setEmployeeIdSearch(e.target.value)} placeholder="Filter by Employee ID" leftIcon={<UserCog size={14} />} />
          <FilterSelect value={roleFilter} onChange={setRoleFilter} options={roleFilterOptions.map((role) => ({ value: role, label: role === 'all' ? 'All Roles' : getRoleOptionByKey(role as DirectoryRoleKey).label }))} />
          <FilterSelect value={employmentFilter} onChange={(value) => setEmploymentFilter(value as 'all' | EmploymentType)} options={[{ value: 'all', label: 'All Types' }, { value: 'in_house', label: 'In-House' }, { value: 'freelancer', label: 'Freelancer' }, { value: 'vendor', label: 'Vendor' }, { value: 'intern', label: 'Intern' }]} />
          <FilterSelect value={statusFilter} onChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')} options={[{ value: 'all', label: 'All Statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          <FilterSelect value={loginFilter} onChange={(value) => setLoginFilter(value as 'all' | 'enabled' | 'disabled')} options={[{ value: 'all', label: 'Login Any' }, { value: 'enabled', label: 'Login Enabled' }, { value: 'disabled', label: 'Login Disabled' }]} />
        </div>
      </div>

      {selectedEmployee ? (
        <EmployeeDetailsPage
          employee={selectedEmployee}
          tab={detailsTab}
          onTabChange={setDetailsTab}
          assignments={employeeAssignments}
          isAssignmentsLoading={isAssignmentsLoading}
          onBack={() => {
            setSelectedEmployee(null)
            setDetailsTab('overview')
          }}
          activityFeed={activityFeed}
          equipmentItems={equipmentItems}
          documentItems={documentItems}
          onEdit={() => openEditModal(selectedEmployee)}
          onDisableEmployee={() => setEmployeeStatus(selectedEmployee, false)}
          onReactivateEmployee={() => setEmployeeStatus(selectedEmployee, true)}
          onDisableLogin={() => setLoginEnabled(selectedEmployee, false)}
          onEnableLogin={() => setLoginEnabled(selectedEmployee, true)}
          onResetPassword={() => handleResetPassword(selectedEmployee)}
          onSendInvitation={() => handleSendInvitation(selectedEmployee)}
          onDelete={canDeleteEmployees ? () => setDeleteTarget(selectedEmployee) : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-0 overflow-hidden">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="p-10 text-center text-sm text-[var(--color-text-secondary)]">No team members match the current filters.</div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Employee</th>
                      <th className="px-4 py-3 text-left font-semibold">Workspace Role</th>
                      <th className="px-4 py-3 text-left font-semibold">Employment</th>
                      <th className="px-4 py-3 text-left font-semibold">Contact</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Login</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((member) => {
                      const isEmployeeActive = member.account_status === 'active'
                      const isLoginEnabled = Boolean(member.login_enabled)
                      return (
                        <tr key={member.id} className="border-t border-[var(--color-border-subtle)]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={member.employee_name} src={member.profile_photo} size="sm" />
                              <div>
                                <p className="font-semibold text-[var(--color-text-primary)]">{member.employee_name}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">{member.employee_id} • @{member.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[var(--color-text-primary)]">{getRoleOptionByKey(mapWorkspaceRoleToDirectoryRole(member.workspace_role || member.role_id)).label}</td>
                          <td className="px-4 py-3 text-[var(--color-text-secondary)]">{prettyRole(member.employment_type || member.team_type)}</td>
                          <td className="px-4 py-3">
                            <p className="text-[var(--color-text-primary)]">{member.email}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{member.mobile}</p>
                          </td>
                          <td className="px-4 py-3"><Badge variant={isEmployeeActive ? 'success' : 'warning'}>{isEmployeeActive ? 'Active' : 'Inactive'}</Badge></td>
                          <td className="px-4 py-3"><Badge variant={isLoginEnabled ? 'info' : 'default'}>{isLoginEnabled ? 'Enabled' : 'Disabled'}</Badge></td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedEmployee(member)}>Details</Button>
                              <Button variant="secondary" size="sm" onClick={() => openEditModal(member)}>Edit</Button>
                              <Button variant="outline" size="sm" onClick={() => setEmployeeStatus(member, !isEmployeeActive)}>{isEmployeeActive ? 'Disable' : 'Reactivate'}</Button>
                              <Button variant="outline" size="sm" onClick={() => setLoginEnabled(member, !isLoginEnabled)}>{isLoginEnabled ? 'Disable Login' : 'Enable Login'}</Button>
                              <Button variant="secondary" size="sm" leftIcon={<KeyRound size={12} />} onClick={() => handleResetPassword(member)}>Reset Password</Button>
                              <Button variant="secondary" size="sm" leftIcon={<Send size={12} />} onClick={() => handleSendInvitation(member)}>Invite</Button>
                              <Button variant="danger" size="sm" leftIcon={<Trash2 size={12} />} onClick={() => setDeleteTarget(member)} disabled={!canDeleteEmployees}>Delete</Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-3 lg:hidden">
                {filteredAccounts.map((member) => {
                  const isEmployeeActive = member.account_status === 'active'
                  const isLoginEnabled = Boolean(member.login_enabled)
                  return (
                    <div key={member.id} className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={member.employee_name} src={member.profile_photo} size="sm" />
                          <div>
                            <p className="font-semibold text-[var(--color-text-primary)]">{member.employee_name}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{member.employee_id} • @{member.username}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={isEmployeeActive ? 'success' : 'warning'}>{isEmployeeActive ? 'Active' : 'Inactive'}</Badge>
                          <Badge variant={isLoginEnabled ? 'info' : 'default'}>{isLoginEnabled ? 'Login On' : 'Login Off'}</Badge>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-[var(--color-text-secondary)]">
                        <p>{getRoleOptionByKey(mapWorkspaceRoleToDirectoryRole(member.workspace_role || member.role_id)).label} • {prettyRole(member.employment_type || member.team_type)}</p>
                        <p>{member.email}</p>
                        <p>{member.mobile}</p>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedEmployee(member)}>Details</Button>
                        <Button variant="secondary" size="sm" onClick={() => openEditModal(member)}>Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => setEmployeeStatus(member, !isEmployeeActive)}>{isEmployeeActive ? 'Disable' : 'Reactivate'}</Button>
                        <Button variant="outline" size="sm" onClick={() => setLoginEnabled(member, !isLoginEnabled)}>{isLoginEnabled ? 'Disable Login' : 'Enable Login'}</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleResetPassword(member)}>Reset Password</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleSendInvitation(member)}>Invite</Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(member)} disabled={!canDeleteEmployees}>Delete</Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      <AddTeamMemberWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSaved={loadEmployees}
      />

      <Modal
        isOpen={Boolean(editingEmployee)}
        onClose={() => setEditingEmployee(null)}
        title={`Edit Employee • ${editingEmployee?.employee_name || ''}`}
        description="Update core employee profile, role, login requirement, and permissions."
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingEmployee(null)} disabled={isEditSaving}>Cancel</Button>
            <Button onClick={handleEditMemberSave} isLoading={isEditSaving}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Employee ID" value={editForm.employeeId} onChange={(e) => setEditForm((p) => ({ ...p, employeeId: e.target.value }))} />
            <Input label="Employee Name" value={editForm.employeeName} onChange={(e) => setEditForm((p) => ({ ...p, employeeName: e.target.value }))} />
            <Input label="Primary Email" value={editForm.primaryEmail} onChange={(e) => setEditForm((p) => ({ ...p, primaryEmail: e.target.value }))} />
            <Input label="Mobile" value={editForm.mobile} onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))} />
            <Input label="Username" value={editForm.username} onChange={(e) => setEditForm((p) => ({ ...p, username: e.target.value }))} />
            <Input label="Department" value={editForm.department} onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Workspace Role</label>
              <select value={editForm.roleKey} onChange={(e) => setEditForm((p) => ({ ...p, roleKey: e.target.value as DirectoryRoleKey, moduleAccess: { ...getDefaultModuleAccessForWorkspaceRole(mapDirectoryRoleToWorkspaceRole(e.target.value as DirectoryRoleKey)) } }))} className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-input)] px-3 text-sm">
                {DIRECTORY_ROLE_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Employment Type</label>
              <select value={editForm.employmentType} onChange={(e) => setEditForm((p) => ({ ...p, employmentType: e.target.value as EmploymentType }))} className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-input)] px-3 text-sm">
                <option value="in_house">In-House</option>
                <option value="freelancer">Freelancer</option>
                <option value="vendor">Vendor</option>
                <option value="intern">Intern</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editForm.loginRequired} onChange={(e) => setEditForm((p) => ({ ...p, loginRequired: e.target.checked }))} className="size-4 accent-[var(--color-primary)]" />
              Login Required = {editForm.loginRequired ? 'Yes' : 'No'}
            </label>
            <Input label="Login Email" value={editForm.loginEmail} onChange={(e) => setEditForm((p) => ({ ...p, loginEmail: e.target.value }))} disabled={!editForm.loginRequired} />
          </div>

          <Input label="Specializations" value={editForm.specializations} onChange={(e) => setEditForm((p) => ({ ...p, specializations: e.target.value }))} hint="Comma separated." />

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {MODULE_KEYS.map((moduleKey) => (
              <label key={moduleKey} className="flex items-center justify-between rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-2 text-sm">
                <span>{prettyRole(moduleKey)}</span>
                <input type="checkbox" checked={Boolean(editForm.moduleAccess[moduleKey])} onChange={(e) => setEditForm((prev) => ({ ...prev, moduleAccess: { ...prev.moduleAccess, [moduleKey]: e.target.checked } }))} className="size-4 accent-[var(--color-primary)]" />
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteMember}
        title="Delete Employee"
        description={canDeleteEmployees ? `This will permanently remove ${deleteTarget?.employee_name || 'this employee'} from Team Directory.` : 'Only Owner/Admin can delete employees.'}
        confirmLabel="Delete"
        isDestructive
        isLoading={isDeleteLoading}
      />

      <Modal
        isOpen={Boolean(latestPasswordReset)}
        onClose={() => setLatestPasswordReset(null)}
        title="Temporary Password Generated"
        description="Share this password securely. User will be asked to change it on first login."
        size="md"
        footer={<Button onClick={() => setLatestPasswordReset(null)}>Done</Button>}
      >
        <div className="space-y-2 text-sm">
          <p className="text-[var(--color-text-secondary)]">User: <span className="font-medium text-[var(--color-text-primary)]">{latestPasswordReset?.userName}</span></p>
          <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-3 font-mono text-[var(--color-text-primary)]">{latestPasswordReset?.password}</div>
        </div>
      </Modal>
    </div>
  )
}

function SummaryCard({ title, value, icon, tone }: { title: string; value: number; icon: React.ReactNode; tone: 'default' | 'success' | 'warning' | 'info' | 'primary' }) {
  const toneCls = {
    default: 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border-[var(--color-border-default)]',
    success: 'bg-[var(--color-success-light)] text-[var(--color-success)] border-transparent',
    warning: 'bg-[var(--color-warning-light)] text-[var(--color-warning)] border-transparent',
    info: 'bg-[var(--color-info-light)] text-[var(--color-info)] border-transparent',
    primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-transparent',
  } as const

  return (
    <div className={cn('rounded-xl border p-4', toneCls[tone])}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide">{title}</p>
        <div className="opacity-90">{icon}</div>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-input)] px-2">
      <Filter size={13} className="text-[var(--color-text-muted)]" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 bg-transparent pr-2 text-sm text-[var(--color-text-primary)] focus:outline-none">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  )
}

function EmployeeDetailsPage({
  employee,
  tab,
  onTabChange,
  assignments,
  isAssignmentsLoading,
  onBack,
  activityFeed,
  equipmentItems,
  documentItems,
  onEdit,
  onDisableEmployee,
  onReactivateEmployee,
  onDisableLogin,
  onEnableLogin,
  onResetPassword,
  onSendInvitation,
  onDelete,
}: {
  employee: UserAccount
  tab: DetailsTabId
  onTabChange: (tab: DetailsTabId) => void
  assignments: EmployeeAssignmentSnapshot[]
  isAssignmentsLoading: boolean
  onBack: () => void
  activityFeed: { id: string; label: string; date: string }[]
  equipmentItems: { id: string; name: string; status: string }[]
  documentItems: { id: string; title: string; type: string }[]
  onEdit: () => void
  onDisableEmployee: () => void
  onReactivateEmployee: () => void
  onDisableLogin: () => void
  onEnableLogin: () => void
  onResetPassword: () => void
  onSendInvitation: () => void
  onDelete?: () => void
}) {
  const isEmployeeActive = employee.account_status === 'active'
  const isLoginEnabled = Boolean(employee.login_enabled)

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={onBack}>Back</Button>
          <Avatar name={employee.employee_name} src={employee.profile_photo} size="lg" />
          <div>
            <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">{employee.employee_name}</h4>
            <p className="text-sm text-[var(--color-text-secondary)]">{getRoleOptionByKey(mapWorkspaceRoleToDirectoryRole(employee.workspace_role || employee.role_id)).label} • {prettyRole(employee.employment_type || employee.team_type)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isEmployeeActive ? 'success' : 'warning'}>{isEmployeeActive ? 'Active' : 'Inactive'}</Badge>
          <Badge variant={isLoginEnabled ? 'info' : 'default'}>{isLoginEnabled ? 'Login Enabled' : 'Login Disabled'}</Badge>
          <Button variant="secondary" size="sm" onClick={onEdit}>Edit Employee</Button>
          <Button variant="outline" size="sm" onClick={isEmployeeActive ? onDisableEmployee : onReactivateEmployee}>{isEmployeeActive ? 'Disable Employee' : 'Reactivate Employee'}</Button>
          <Button variant="outline" size="sm" onClick={isLoginEnabled ? onDisableLogin : onEnableLogin}>{isLoginEnabled ? 'Disable Login' : 'Enable Login'}</Button>
          <Button variant="secondary" size="sm" leftIcon={<KeyRound size={12} />} onClick={onResetPassword}>Reset Password</Button>
          <Button variant="secondary" size="sm" leftIcon={<Send size={12} />} onClick={onSendInvitation}>Send Invitation</Button>
          {onDelete && <Button variant="danger" size="sm" leftIcon={<Trash2 size={12} />} onClick={onDelete}>Delete Employee</Button>}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {DETAILS_TABS.map((item) => (
          <Button key={item.id} size="sm" variant={tab === item.id ? 'primary' : 'secondary'} onClick={() => onTabChange(item.id)}>{item.label}</Button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-3 md:grid-cols-2">
          <InfoTile icon={<Mail size={14} />} label="Email" value={employee.email} />
          <InfoTile icon={<Phone size={14} />} label="Phone" value={employee.mobile} />
          <InfoTile icon={<Users size={14} />} label="Employee ID" value={employee.employee_id} />
          <InfoTile icon={<Shield size={14} />} label="System Role" value={prettyRole(employee.system_role)} />
          <InfoTile icon={<Briefcase size={14} />} label="Department" value={employee.department || 'General'} />
          <InfoTile icon={<ClipboardList size={14} />} label="Specializations" value={(employee.specializations || []).join(', ') || 'General Staff'} />
        </div>
      )}

      {tab === 'assignments' && (
        <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
          {isAssignmentsLoading ? (
            <div className="space-y-2 p-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
          ) : assignments.length === 0 ? (
            <div className="p-5 text-sm text-[var(--color-text-secondary)]">No assignments found for this employee.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--color-bg-elevated)]">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--color-text-secondary)]">Work Order</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--color-text-secondary)]">Service</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--color-text-secondary)]">Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--color-text-secondary)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-t border-[var(--color-border-subtle)]">
                    <td className="px-3 py-2">{assignment.work_order_number || assignment.work_order_id || 'N/A'}</td>
                    <td className="px-3 py-2">{assignment.service_name || assignment.task_type || 'Task'}</td>
                    <td className="px-3 py-2">{assignment.event_date || 'TBD'}</td>
                    <td className="px-3 py-2"><Badge variant="info">{assignment.status || 'assigned'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'calendar' && (
        <div className="space-y-2">
          {assignments.filter((a) => a.event_date).length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border-default)] p-5 text-sm text-[var(--color-text-secondary)]">No calendar events available.</div>
          ) : (
            assignments.filter((a) => a.event_date).sort((a, b) => String(a.event_date).localeCompare(String(b.event_date))).map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between rounded-xl border border-[var(--color-border-default)] p-3">
                <div className="flex items-center gap-2">
                  <CalendarDays size={15} className="text-[var(--color-primary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{assignment.service_name || assignment.task_type}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{assignment.work_order_number || assignment.work_order_id}</p>
                  </div>
                </div>
                <Badge variant="primary">{assignment.event_date}</Badge>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'permissions' && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(employee.module_access || {}).map(([moduleName, allowed]) => (
            <div key={moduleName} className="flex items-center justify-between rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 py-2">
              <span className="text-sm text-[var(--color-text-primary)]">{prettyRole(moduleName)}</span>
              <Badge variant={allowed ? 'success' : 'default'}>{allowed ? 'Enabled' : 'Disabled'}</Badge>
            </div>
          ))}
        </div>
      )}

      {tab === 'equipment' && (
        <div className="space-y-2">
          {equipmentItems.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border-default)] p-5 text-sm text-[var(--color-text-secondary)]">No equipment records mapped to this employee.</div>
          ) : (
            equipmentItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-[var(--color-border-default)] p-3">
                <span className="text-sm text-[var(--color-text-primary)]">{item.name}</span>
                <Badge variant="info">{item.status}</Badge>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'documents' && (
        <div className="space-y-2">
          {documentItems.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border-default)] p-5 text-sm text-[var(--color-text-secondary)]">No document records available for this employee.</div>
          ) : (
            documentItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-[var(--color-border-default)] p-3">
                <span className="text-sm text-[var(--color-text-primary)]">{item.title}</span>
                <Badge variant="default">{item.type}</Badge>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div className="space-y-2">
          {activityFeed.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border-default)] p-5 text-sm text-[var(--color-text-secondary)]">No activity records available.</div>
          ) : (
            activityFeed.map((item) => (
              <div key={item.id} className="rounded-xl border border-[var(--color-border-default)] p-3">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{toDateLabel(item.date)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-3">
      <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5">{icon}{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">{value || 'N/A'}</p>
    </div>
  )
}
