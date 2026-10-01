import { useState, useEffect } from 'react'
import {
  X,
  UserCheck,
  UserX,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Phone,
  Mail,
  User,
  CreditCard,
  MapPin,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react'
import {
  createEmployeeInCloud,
  generateEmployeeIdFromCloud,
  getDefaultModuleAccessForWorkspaceRole,
} from '@/services/employeeService'
import type { WorkspaceRole, EmploymentType } from '@/types/teamLogin'
import { loadAllRoleConfigs } from '@/services/permissionService'
import { setEmployeeWorkRoles } from '@/services/employeeWorkRolesService'
import { toast } from 'react-hot-toast'

export type EngagementType = 'in_house' | 'freelancer'
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave'
export type PaymentType =
  | 'Monthly Salary'
  | 'Freelancer'
  | 'Commission Based'
  | 'Per Shoot'
  | 'Hourly'
  | 'Intern'
export type PaymentStatus = 'Active' | 'Inactive' | 'Hold' | 'Pending'
export type EmployeeType =
  | 'Team Member'
  | 'Manager'
  | 'Administrator'
  | 'Intern'
  | 'Vendor'
  | 'Freelancer'

export interface WorkspaceRoleOption {
  title: string
  key: WorkspaceRole
  department: string
}

export const WORKSPACE_ROLE_OPTIONS: WorkspaceRoleOption[] = [
  { title: 'Owner', key: 'owner', department: 'Executive' },
  { title: 'Administrator', key: 'administrator', department: 'Administration' },
  { title: 'Manager', key: 'manager', department: 'Management' },
  { title: 'Operations Manager', key: 'manager', department: 'Operations' },
  { title: 'Sales', key: 'sales_executive', department: 'Sales' },
  { title: 'Client Coordinator', key: 'client_manager', department: 'Customer Success' },
  { title: 'Traditional Photographer', key: 'photographer', department: 'Photography' },
  { title: 'Candid Photographer', key: 'photographer', department: 'Photography' },
  { title: 'Photographer', key: 'photographer', department: 'Photography' },
  { title: 'Traditional Videographer', key: 'videographer', department: 'Cinematography' },
  { title: 'Videographer', key: 'videographer', department: 'Cinematography' },
  { title: 'Cinematographer', key: 'videographer', department: 'Cinematography' },
  { title: 'Drone Pilot', key: 'videographer', department: 'Aerial' },
  { title: 'Photo Editor', key: 'photo_editor', department: 'Post Production' },
  { title: 'Image Editor', key: 'photo_editor', department: 'Post Production' },
  { title: 'Video Editor', key: 'video_editor', department: 'Post Production' },
  { title: 'Album Designer', key: 'album_designer', department: 'Post Production' },
  { title: 'Lighting Technician', key: 'data_operator', department: 'Technical' },
  { title: 'Data Manager', key: 'data_operator', department: 'Data Management' },
  { title: 'LED Display', key: 'data_operator', department: 'Technical' },
  { title: 'Spot Mixing', key: 'video_editor', department: 'Technical' },
]

export interface AddTeamMemberWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export function AddTeamMemberWizardModal({
  isOpen,
  onClose,
  onSaved,
}: AddTeamMemberWizardModalProps) {
  const [step, setStep] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [engagement, setEngagement] = useState<EngagementType>('in_house')
  const [hasLogin, setHasLogin] = useState<boolean>(true)

  // Step 3: Contact
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [altPhone, setAltPhone] = useState('')
  const [password, setPassword] = useState('')

  // Step 4: Type & Role
  const [employeeType, setEmployeeType] = useState<EmployeeType>('Team Member')
  const [status, setStatus] = useState<EmployeeStatus>('active')
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole>('photographer')
  const [selectedWorkRoleIds, setSelectedWorkRoleIds] = useState<Set<string>>(new Set(['photographer']))
  const [workRoleSearch, setWorkRoleSearch] = useState('')

  // Step 5: Details
  const [address, setAddress] = useState('')
  const [paymentType, setPaymentType] = useState<PaymentType>('Monthly Salary')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Active')
  const [notes, setNotes] = useState('')

  // Auto set defaults on open
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setEngagement('in_house')
      setHasLogin(true)
      setFullName('')
      setPhone('')
      setEmail('')
      setAltPhone('')
      setPassword('')
      setEmployeeType('Team Member')
      setStatus('active')
      setWorkspaceRole('photographer')
      setSelectedWorkRoleIds(new Set(['photographer']))
      setAddress('')
      setPaymentType('Monthly Salary')
      setPaymentStatus('Active')
      setNotes('')
    }
  }, [isOpen])

  if (!isOpen) return null

  // Current Role Option
  const currentRoleObj =
    WORKSPACE_ROLE_OPTIONS.find((r) => r.key === workspaceRole) ||
    WORKSPACE_ROLE_OPTIONS[6]

  // Step Validation
  const validateCurrentStep = (): boolean => {
    if (step === 3) {
      if (!fullName.trim()) {
        toast.error('Full Name is required.')
        return false
      }
      if (!phone.trim()) {
        toast.error('Phone Number is required.')
        return false
      }
      if (!email.trim()) {
        toast.error('Email Address is required.')
        return false
      }
      // Basic email regex
      if (!/\S+@\S+\.\S+/.test(email)) {
        toast.error('Please enter a valid email address.')
        return false
      }
    }

    if (step === 5) {
      if (!paymentType) {
        toast.error('Please select a Payment Type.')
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(prev + 1, 6))
    }
  }

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleCreate = async () => {
    if (isSubmitting) return
    console.log('[CREATE_FLOW] Create button clicked')
    console.log('[CREATE_FLOW] Wizard submit called')
    setIsSubmitting(true)
    try {
      const generatedEmpId = await generateEmployeeIdFromCloud()
      const wsRole = workspaceRole

      const employmentType: EmploymentType =
        engagement === 'in_house' ? 'in_house' : 'freelancer'

      const createdEmp = await createEmployeeInCloud(
        {
          employee_id: generatedEmpId,
          employee_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          mobile: phone.trim(),
          username: email.trim().toLowerCase().split('@')[0],
          role_id: wsRole,
          role_name: wsRole.toUpperCase(),
          workspace_role: wsRole,
          department: wsRole === 'owner' ? 'Executive' : wsRole === 'administrator' ? 'Administration' : wsRole === 'manager' ? 'Management' : 'Operations',
          employment_type: employmentType,
          team_type: employmentType,
          specializations: [
            employeeType,
            paymentType,
            ...(address ? [`Address: ${address}`] : []),
            ...(notes ? [`Notes: ${notes}`] : []),
          ],
          job_roles: Array.from(selectedWorkRoleIds),
          account_status: status === 'active' ? 'active' : 'inactive',
          login_enabled: hasLogin,
          password_hash: hasLogin ? (password || 'Password@123') : '',
          tenant_id: 'studio_main',
          system_role:
            wsRole === 'owner' || wsRole === 'administrator'
              ? 'admin'
              : wsRole === 'manager'
              ? 'manager'
              : 'staff',
          module_access: getDefaultModuleAccessForWorkspaceRole(wsRole),
        },
        'Administrator',
        {
          loginRequired: hasLogin,
          authPassword: hasLogin ? (password || 'Password@123') : undefined,
        }
      )

      // Save Multi Work Roles
      if (createdEmp?.id) {
        setEmployeeWorkRoles(createdEmp.id, Array.from(selectedWorkRoleIds))
      } else {
        setEmployeeWorkRoles(generatedEmpId, Array.from(selectedWorkRoleIds))
      }

      toast.success(
        hasLogin
          ? `🎉 Added ${fullName} with Dashboard Login!`
          : `🎉 Added ${fullName} to Team Directory (Offline)!`
      )
      onSaved()
      onClose()
    } catch (err: any) {
      console.error('Failed to create team member:', err)
      const msg = err?.message || ''
      if (msg.includes('EMPLOYEE_DUPLICATE_EMAIL')) {
        toast.error(`An employee with email "${email}" already exists.`)
      } else if (msg.includes('EMPLOYEE_DUPLICATE_MOBILE')) {
        toast.error(`An employee with phone "${phone}" already exists.`)
      } else {
        toast.error(msg || 'Failed to create team member. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="size-10 rounded-xl border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
              title="Back to Team Directory"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-1 rounded-md text-xs">
                  STEP {step} OF 6
                </span>
                <h1 className="ui-page-title text-[32px] font-extrabold text-[#111827]">Add New Team Member</h1>
              </div>
              <p className="ui-small-label text-[13px] text-gray-500 mt-1">Complete the 6-step profile configuration below.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ui-button-text text-[15px] px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-2 cursor-pointer"
          >
            <X size={16} /> Cancel & Return
          </button>
        </div>

        {/* 6-Step Indicator Progress Pills */}
        <div className="pt-3 border-t border-[#E5E7EB]">
          <div className="grid grid-cols-6 gap-2">
            {[
              { num: 1, label: 'Engagement' },
              { num: 2, label: 'Login' },
              { num: 3, label: 'Contact' },
              { num: 4, label: 'Type & Role' },
              { num: 5, label: 'Details' },
              { num: 6, label: 'Review' },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                disabled={s.num > step}
                onClick={() => setStep(s.num)}
                className={`py-1.5 px-1 rounded-xl text-center transition-all ${
                  step === s.num
                    ? 'bg-[#5B3FD9] text-white font-extrabold text-[11px] shadow-xs'
                    : step > s.num
                    ? 'bg-purple-100 text-[#5B3FD9] font-bold text-[10px]'
                    : 'bg-gray-100 text-gray-400 font-medium text-[10px]'
                }`}
              >
                {s.num}. {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Wizard Form Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-6">
          {/* STEP 1: ENGAGEMENT */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-extrabold text-[#111827]">How is this person engaged?</h3>
                <p className="text-xs text-gray-500 mt-0.5">Choose how this person works with the company.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setEngagement('in_house')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                    engagement === 'in_house'
                      ? 'border-[#5B3FD9] bg-purple-50/60 ring-2 ring-[#5B3FD9]/20 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-xl bg-purple-100 text-[#5B3FD9]">
                      <Briefcase size={22} />
                    </span>
                    <span
                      className={`size-5 rounded-full border flex items-center justify-center ${
                        engagement === 'in_house'
                          ? 'border-[#5B3FD9] bg-[#5B3FD9] text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {engagement === 'in_house' && <CheckCircle2 size={12} />}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#111827]">In-house Staff</h4>
                    <p className="text-xs text-gray-500 mt-1">On payroll, fixed salary or retainer.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setEngagement('freelancer')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                    engagement === 'freelancer'
                      ? 'border-[#5B3FD9] bg-purple-50/60 ring-2 ring-[#5B3FD9]/20 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-xl bg-blue-100 text-blue-600">
                      <Layers size={22} />
                    </span>
                    <span
                      className={`size-5 rounded-full border flex items-center justify-center ${
                        engagement === 'freelancer'
                          ? 'border-[#5B3FD9] bg-[#5B3FD9] text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {engagement === 'freelancer' && <CheckCircle2 size={12} />}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#111827]">Freelancer / Vendor</h4>
                    <p className="text-xs text-gray-500 mt-1">Engaged per project or per shoot.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: LOGIN */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-extrabold text-[#111827]">Do you want to create a dashboard login?</h3>
                <p className="text-xs text-gray-500 mt-0.5">A login lets this person sign in to the CRM dashboard.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setHasLogin(true)}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                    hasLogin
                      ? 'border-[#5B3FD9] bg-purple-50/60 ring-2 ring-[#5B3FD9]/20 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
                      <UserCheck size={22} />
                    </span>
                    <span
                      className={`size-5 rounded-full border flex items-center justify-center ${
                        hasLogin
                          ? 'border-[#5B3FD9] bg-[#5B3FD9] text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {hasLogin && <CheckCircle2 size={12} />}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#111827]">Yes, Create Login</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      They can log in and access modules according to permissions.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setHasLogin(false)}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                    !hasLogin
                      ? 'border-[#5B3FD9] bg-purple-50/60 ring-2 ring-[#5B3FD9]/20 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-xl bg-amber-100 text-amber-700">
                      <UserX size={22} />
                    </span>
                    <span
                      className={`size-5 rounded-full border flex items-center justify-center ${
                        !hasLogin
                          ? 'border-[#5B3FD9] bg-[#5B3FD9] text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {!hasLogin && <CheckCircle2 size={12} />}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#111827]">No, Offline Team Member</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      This person is stored in Team Directory only and can still be assigned to work.
                    </p>
                  </div>
                </button>
              </div>

              {!hasLogin && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-600 shrink-0" />
                  <span>
                    <strong>Offline Employee Mode:</strong> Password validation will be skipped and no Supabase Auth account will be created. Employee record will be fully stored in Supabase and assignable to Work Orders.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: CONTACT */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-extrabold text-[#111827]">Their Contact & Login</h3>
                <p className="text-xs text-gray-500 mt-0.5">Enter basic contact details and security credentials.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-gray-700 mb-1">Full Name *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-gray-700 mb-1">Phone Number *</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-gray-700 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Alternate Phone (Optional)</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="+91 98765 00000"
                      value={altPhone}
                      onChange={(e) => setAltPhone(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-300 font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: TYPE & ROLE */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-extrabold text-[#111827]">Type & Role</h3>
                <p className="text-xs text-gray-500 mt-0.5">Select organizational status and workspace permission role.</p>
              </div>

              {/* Section 1: Employee Type */}
              <div className="space-y-2">
                <label className="block font-extrabold text-gray-800 uppercase text-[11px] tracking-wider">
                  Section 1: Employee Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      'Team Member',
                      'Manager',
                      'Administrator',
                      'Intern',
                      'Vendor',
                      'Freelancer',
                    ] as EmployeeType[]
                  ).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEmployeeType(t)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        employeeType === t
                          ? 'bg-[#5B3FD9] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Status */}
              <div className="space-y-2">
                <label className="block font-extrabold text-gray-800 uppercase text-[11px] tracking-wider">
                  Section 2: Status
                </label>
                <div className="flex gap-2">
                  {[
                    { key: 'active', label: 'Active', color: 'bg-emerald-600 text-white' },
                    { key: 'inactive', label: 'Inactive', color: 'bg-gray-600 text-white' },
                    { key: 'on_leave', label: 'On Leave', color: 'bg-amber-600 text-white' },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setStatus(st.key as EmployeeStatus)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        status === st.key
                          ? st.color + ' shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 3: Workspace Role */}
              <div className="space-y-2">
                <label className="block font-extrabold text-gray-800 uppercase text-[11px] tracking-wider">
                  Section 3: Workspace Role (Controls Dashboard Access & System Permissions)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'administrator', label: 'Administrator' },
                    { key: 'manager', label: 'Manager' },
                    { key: 'staff', label: 'Employee / Staff' },
                    { key: 'owner', label: 'Owner' },
                  ].map((ws) => (
                    <button
                      key={ws.key}
                      type="button"
                      onClick={() => setWorkspaceRole(ws.key as WorkspaceRole)}
                      className={`p-3 rounded-xl text-xs font-bold border text-left cursor-pointer transition-all ${
                        workspaceRole === ws.key
                          ? 'border-[#5B3FD9] bg-purple-50 text-[#5B3FD9] ring-2 ring-[#5B3FD9]/20'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {ws.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 4: Multi Work Roles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-extrabold text-gray-800 uppercase text-[11px] tracking-wider">
                    Section 4: Work Roles (Production & Shoot Capabilities — Multi Select)
                  </label>
                  <span className="text-[11px] font-bold text-[#5B3FD9]">
                    {selectedWorkRoleIds.size} Selected
                  </span>
                </div>

                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search Roles..."
                    value={workRoleSearch}
                    onChange={(e) => setWorkRoleSearch(e.target.value)}
                    className="w-full h-8 pl-9 pr-3 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#5B3FD9]"
                  />
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto p-2.5 bg-gray-50 rounded-2xl border border-gray-200">
                  {(
                    [
                      { stage: 'pre_production', title: 'Pre-Production' },
                      { stage: 'on_production', title: 'On-Production' },
                      { stage: 'post_production', title: 'Post-Production' },
                      { stage: 'management', title: 'Management' },
                    ] as const
                  ).map(({ stage, title }) => {
                    const stageRoles = loadAllRoleConfigs()
                      .filter((r) => (r.production_stage || 'management') === stage)
                      .filter((r) => !workRoleSearch || r.role_name.toLowerCase().includes(workRoleSearch.toLowerCase()))

                    if (stageRoles.length === 0) return null

                    return (
                      <div key={stage} className="space-y-1.5">
                        <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">
                          {title}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {stageRoles.map((r) => {
                            const isChecked = selectedWorkRoleIds.has(r.role_id)
                            const toggleRole = () => {
                              const next = new Set(selectedWorkRoleIds)
                              if (next.has(r.role_id)) {
                                next.delete(r.role_id)
                              } else {
                                next.add(r.role_id)
                              }
                              setSelectedWorkRoleIds(next)
                            }

                            return (
                              <button
                                key={r.role_id}
                                type="button"
                                onClick={toggleRole}
                                className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                                  isChecked
                                    ? 'border-[#5B3FD9] bg-purple-50 text-[#5B3FD9] font-extrabold shadow-2xs'
                                    : 'border-gray-200 bg-white text-gray-800 font-bold hover:bg-gray-100/60'
                                }`}
                              >
                                <span className="text-xs truncate pr-1">{r.role_name}</span>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="size-3.5 text-[#5B3FD9] rounded border-gray-300 pointer-events-none"
                                />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: DETAILS */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-extrabold text-[#111827]">Address & Compensation</h3>
                <p className="text-xs text-gray-500 mt-0.5">Optional. You can fill this later from the employee profile.</p>
              </div>

              {/* Section: Address */}
              <div className="space-y-2">
                <label className="block font-extrabold text-gray-800 uppercase text-[11px] tracking-wider flex items-center gap-1">
                  <MapPin size={13} className="text-[#5B3FD9]" /> Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Street, City, Pincode"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              {/* Section: Payment & Work Type */}
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <label className="block font-extrabold text-gray-800 uppercase text-[11px] tracking-wider flex items-center gap-1">
                  <CreditCard size={13} className="text-[#5B3FD9]" /> Payment & Work Type
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-extrabold text-gray-700 mb-1">Payment Type *</label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                      className="w-full h-9 px-3 rounded-xl border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                    >
                      <option value="Monthly Salary">Monthly Salary</option>
                      <option value="Freelancer">Freelancer</option>
                      <option value="Commission Based">Commission Based</option>
                      <option value="Per Shoot">Per Shoot</option>
                      <option value="Hourly">Hourly</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-extrabold text-gray-700 mb-1">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                      className="w-full h-9 px-3 rounded-xl border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Hold">Hold</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Additional details, bank info or special instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW */}
          {step === 6 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-extrabold text-[#111827]">Review & Create</h3>
                <p className="text-xs text-gray-500 mt-0.5">Verify all employee parameters before submitting.</p>
              </div>

              {/* Summary Card */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Engagement</span>
                    <span className="font-extrabold text-gray-900 capitalize">
                      {engagement === 'in_house' ? 'In-house Staff' : 'Freelancer / Vendor'}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Dashboard Login</span>
                    <span
                      className={`font-extrabold ${
                        hasLogin ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {hasLogin ? 'Yes, Create Login' : 'No, Offline Team Member'}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Full Name</span>
                    <span className="font-extrabold text-gray-900">{fullName}</span>
                  </div>

                  <div>
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Phone Number</span>
                    <span className="font-bold font-mono text-gray-800">{phone}</span>
                  </div>

                  <div>
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Email Address</span>
                    <span className="font-bold text-gray-800">{email}</span>
                  </div>

                  <div>
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Alternate Phone</span>
                    <span className="font-medium text-gray-600">{altPhone || '—'}</span>
                  </div>

                  <div>
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Employee Type</span>
                    <span className="font-extrabold text-purple-700">{employeeType}</span>
                  </div>

                  <div>
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Status</span>
                    <span className="font-extrabold text-emerald-700 capitalize">{status}</span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Workspace Role</span>
                    <span className="font-extrabold text-[#5B3FD9] text-sm uppercase">
                      {workspaceRole} ({currentRoleObj.department})
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Payment Type</span>
                    <span className="font-bold text-gray-800">{paymentType}</span>
                  </div>

                  <div>
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Payment Status</span>
                    <span className="font-bold text-gray-800">{paymentStatus}</span>
                  </div>

                  {address && (
                    <div className="col-span-2">
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">Address</span>
                      <span className="font-medium text-gray-700">{address}</span>
                    </div>
                  )}

                  {notes && (
                    <div className="col-span-2">
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">Notes</span>
                      <span className="font-medium text-gray-600">{notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Conditional Alert Notice */}
              {hasLogin ? (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-[#5B3FD9] text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span>A dashboard login will be created using the above email address.</span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                  <UserX size={18} className="shrink-0 text-amber-700" />
                  <span>This employee will be created without dashboard login.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="px-6 py-5 border-t border-[#E5E7EB] bg-white rounded-2xl border flex items-center justify-between shadow-xs">
          <button
            type="button"
            disabled={step === 1 || isSubmitting}
            onClick={handleBack}
            className="ui-button-text min-h-[44px] px-5 py-2.5 text-[15px] font-extrabold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="ui-button-text min-h-[44px] px-6 py-2.5 text-[15px] font-extrabold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 transition-all cursor-pointer"
            >
              Next Step <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCreate}
              className="ui-button-text min-h-[44px] px-7 py-2.5 text-[15px] font-extrabold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-2 shadow-lg shadow-[#5B3FD9]/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={18} /> {isSubmitting ? 'Creating...' : 'Create Team Member'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
