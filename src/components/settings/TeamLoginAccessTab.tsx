import React, { useState, useEffect } from 'react'
import {
  UserPlus, KeyRound, Lock, Unlock, Search, X, History,
  Trash2, Eye, EyeOff, ShieldAlert, CheckCircle2, Pencil,
  ShieldCheck, RotateCcw,
} from 'lucide-react'
import type {
  UserAccount, LoginHistoryEntry, LoginAuditLog,
  SystemRole, ModuleAccessSettings, AccountStatus,
  WorkspaceRole, EmploymentType,
} from '@/types/teamLogin'
import {
  fetchAllEmployeesFromCloud,
  getCachedUserAccounts,
  createUserAccount,
  updateUserAccount,
  resetUserPassword,
  revealUserPasswordLog,
  unlockUserAccount,
  toggleAccountLogin,
  deleteUserAccount,
  bulkActivateUsers,
  bulkDeactivateUsers,
  bulkResetPasswords,
  bulkDeleteUsers,
  generateSecurePassword,
  generateEmployeeId,
  suggestUsername,
  loadLoginHistory,
  loadLoginAuditLogs,
  DEFAULT_MODULE_ACCESS,
  getDefaultModuleAccessForWorkspaceRole,
  resetToOnlyOwnerAccount,
  subscribeToEmployeeRealtimeChanges,
} from '@/services/employeeService'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'

const ALL_JOB_ROLES = [
  'Lead Photographer',
  'Candid Photographer',
  'Traditional Photographer',
  'Cinematographer',
  'Drone Pilot',
  'Photo Editor',
  'Video Editor',
  'Album Designer',
  'Client Manager',
  'Studio Coordinator',
]

const MODULE_KEYS: { key: keyof ModuleAccessSettings; label: string; desc: string }[] = [
  { key: 'dashboard', label: 'Dashboard', desc: 'Main metrics & activity feed' },
  { key: 'enquiries', label: 'Enquiries', desc: 'Leads & inquiry pipeline' },
  { key: 'projects', label: 'Projects / Work Orders', desc: 'Work order details & schedules' },
  { key: 'post_production', label: 'Post Production', desc: 'Editing, color & album workflow' },
  { key: 'data', label: 'Data & Storage', desc: 'Hard drive & RAW card tracking' },
  { key: 'team', label: 'Team', desc: 'Staff directory & assignments' },
  { key: 'finances', label: 'Finances', desc: 'Invoices, receipts & ledger' },
  { key: 'client_requests', label: 'Client Requests', desc: 'Customer portal tickets & chat' },
  { key: 'trufocus_ai', label: 'Trufocus AI', desc: 'AI assistant & captions' },
  { key: 'settings', label: 'Settings', desc: 'System masters & team access' },
  { key: 'reports', label: 'Reports', desc: 'Analytics & performance reports' },
]

export function TeamLoginAccessTab() {
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [loginHistory] = useState<LoginHistoryEntry[]>(loadLoginHistory())
  const [auditLogs, setAuditLogs] = useState<LoginAuditLog[]>(loadLoginAuditLogs())

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [teamTypeFilter, setTeamTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Selection & Bulk State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [bulkResetResult, setBulkResetResult] = useState<Record<string, string> | null>(null)

  // Reveal Password State (Auto-hide after 15s)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({})
  const [revealTimers, setRevealTimers] = useState<Record<string, number>>({})
  const [revealConfirmUser, setRevealConfirmUser] = useState<UserAccount | null>(null)

  // Drawer & Modals State
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)
  const [historySubTab, setHistorySubTab] = useState<'logins' | 'audits'>('audits')

  // Create / Edit User Modal
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  const [formWorkspaceRole, setFormWorkspaceRole] = useState<WorkspaceRole>('photographer')
  const [formEmploymentType, setFormEmploymentType] = useState<EmploymentType>('in_house')
  const [formSpecializations, setFormSpecializations] = useState<string[]>(['Lead Photographer'])

  const [formName, setFormName] = useState('')
  const [formEmpId, setFormEmpId] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formMobile, setFormMobile] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formSystemRole, setFormSystemRole] = useState<SystemRole>('staff')
  const [formModuleAccess, setFormModuleAccess] = useState<ModuleAccessSettings>({ ...DEFAULT_MODULE_ACCESS })
  const [formAccountStatus, setFormAccountStatus] = useState<AccountStatus>('active')

  // Username Change Modal
  const [usernameUser, setUsernameUser] = useState<UserAccount | null>(null)
  const [newUsernameInput, setNewUsernameInput] = useState('')

  // Single Password Reset Modal
  const [resetModalUser, setResetModalUser] = useState<UserAccount | null>(null)
  const [resetPassInput, setResetPassInput] = useState('')

  // System Reset Modal (Keep Owner Only)
  const [showSystemResetModal, setShowSystemResetModal] = useState(false)

  const handleExecuteSystemReset = () => {
    const updated = resetToOnlyOwnerAccount('Administrator')
    setAccounts(updated)
    setAuditLogs(loadLoginAuditLogs())
    setSelectedUserIds([])
    setShowSystemResetModal(false)
    toast.success('🎉 Module reset complete! Only the 1 Owner account remains.')
  }

  const refreshAccounts = () => {
    setAccounts(getCachedUserAccounts())
    setAuditLogs(loadLoginAuditLogs())
  }

  // Hydrate directly from cloud DB on mount and listen for real-time WebSocket cloud changes
  useEffect(() => {
    fetchAllEmployeesFromCloud().then((cloudAccounts) => {
      setAccounts(cloudAccounts)
    })

    const unsubscribeRealtime = subscribeToEmployeeRealtimeChanges((liveAccs) => {
      setAccounts(liveAccs)
      setAuditLogs(loadLoginAuditLogs())
    })

    const handleSync = () => {
      fetchAllEmployeesFromCloud().then((cloudAccounts) => {
        setAccounts(cloudAccounts)
        setAuditLogs(loadLoginAuditLogs())
      })
    }

    window.addEventListener('workOrdersUpdated', handleSync)
    window.addEventListener('trufocus_cloud_synced', handleSync)

    return () => {
      window.removeEventListener('workOrdersUpdated', handleSync)
      window.removeEventListener('trufocus_cloud_synced', handleSync)
      unsubscribeRealtime()
    }
  }, [])

  // 15-Second Timer Countdown Effect for Revealed Passwords
  useEffect(() => {
    const interval = setInterval(() => {
      setRevealTimers((prev) => {
        const next: Record<string, number> = {}
        let updated = false
        Object.entries(prev).forEach(([uid, seconds]) => {
          if (seconds > 1) {
            next[uid] = seconds - 1
            updated = true
          } else {
            // Expired -> hide password
            setRevealedPasswords((p) => ({ ...p, [uid]: false }))
            updated = true
          }
        })
        return updated ? next : prev
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Create / Edit Handlers
  const handleOpenCreateModal = () => {
    setEditingUserId(null)
    setFormEmpId(generateEmployeeId())
    setFormName('')
    setFormUsername('')
    setFormEmail('')
    setFormMobile('')
    const pass = generateSecurePassword()
    setFormPassword(pass)
    setFormWorkspaceRole('photographer')
    setFormEmploymentType('in_house')
    setFormSpecializations(['Lead Photographer'])
    setFormSystemRole('staff')
    setFormModuleAccess(getDefaultModuleAccessForWorkspaceRole('photographer'))
    setFormAccountStatus('active')
    setShowFormModal(true)
  }

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUserId(user.id)
    setFormEmpId(user.employee_id)
    setFormName(user.employee_name)
    setFormUsername(user.username)
    setFormEmail(user.email)
    setFormMobile(user.mobile)
    setFormPassword(user.password_hash)
    const wsRole = user.workspace_role || (user.role_id as any) || 'photographer'
    const empType = user.employment_type || (user.team_type as any) || 'in_house'
    const specs = user.specializations || user.job_roles || ['Lead Photographer']
    setFormWorkspaceRole(wsRole)
    setFormEmploymentType(empType)
    setFormSpecializations(specs)
    setFormSystemRole(user.system_role || (wsRole === 'owner' || wsRole === 'administrator' ? 'admin' : wsRole === 'manager' ? 'manager' : 'staff'))
    setFormModuleAccess(user.module_access || getDefaultModuleAccessForWorkspaceRole(wsRole))
    setFormAccountStatus(user.account_status)
    setShowFormModal(true)
  }

  const handleWorkspaceRoleSelect = (role: WorkspaceRole) => {
    setFormWorkspaceRole(role)
    setFormSystemRole(role === 'owner' || role === 'administrator' ? 'admin' : role === 'manager' ? 'manager' : 'staff')
    setFormModuleAccess(getDefaultModuleAccessForWorkspaceRole(role))
  }

  const handleNameChange = (val: string) => {
    setFormName(val)
    if (!editingUserId && val.trim()) {
      const suggested = suggestUsername(val, formSystemRole)
      setFormUsername(suggested)
    }
  }

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formUsername.trim() || !formEmail.trim()) {
      toast.error('Please fill in Name, Username, and Email.')
      return
    }

    if (editingUserId) {
      updateUserAccount(
        editingUserId,
        {
          employee_name: formName.trim(),
          username: formUsername.trim(),
          email: formEmail.trim(),
          mobile: formMobile.trim(),
          workspace_role: formWorkspaceRole,
          employment_type: formEmploymentType,
          specializations: formSpecializations,
          role_id: formWorkspaceRole,
          system_role: formWorkspaceRole === 'owner' || formWorkspaceRole === 'administrator' ? 'admin' : formWorkspaceRole === 'manager' ? 'manager' : 'staff',
          team_type: formEmploymentType,
          job_roles: formSpecializations,
          module_access: formModuleAccess,
          account_status: formAccountStatus,
          login_enabled: formAccountStatus === 'active',
          role_name: formWorkspaceRole.replace('_', ' ').toUpperCase(),
        },
        'Administrator'
      )
      toast.success(`Updated account & permissions for ${formName}!`)
    } else {
      if (accounts.some((a) => a.username.toLowerCase() === formUsername.trim().toLowerCase())) {
        toast.error(`Username '${formUsername}' is already taken. Try another.`)
        return
      }

      createUserAccount(
        {
          employee_id: formEmpId,
          employee_name: formName.trim(),
          department: formWorkspaceRole.includes('photo') ? 'Photography' : formWorkspaceRole.includes('video') ? 'Videography' : formWorkspaceRole.includes('editor') || formWorkspaceRole.includes('album') ? 'Post-Production' : 'Management',
          username: formUsername.trim(),
          email: formEmail.trim(),
          mobile: formMobile.trim() || '+91 98765 00000',
          password_hash: formPassword,
          plain_temp_password: formPassword,
          role_id: formWorkspaceRole,
          role_name: formWorkspaceRole.replace('_', ' ').toUpperCase(),
          workspace_role: formWorkspaceRole,
          employment_type: formEmploymentType,
          specializations: formSpecializations,
          tenant_id: 'studio_main',
          system_role: formWorkspaceRole === 'owner' || formWorkspaceRole === 'administrator' ? 'admin' : formWorkspaceRole === 'manager' ? 'manager' : 'staff',
          team_type: formEmploymentType,
          job_roles: formSpecializations,
          module_access: formModuleAccess,
          account_status: formAccountStatus,
          login_enabled: formAccountStatus === 'active',
        },
        'Administrator'
      )
      toast.success(`🎉 Created login account for ${formName} (@${formUsername})!`)
    }

    refreshAccounts()
    setShowFormModal(false)
  }

  // Password Reveal Confirmation & Handler
  const handleRequestReveal = (user: UserAccount) => {
    setRevealConfirmUser(user)
  }

  const handleConfirmReveal = () => {
    if (!revealConfirmUser) return
    const uid = revealConfirmUser.id
    revealUserPasswordLog(uid, 'Administrator')
    setRevealedPasswords((prev) => ({ ...prev, [uid]: true }))
    setRevealTimers((prev) => ({ ...prev, [uid]: 15 }))
    toast.success(`👁 Revealed password for ${revealConfirmUser.employee_name}. Auto-hiding in 15s.`)
    setRevealConfirmUser(null)
    refreshAccounts()
  }

  // Single Reset Password
  const handleOpenResetModal = (user: UserAccount) => {
    setResetModalUser(user)
    setResetPassInput(generateSecurePassword())
  }

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetModalUser || !resetPassInput.trim()) return

    resetUserPassword(resetModalUser.id, resetPassInput.trim(), true, 'Administrator')
    refreshAccounts()
    setResetModalUser(null)
    toast.success(`🔑 Password reset for ${resetModalUser.employee_name}!`)
  }

  // Change Username
  const handleOpenUsernameModal = (user: UserAccount) => {
    setUsernameUser(user)
    setNewUsernameInput(user.username)
  }

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault()
    if (!usernameUser || !newUsernameInput.trim()) return

    const newName = newUsernameInput.trim().toLowerCase()
    if (accounts.some((a) => a.id !== usernameUser.id && a.username.toLowerCase() === newName)) {
      toast.error(`Username '${newName}' is already taken.`)
      return
    }

    updateUserAccount(usernameUser.id, { username: newName }, 'Administrator')
    refreshAccounts()
    setUsernameUser(null)
    toast.success(`Updated username to @${newName}!`)
  }

  // Single Action Toggles
  const handleToggleAccountStatus = (user: UserAccount) => {
    const nextStatus = user.account_status === 'active' ? false : true
    toggleAccountLogin(user.id, nextStatus, 'Administrator')
    refreshAccounts()
    toast.success(`${nextStatus ? '🟢 Activated' : '🔴 Deactivated'} login for ${user.employee_name}`)
  }

  const handleUnlockAccount = (user: UserAccount) => {
    unlockUserAccount(user.id, 'Administrator')
    refreshAccounts()
    toast.success(`🔓 Unlocked account for ${user.employee_name}!`)
  }

  const handleDeleteUser = (user: UserAccount) => {
    if (confirm(`Are you sure you want to delete account for '${user.employee_name}'?`)) {
      deleteUserAccount(user.id, 'Administrator')
      refreshAccounts()
      toast.success(`Soft deleted user account for ${user.employee_name}`)
    }
  }

  // Bulk Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(filteredAccounts.map((a) => a.id))
    } else {
      setSelectedUserIds([])
    }
  }

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleBulkActivate = () => {
    bulkActivateUsers(selectedUserIds, 'Administrator')
    refreshAccounts()
    toast.success(`Activated login for ${selectedUserIds.length} users.`)
    setSelectedUserIds([])
  }

  const handleBulkDeactivate = () => {
    bulkDeactivateUsers(selectedUserIds, 'Administrator')
    refreshAccounts()
    toast.success(`Deactivated login for ${selectedUserIds.length} users.`)
    setSelectedUserIds([])
  }

  const handleBulkResetPass = () => {
    const result = bulkResetPasswords(selectedUserIds, 'Administrator')
    setBulkResetResult(result)
    refreshAccounts()
    toast.success(`Reset passwords for ${selectedUserIds.length} users.`)
  }

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedUserIds.length} selected user accounts?`)) {
      bulkDeleteUsers(selectedUserIds, 'Administrator')
      refreshAccounts()
      toast.success(`Deleted ${selectedUserIds.length} accounts.`)
      setSelectedUserIds([])
    }
  }

  // Filtered Accounts
  const filteredAccounts = accounts.filter((acc) => {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      acc.employee_name.toLowerCase().includes(q) ||
      acc.username.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      acc.employee_id.toLowerCase().includes(q)

    const matchesRole = roleFilter === 'all' || acc.system_role === roleFilter || acc.role_id === roleFilter
    const matchesTeamType = teamTypeFilter === 'all' || acc.team_type === teamTypeFilter

    let matchesStatus = true
    if (statusFilter === 'active') matchesStatus = acc.account_status === 'active' && acc.login_enabled
    if (statusFilter === 'inactive') matchesStatus = !acc.login_enabled || acc.account_status === 'inactive'
    if (statusFilter === 'locked') matchesStatus = acc.account_status === 'locked' || Boolean(acc.locked_until && new Date(acc.locked_until) > new Date())

    return matchesSearch && matchesRole && matchesTeamType && matchesStatus
  })

  const totalActive = accounts.filter((a) => a.account_status === 'active' && a.login_enabled).length
  const totalInHouse = accounts.filter((a) => a.team_type === 'in_house').length
  const totalFreelancers = accounts.filter((a) => a.team_type === 'freelancer').length

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Admin Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#5B3FD9]" />
            <h3 className="text-base font-extrabold text-[#111827]">Team Login Access & Credentials Management</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
              Admin Only Access
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Create user accounts, set module access permissions, reset passwords, reveal credentials, and audit security logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSystemResetModal(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} /> 🔄 Reset Module (Keep Owner Only)
          </button>

          <button
            onClick={() => setShowHistoryDrawer(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <History size={14} /> Security Audit & History ({auditLogs.length})
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus size={14} /> ➕ Create User Account
          </button>
        </div>
      </div>

      {/* Metrics Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
          <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Total CRM Users</span>
          <p className="text-xl font-extrabold text-[#111827]">{accounts.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 shadow-xs space-y-1">
          <span className="text-emerald-700 font-bold uppercase tracking-wider text-[10px]">Active Logins</span>
          <p className="text-xl font-extrabold text-emerald-700">{totalActive}</p>
        </div>
        <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 shadow-xs space-y-1">
          <span className="text-purple-700 font-bold uppercase tracking-wider text-[10px]">In-House Staff</span>
          <p className="text-xl font-extrabold text-[#5B3FD9]">{totalInHouse}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 shadow-xs space-y-1">
          <span className="text-amber-800 font-bold uppercase tracking-wider text-[10px]">Freelancers</span>
          <p className="text-xl font-extrabold text-amber-800">{totalFreelancers}</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, employee ID, username, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 h-8 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-8 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-700 focus:outline-none focus:border-[#5B3FD9]"
            >
              <option value="all">All System Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>

            <select
              value={teamTypeFilter}
              onChange={(e) => setTeamTypeFilter(e.target.value)}
              className="h-8 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-700 focus:outline-none focus:border-[#5B3FD9]"
            >
              <option value="all">All Team Types</option>
              <option value="in_house">In-House Staff</option>
              <option value="freelancer">Freelancers</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-700 focus:outline-none focus:border-[#5B3FD9]"
            >
              <option value="all">All Account Statuses</option>
              <option value="active">🟢 Active</option>
              <option value="inactive">🔴 Inactive / Disabled</option>
              <option value="locked">🔒 Locked</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedUserIds.length > 0 && (
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
            <span className="font-extrabold text-[#5B3FD9] text-xs">
              Selected {selectedUserIds.length} User Accounts
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkActivate}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
              >
                🟢 Activate Selected
              </button>
              <button
                onClick={handleBulkDeactivate}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
              >
                🔴 Deactivate Selected
              </button>
              <button
                onClick={handleBulkResetPass}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#5B3FD9] hover:bg-[#4C34C3] text-white transition-colors cursor-pointer"
              >
                🔑 Reset Passwords
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
              >
                🗑️ Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Team Accounts Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                <th className="p-3.5 pl-5 w-10">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredAccounts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="size-4 rounded accent-[#5B3FD9] cursor-pointer"
                  />
                </th>
                <th className="p-3.5">Employee ID & Photo</th>
                <th className="p-3.5">User & Username</th>
                <th className="p-3.5">Role & Team Type</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Module Access</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5">Last Login & Device</th>
                <th className="p-3.5 text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAccounts.map((acc) => {
                const isSelected = selectedUserIds.includes(acc.id)
                const isLocked = acc.account_status === 'locked' || Boolean(acc.locked_until && new Date(acc.locked_until) > new Date())
                const isRevealed = Boolean(revealedPasswords[acc.id])
                const timerSeconds = revealTimers[acc.id] || 0

                const enabledModulesCount = Object.values(acc.module_access || DEFAULT_MODULE_ACCESS).filter(Boolean).length

                return (
                  <tr key={acc.id} className={`hover:bg-gray-50/70 transition-colors ${isSelected ? 'bg-purple-50/30' : ''}`}>
                    <td className="p-3.5 pl-5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectUser(acc.id)}
                        className="size-4 rounded accent-[#5B3FD9] cursor-pointer"
                      />
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={acc.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.employee_name)}&background=5B3FD9&color=fff`}
                          alt={acc.employee_name}
                          className="size-9 rounded-full object-cover border border-gray-200 shrink-0"
                        />
                        <div>
                          <span className="font-mono text-xs font-extrabold text-[#5B3FD9] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                            {acc.employee_id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <p className="font-extrabold text-[#111827] text-sm">{acc.employee_name}</p>
                      <p className="text-xs font-mono font-bold text-[#5B3FD9]">@{acc.username}</p>
                    </td>

                    <td className="p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          acc.system_role === 'admin'
                            ? 'bg-purple-100 text-[#5B3FD9] border border-purple-200'
                            : acc.system_role === 'manager'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {acc.system_role?.toUpperCase() || 'STAFF'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          acc.team_type === 'in_house' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {acc.team_type === 'in_house' ? 'In-House' : 'Freelancer'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium truncate max-w-[150px]">
                        {(acc.job_roles || []).join(', ')}
                      </p>
                    </td>

                    <td className="p-3.5 space-y-0.5">
                      <p className="text-[11px] text-gray-700 font-medium">{acc.email}</p>
                      <p className="text-[10px] font-mono text-gray-400">{acc.mobile}</p>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 inline-block">
                        {enabledModulesCount} / 11 Modules
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      {isLocked ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 inline-flex items-center gap-1">
                          <Lock size={10} /> Locked
                        </span>
                      ) : acc.account_status === 'active' && acc.login_enabled ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                          🟢 Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                          🔴 Inactive
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-xs text-gray-500 font-mono">
                      {acc.last_login_at ? (
                        <div>
                          <p className="font-bold text-gray-800">{formatDate(acc.last_login_at)}</p>
                          <p className="text-[10px] text-gray-400">{acc.last_browser || 'Chrome / Windows'}</p>
                        </div>
                      ) : (
                        <span className="text-amber-700 font-bold italic">Never Logged In</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right pr-5">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit User Button */}
                        <button
                          onClick={() => handleOpenEditModal(acc)}
                          className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
                          title="Edit User & Module Permissions"
                        >
                          <Pencil size={13} />
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => handleOpenResetModal(acc)}
                          className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 text-[#5B3FD9] hover:bg-purple-100 transition-colors cursor-pointer"
                          title="Reset Password"
                        >
                          <KeyRound size={13} />
                        </button>

                        {/* Reveal Password Button (Admin Only) */}
                        <button
                          onClick={() => handleRequestReveal(acc)}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                            isRevealed
                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-mono'
                              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                          }`}
                          title="Admin Reveal Password (15s Auto-Hide)"
                        >
                          {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                          <span>{isRevealed ? `${acc.password_hash} (${timerSeconds}s)` : 'Reveal'}</span>
                        </button>

                        {/* Change Username Button */}
                        <button
                          onClick={() => handleOpenUsernameModal(acc)}
                          className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
                          title="Change Username"
                        >
                          @
                        </button>

                        {/* Unlock Account Button if Locked */}
                        {isLocked && (
                          <button
                            onClick={() => handleUnlockAccount(acc)}
                            className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Unlock Locked Account"
                          >
                            <Unlock size={13} />
                          </button>
                        )}

                        {/* Activate / Deactivate Toggle */}
                        <button
                          onClick={() => handleToggleAccountStatus(acc)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            acc.account_status === 'active' && acc.login_enabled
                              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title={acc.account_status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {acc.account_status === 'active' && acc.login_enabled ? '⏸' : '▶'}
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(acc)}
                          className="p-1.5 rounded-lg border border-gray-200 hover:border-red-300 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Soft Delete User"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── CREATE / EDIT USER MODAL ─── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
                  <UserPlus size={18} className="text-[#5B3FD9]" />
                  {editingUserId ? 'Edit User Credentials & Module Access' : 'Create New Team User Account'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure employee info, system roles, temporary password, and module permissions
                </p>
              </div>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-5">
              {/* Employee Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suresh Kumar"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Employee ID</label>
                  <input
                    type="text"
                    readOnly
                    value={formEmpId}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-100 font-mono font-extrabold text-[#5B3FD9]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. suresh01"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="suresh@trufocusphotos.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                  />
                </div>

                {/* Password Row */}
                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">
                    {editingUserId ? 'Password' : 'Temporary Password *'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="flex-1 h-9 px-3 text-xs rounded-xl border border-gray-200 bg-purple-50 font-mono font-bold text-[#5B3FD9] focus:outline-none focus:border-[#5B3FD9]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const p = generateSecurePassword()
                        setFormPassword(p)
                        toast.success('Generated new secure password!')
                      }}
                      className="px-3 h-9 text-xs font-bold rounded-xl border border-purple-200 bg-purple-100 text-[#5B3FD9] hover:bg-purple-200 cursor-pointer"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              {/* 3-Layer Architecture Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">
                    Workspace Role (Primary Login) *
                  </label>
                  <select
                    value={formWorkspaceRole}
                    onChange={(e) => handleWorkspaceRoleSelect(e.target.value as WorkspaceRole)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-[#5B3FD9] bg-purple-50 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5B3FD9]"
                  >
                    <option value="owner">👑 Owner (Full Control & Analytics)</option>
                    <option value="administrator">🛡 Administrator (Operations & Users)</option>
                    <option value="manager">📊 Manager (Team & Schedule Monitor)</option>
                    <option value="photographer">📷 Photographer (Field Shoot Queue)</option>
                    <option value="videographer">🎥 Videographer (Field Video Queue)</option>
                    <option value="photo_editor">🎨 Photo Editor (Photo Post-Production)</option>
                    <option value="video_editor">🎬 Video Editor (Video Editing Queue)</option>
                    <option value="album_designer">📖 Album Designer (Album Design Queue)</option>
                    <option value="data_operator">🖥 Data Operator (Data & Drives)</option>
                    <option value="finance">💰 Finance (Payments & Ledger)</option>
                    <option value="sales_executive">📞 Sales Executive (Leads & Quotations)</option>
                    <option value="client_manager">🤝 Client Manager (Portals & Tickets)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Employment Type *</label>
                  <select
                    value={formEmploymentType}
                    onChange={(e) => setFormEmploymentType(e.target.value as EmploymentType)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                  >
                    <option value="in_house">In-House Employee</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="vendor">Vendor</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Account Status</label>
                  <select
                    value={formAccountStatus}
                    onChange={(e) => setFormAccountStatus(e.target.value as any)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                  >
                    <option value="active">🟢 Active</option>
                    <option value="inactive">🔴 Inactive / Disabled</option>
                  </select>
                </div>
              </div>

              {/* Specialization / Skills Multi-Select */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-gray-700 font-extrabold">Specialization / Skills (Multi-Select)</label>
                  <span className="text-[10px] text-gray-400">Skills description only — does NOT override login permissions</span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  {ALL_JOB_ROLES.map((skillName) => {
                    const isSelected = formSpecializations.includes(skillName)
                    return (
                      <button
                        key={skillName}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormSpecializations(formSpecializations.filter((s) => s !== skillName))
                          } else {
                            setFormSpecializations([...formSpecializations, skillName])
                          }
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#5B3FD9] text-white border-[#5B3FD9]'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{skillName}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Module Permissions Checkboxes */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#111827]">Module Access Permissions</h4>
                    <p className="text-[10px] text-gray-500">Enable or disable module access for this user account</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormModuleAccess({ ...DEFAULT_MODULE_ACCESS })}
                      className="text-[10px] font-bold text-[#5B3FD9] hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormModuleAccess({
                          dashboard: false, enquiries: false, projects: false, post_production: false,
                          data: false, team: false, finances: false, client_requests: false,
                          trufocus_ai: false, settings: false, reports: false,
                        })
                      }
                      className="text-[10px] font-bold text-gray-400 hover:underline cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {MODULE_KEYS.map((mod) => (
                    <label
                      key={mod.key}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100/70"
                    >
                      <div>
                        <span className="font-bold text-gray-900 block">{mod.label}</span>
                        <span className="text-[10px] text-gray-400">{mod.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(formModuleAccess[mod.key])}
                        onChange={(e) =>
                          setFormModuleAccess((prev) => ({ ...prev, [mod.key]: e.target.checked }))
                        }
                        className="size-4 rounded accent-[#5B3FD9] cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white shadow-xs transition-colors cursor-pointer"
                >
                  {editingUserId ? 'Save User & Permissions' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SYSTEM RESET CONFIRMATION MODAL ─── */}
      {showSystemResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert size={24} />
              <h3 className="text-base font-extrabold text-[#111827]">Reset Module (Keep Owner Only)</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to reset Team Login Access and remove all user accounts except the single <strong className="text-gray-900">👑 Owner</strong> account?
              <br />
              <br />
              <span className="text-rose-800 font-bold bg-rose-50 p-2.5 rounded-xl block border border-rose-200">
                ⚠️ All non-owner login accounts, roles, and permissions will be permanently removed. Business data (Work Orders, Customers, Finances) will remain intact.
              </span>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setShowSystemResetModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSystemReset}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                🔄 Confirm System Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REVEAL PASSWORD CONFIRMATION MODAL ─── */}
      {revealConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <ShieldAlert size={24} />
              <h3 className="text-base font-extrabold text-[#111827]">Admin Password Reveal Confirmation</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to reveal the plain login password for{' '}
              <strong className="text-gray-900">{revealConfirmUser.employee_name}</strong> (@{revealConfirmUser.username})?
              <br />
              <br />
              <span className="text-amber-800 font-bold bg-amber-50 p-2 rounded-lg block border border-amber-200">
                ⚠️ This action will be permanently logged in the Security Audit Trail. The password will automatically hide after 15 seconds.
              </span>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setRevealConfirmUser(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReveal}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                👁 Confirm Reveal Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RESET PASSWORD MODAL ─── */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                <KeyRound size={18} className="text-[#5B3FD9]" /> Reset Password for {resetModalUser.employee_name}
              </h3>
              <button onClick={() => setResetModalUser(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">New Temporary Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={resetPassInput}
                    onChange={(e) => setResetPassInput(e.target.value)}
                    className="flex-1 h-9 px-3 text-xs rounded-xl border border-gray-200 bg-purple-50 font-mono font-bold text-[#5B3FD9]"
                  />
                  <button
                    type="button"
                    onClick={() => setResetPassInput(generateSecurePassword())}
                    className="px-3 h-9 text-xs font-bold rounded-xl border border-purple-200 bg-purple-100 text-[#5B3FD9]"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white cursor-pointer"
                >
                  Save Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CHANGE USERNAME MODAL ─── */}
      {usernameUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#111827]">Change Username</h3>
              <button onClick={() => setUsernameUser(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveUsername} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">New Username for {usernameUser.employee_name}</label>
                <input
                  type="text"
                  required
                  value={newUsernameInput}
                  onChange={(e) => setNewUsernameInput(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUsernameUser(null)}
                  className="px-3.5 py-1.5 font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white cursor-pointer"
                >
                  Save Username
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── BULK RESET RESULT MODAL ─── */}
      {bulkResetResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={18} /> Bulk Password Reset Completed
              </h3>
              <button onClick={() => setBulkResetResult(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              New temporary passwords have been generated for {Object.keys(bulkResetResult).length} users. Copy these passwords now as they will not be shown again.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
              {Object.entries(bulkResetResult).map(([uid, pass]) => {
                const userObj = accounts.find((a) => a.id === uid)
                return (
                  <div key={uid} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 text-xs">
                    <div>
                      <span className="font-bold text-gray-900">{userObj?.employee_name}</span>
                      <span className="text-[10px] text-gray-500 font-mono block">@{userObj?.username}</span>
                    </div>
                    <span className="font-mono font-extrabold text-[#5B3FD9] bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      {pass}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setBulkResetResult(null)}
                className="px-5 py-2 font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SECURITY AUDIT LOG & HISTORY DRAWER ─── */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col font-sans">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-base font-extrabold text-[#111827]">Security & Login Audit History</h3>
                <p className="text-xs text-gray-500">Track all user logins, password reveals, and admin action trails</p>
              </div>
              <button onClick={() => setShowHistoryDrawer(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="flex border-b border-gray-200 px-5 gap-4 pt-3 bg-gray-50 text-xs font-bold">
              <button
                onClick={() => setHistorySubTab('audits')}
                className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                  historySubTab === 'audits'
                    ? 'border-[#5B3FD9] text-[#5B3FD9]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Security Audit Log ({auditLogs.length})
              </button>
              <button
                onClick={() => setHistorySubTab('logins')}
                className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                  historySubTab === 'logins'
                    ? 'border-[#5B3FD9] text-[#5B3FD9]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Login Sessions ({loginHistory.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs">
              {historySubTab === 'audits' ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#5B3FD9] text-xs">{log.action}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{formatDate(log.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-800">{log.details}</p>
                    <p className="text-[10px] text-gray-500">
                      By: <strong>{log.actor}</strong> | Target: <strong>{log.target_user}</strong>
                    </p>
                  </div>
                ))
              ) : (
                loginHistory.map((hist) => (
                  <div key={hist.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#111827]">@{hist.username}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        hist.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {hist.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 font-mono">
                      IP: {hist.ip_address} | {hist.browser} ({hist.device})
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Login: {formatDate(hist.timestamp)} {hist.logout_timestamp ? `| Logout: ${formatDate(hist.logout_timestamp)}` : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
