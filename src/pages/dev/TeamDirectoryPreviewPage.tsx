import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, RefreshCw, ShieldCheck, UserPlus, Wrench } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  createEmployeeInCloud,
  fetchAllEmployeesFromCloud,
  generateEmployeeIdFromCloud,
  getDefaultModuleAccessForWorkspaceRole,
  subscribeToEmployeeRealtimeChanges,
} from '@/services/employeeService'
import { cn } from '@/utils/cn'
import type { WorkspaceRole, UserAccount } from '@/types/teamLogin'
import {
  TeamDirectoryStandalone,
  type TeamDirectoryMember,
} from '@/components/settings/TeamDirectoryStandalone'

const ROLE_OPTIONS: WorkspaceRole[] = [
  'owner',
  'administrator',
  'manager',
  'photographer',
  'videographer',
  'photo_editor',
  'video_editor',
  'album_designer',
  'data_operator',
  'finance',
  'sales_executive',
  'client_manager',
]

interface AddMemberForm {
  employeeId: string
  loginRequired: boolean
  loginEmail: string
  loginPassword: string
  employeeName: string
  primaryEmail: string
  email: string
  mobile: string
  department: string
  username: string
  role: WorkspaceRole
  employmentType: 'in_house' | 'freelancer'
  specializations: string
  notes: string
}

type WizardStepId = 'engagement' | 'login' | 'contact' | 'workspace' | 'details' | 'review'

const WIZARD_STEPS: { id: WizardStepId; label: string }[] = [
  { id: 'engagement', label: 'Engagement' },
  { id: 'login', label: 'Login' },
  { id: 'contact', label: 'Contact' },
  { id: 'workspace', label: 'Workspace Role' },
  { id: 'details', label: 'Details' },
  { id: 'review', label: 'Review' },
]

const INITIAL_FORM: AddMemberForm = {
  employeeId: '',
  loginRequired: true,
  loginEmail: '',
  loginPassword: '',
  employeeName: '',
  primaryEmail: '',
  email: '',
  mobile: '',
  department: 'Production',
  username: '',
  role: 'photographer',
  employmentType: 'in_house',
  specializations: '',
  notes: '',
}

function toDirectoryMembers(accounts: UserAccount[]): TeamDirectoryMember[] {
  return accounts.map((a) => ({
    id: a.id,
    fullName: a.employee_name || a.full_name || 'Staff Member',
    email: a.email,
    phone: a.mobile || a.mobile_number || 'N/A',
    department: a.department || 'General',
    roleTitle: a.role_name || a.workspace_role || a.role_id || 'Staff',
    employmentType: (a.employment_type || a.team_type || 'in_house') as 'in_house' | 'freelancer',
    availability: a.account_status === 'active' ? 'available' : 'inactive',
    location: a.tenant_id || 'studio_main',
    avatarUrl: a.profile_photo,
    tags: a.job_roles && a.job_roles.length > 0 ? a.job_roles : ['General Staff'],
  }))
}

export default function TeamDirectoryPreviewPage() {
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [form, setForm] = useState<AddMemberForm>(INITIAL_FORM)

  const directoryMembers = useMemo(() => toDirectoryMembers(accounts), [accounts])

  const loadEmployees = async () => {
    setIsRefreshing(true)
    try {
      const data = await fetchAllEmployeesFromCloud()
      setAccounts(data)
    } catch (error) {
      console.error('Failed to load employees for Team Directory preview:', error)
      toast.error('Failed to load team directory data from Supabase.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const currentStep = WIZARD_STEPS[activeStepIndex]

  const openWizard = async () => {
    try {
      const generatedId = await generateEmployeeIdFromCloud()
      setForm({
        ...INITIAL_FORM,
        employeeId: generatedId,
      })
    } catch {
      setForm({
        ...INITIAL_FORM,
        employeeId: `EMP-${Date.now().toString().slice(-6)}`,
      })
    }
    setActiveStepIndex(0)
    setIsCreateOpen(true)
  }

  const parseSpecializations = (value: string): string[] => {
    const list = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    return list.length > 0 ? list : ['General Staff']
  }

  const validateStep = (stepId: WizardStepId): boolean => {
    if (stepId === 'engagement') {
      return Boolean(form.employmentType)
    }
    if (stepId === 'login') {
      if (!form.loginRequired) return true
      if (!form.loginEmail.trim()) {
        toast.error('Login email is required when Login Required is Yes.')
        return false
      }
      if (form.loginPassword.trim().length < 8) {
        toast.error('Login password must be at least 8 characters.')
        return false
      }
      return true
    }
    if (stepId === 'contact') {
      if (!form.employeeName.trim()) {
        toast.error('Employee name is required.')
        return false
      }
      if (!form.primaryEmail.trim()) {
        toast.error('Primary email is required.')
        return false
      }
      if (!form.mobile.trim()) {
        toast.error('Mobile number is required.')
        return false
      }
      return true
    }
    if (stepId === 'workspace') {
      if (!form.role) {
        toast.error('Workspace role is required.')
        return false
      }
      return true
    }
    return true
  }

  const handleNextStep = () => {
    if (!validateStep(currentStep.id)) return
    setActiveStepIndex((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1))
  }

  const handlePreviousStep = () => {
    setActiveStepIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleExportCsv = () => {
    if (accounts.length === 0) {
      toast.error('No employee records available to export.')
      return
    }

    const headers = ['Employee ID', 'Name', 'Email', 'Mobile', 'Department', 'Workspace Role', 'Employment Type', 'Account Status', 'Login Enabled']
    const rows = accounts.map((a) => [
      a.employee_id,
      a.employee_name,
      a.email,
      a.mobile,
      a.department,
      a.workspace_role,
      a.employment_type,
      a.account_status,
      String(a.login_enabled),
    ])

    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `team-directory-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('CSV export completed.')
  }

  useEffect(() => {
    loadEmployees()

    const unsubscribe = subscribeToEmployeeRealtimeChanges((live) => {
      setAccounts(live)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isCreating) return
    const finalStepValid = validateStep('engagement') && validateStep('login') && validateStep('contact') && validateStep('workspace')
    if (!finalStepValid) {
      return
    }

    if (!form.employeeId.trim()) {
      toast.error('Employee ID is required.')
      return
    }

    const resolvedLoginEmail = form.loginRequired ? form.loginEmail.trim().toLowerCase() : form.primaryEmail.trim().toLowerCase()
    const resolvedUsername = form.username.trim() || resolvedLoginEmail.split('@')[0]
    const specializations = parseSpecializations(form.specializations)

    setIsCreating(true)
    try {
      await createEmployeeInCloud({
        employee_id: form.employeeId.trim(),
        employee_name: form.employeeName.trim(),
        profile_photo: '',
        department: form.department.trim() || 'General',
        username: resolvedUsername,
        email: resolvedLoginEmail,
        mobile: form.mobile.trim(),
        password_hash: form.loginRequired ? form.loginPassword.trim() : '',
        role_id: form.role,
        role_name: form.role.replace('_', ' ').toUpperCase(),
        workspace_role: form.role,
        employment_type: form.employmentType,
        specializations,
        tenant_id: 'studio_main',
        system_role:
          form.role === 'owner' || form.role === 'administrator'
            ? 'admin'
            : form.role === 'manager'
              ? 'manager'
              : 'staff',
        team_type: form.employmentType,
        job_roles: specializations,
        module_access: getDefaultModuleAccessForWorkspaceRole(form.role),
        auth_user_id: undefined,
        account_status: 'active',
        login_enabled: form.loginRequired,
        plain_temp_password: form.loginRequired ? form.loginPassword.trim() : undefined,
      }, 'Administrator', {
        loginRequired: form.loginRequired,
        authPassword: form.loginRequired ? form.loginPassword.trim() : undefined,
        skipLocalAudit: true,
      })

      toast.success('Team member created in Supabase.')
      setForm(INITIAL_FORM)
      setActiveStepIndex(0)
      setIsCreateOpen(false)
      await loadEmployees()
    } catch (error) {
      console.error('Failed to create team member in preview:', error)
      const message = error instanceof Error ? error.message : 'Failed to save member to Supabase.'
      if (message.startsWith('EMPLOYEE_DUPLICATE_EMAIL')) {
        toast.error('Duplicate email detected. Please use a unique email.')
      } else if (message.startsWith('EMPLOYEE_DUPLICATE_ID')) {
        toast.error('Duplicate employee ID detected. Please regenerate and try again.')
      } else if (message.startsWith('EMPLOYEE_AUTH_CREATE_FAILED')) {
        toast.error('Supabase Auth user creation failed. Employee record was not created.')
      } else {
        toast.error('Failed to save member to Supabase.')
      }
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-xs text-gray-500">
          Loading Team Directory preview from Supabase...
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-sm font-extrabold flex items-center gap-2">
              <Wrench size={14} /> DEV Preview: Team Directory
            </h1>
            <p className="mt-1 text-xs font-medium">
              This route is development-only and isolated. Existing Team Login Access remains the production page.
            </p>
          </div>
          <button
            type="button"
            onClick={loadEmployees}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
          >
            <RefreshCw size={13} className={cn(isRefreshing && 'animate-spin')} /> Refresh
          </button>
        </div>
      </div>

      <TeamDirectoryStandalone
        members={directoryMembers}
        onRequestCreate={openWizard}
        onRequestExportCsv={handleExportCsv}
        onRequestInviteUser={() => toast('Coming in Sprint X: Invite User workflow')}
        onRequestOpenProfile={() => {
          toast('Coming in Sprint X: profile drawer')
        }}
      />

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
        <h2 className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-[#5B3FD9]" /> Preview Scope & Pending Features
        </h2>
        <ul className="mt-2 space-y-1.5 text-xs text-gray-600">
          <li className="flex items-center gap-1.5"><AlertCircle size={12} /> Edit Member: Coming in Sprint X</li>
          <li className="flex items-center gap-1.5"><AlertCircle size={12} /> Delete Member: Coming in Sprint X</li>
          <li className="flex items-center gap-1.5"><AlertCircle size={12} /> Bulk Import: Coming in Sprint X</li>
          <li className="flex items-center gap-1.5"><AlertCircle size={12} /> Advanced Role Matrix merge: Coming in Sprint X</li>
        </ul>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                <UserPlus size={14} className="text-[#5B3FD9]" /> Add Team Member (Supabase)
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {WIZARD_STEPS.map((step, idx) => {
                const isActive = idx === activeStepIndex
                const isDone = idx < activeStepIndex
                return (
                  <div
                    key={step.id}
                    className={cn(
                      'rounded-lg border px-2 py-1.5 text-[11px] font-bold text-center',
                      isActive && 'border-[#5B3FD9] bg-purple-50 text-[#5B3FD9]',
                      isDone && 'border-emerald-300 bg-emerald-50 text-emerald-700',
                      !isActive && !isDone && 'border-gray-200 bg-gray-50 text-gray-500'
                    )}
                  >
                    {idx + 1}. {step.label}
                  </div>
                )
              })}
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              {currentStep.id === 'engagement' && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-600">Employment Type</span>
                    <select
                      value={form.employmentType}
                      onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value as 'in_house' | 'freelancer' }))}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-700 focus:border-[#5B3FD9] focus:outline-none"
                    >
                      <option value="in_house">Staff (In-House)</option>
                      <option value="freelancer">Freelancer</option>
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-600">Login Required</span>
                    <select
                      value={form.loginRequired ? 'yes' : 'no'}
                      onChange={(e) => setForm((p) => ({ ...p, loginRequired: e.target.value === 'yes' }))}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-700 focus:border-[#5B3FD9] focus:outline-none"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                </div>
              )}

              {currentStep.id === 'login' && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-[11px] font-bold text-gray-600">Username (optional)</span>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                      placeholder="Auto-generated from email if left blank"
                      className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium focus:border-[#5B3FD9] focus:bg-white focus:outline-none"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-600">Login Email</span>
                    <input
                      type="email"
                      value={form.loginEmail}
                      onChange={(e) => setForm((p) => ({ ...p, loginEmail: e.target.value }))}
                      disabled={!form.loginRequired}
                      placeholder={form.loginRequired ? 'login@studio.com' : 'Disabled (Login Required = No)'}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium focus:border-[#5B3FD9] focus:bg-white focus:outline-none disabled:opacity-60"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-600">Temporary Password</span>
                    <input
                      type="password"
                      value={form.loginPassword}
                      onChange={(e) => setForm((p) => ({ ...p, loginPassword: e.target.value }))}
                      disabled={!form.loginRequired}
                      placeholder={form.loginRequired ? 'Minimum 8 characters' : 'Disabled (Login Required = No)'}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium focus:border-[#5B3FD9] focus:bg-white focus:outline-none disabled:opacity-60"
                    />
                  </label>
                </div>
              )}

              {currentStep.id === 'contact' && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    type="text"
                    value={form.employeeName}
                    onChange={(e) => setForm((p) => ({ ...p, employeeName: e.target.value }))}
                    placeholder="Full Name *"
                    className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium focus:border-[#5B3FD9] focus:bg-white focus:outline-none"
                  />
                  <input
                    type="email"
                    value={form.primaryEmail}
                    onChange={(e) => setForm((p) => {
                      const nextEmail = e.target.value
                      return {
                        ...p,
                        primaryEmail: nextEmail,
                        loginEmail: p.loginEmail || nextEmail,
                      }
                    })}
                    placeholder="Primary Email *"
                    className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium focus:border-[#5B3FD9] focus:bg-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={form.mobile}
                    onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
                    placeholder="Mobile *"
                    className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium focus:border-[#5B3FD9] focus:bg-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                    placeholder="Department"
                    className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium focus:border-[#5B3FD9] focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              {currentStep.id === 'workspace' && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-[11px] font-bold text-gray-600">Workspace Role</span>
                    <select
                      value={form.role}
                      onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as WorkspaceRole }))}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-700 focus:border-[#5B3FD9] focus:outline-none"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{role.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {currentStep.id === 'details' && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-600">Employee ID</span>
                    <input
                      type="text"
                      value={form.employeeId}
                      onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium focus:border-[#5B3FD9] focus:bg-white focus:outline-none"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-600">Specializations (comma-separated)</span>
                    <input
                      type="text"
                      value={form.specializations}
                      onChange={(e) => setForm((p) => ({ ...p, specializations: e.target.value }))}
                      placeholder="Wedding, Candid, Drone"
                      className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium focus:border-[#5B3FD9] focus:bg-white focus:outline-none"
                    />
                  </label>

                  <label className="space-y-1 md:col-span-2">
                    <span className="text-[11px] font-bold text-gray-600">Notes</span>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Coming in Sprint X: full notes persistence and activity timeline"
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium focus:border-[#5B3FD9] focus:bg-white focus:outline-none"
                    />
                  </label>
                </div>
              )}

              {currentStep.id === 'review' && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 space-y-2">
                  <p className="font-bold text-gray-900">Review Submission</p>
                  <p><strong>Employee:</strong> {form.employeeName || '-'}</p>
                  <p><strong>Employee ID:</strong> {form.employeeId || '-'}</p>
                  <p><strong>Email:</strong> {(form.loginRequired ? form.loginEmail : form.primaryEmail) || '-'}</p>
                  <p><strong>Mobile:</strong> {form.mobile || '-'}</p>
                  <p><strong>Workspace Role:</strong> {form.role.replace('_', ' ')}</p>
                  <p><strong>Employment:</strong> {form.employmentType === 'in_house' ? 'Staff (In-House)' : 'Freelancer'}</p>
                  <p><strong>Login Required:</strong> {form.loginRequired ? 'Yes' : 'No'}</p>
                  {form.loginRequired && <p><strong>Auth Account:</strong> Will be created in Supabase Auth and linked to employee profile.</p>}
                  {!form.loginRequired && <p><strong>Auth Account:</strong> Not created (as requested).</p>}
                </div>
              )}

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-800">
                This wizard writes directly to Supabase through EmployeeService. No mock data and no localStorage persistence are used in this preview page.
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700"
                >
                  Cancel
                </button>
                {activeStepIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700"
                  >
                    <ArrowLeft size={13} /> Previous
                  </button>
                )}
                {activeStepIndex < WIZARD_STEPS.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#5B3FD9] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#4C34C3]"
                  >
                    Next <ArrowRight size={13} />
                  </button>
                )}
                {activeStepIndex === WIZARD_STEPS.length - 1 && (
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <CheckCircle2 size={13} /> {isCreating ? 'Saving...' : 'Create Member'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
