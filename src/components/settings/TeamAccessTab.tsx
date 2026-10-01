import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus, Search, Users, Sliders,
  Trash2, Edit3, Layers,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import type {
  CrmModuleId,
  RolePermissionConfig,
  ProductionStage,
  ModuleCrudPermission,
} from '@/types/teamAccess'
import {
  loadAllRoleConfigs,
  saveAllRoleConfigs,
  createCustomRole,
  deleteRole,
} from '@/services/permissionService'
import { fetchAllEmployeesFromCloud, type UserAccount } from '@/services/employeeService'
import {
  getWorkRolesForEmployee,
  getWorkRoleIdsForEmployee,
  removeWorkRoleFromEmployee,
  syncEmployeeWorkRoles,
} from '@/services/employeeWorkRolesService'
import { toast } from 'react-hot-toast'

const MODULE_DEFINITIONS: { id: CrmModuleId; label: string; desc: string }[] = [
  { id: 'dashboard', label: 'Dashboard', desc: 'Overview metrics & activity feeds' },
  { id: 'enquiries', label: 'Enquiries & Leads', desc: 'Lead capturing and enquiry pipeline' },
  { id: 'work_orders', label: 'Projects / Work Orders', desc: 'Work order details, schedules, and deliverables' },
  { id: 'post_production', label: 'Post Production', desc: 'Editing, color grading, and album design status' },
  { id: 'data', label: 'Data & Storage', desc: 'Hard drive tracking and RAW storage cards' },
  { id: 'team', label: 'Team Module', desc: 'Staff directory, assignments, and attendance' },
  { id: 'finances', label: 'Finances', desc: 'Ledger, invoices, receipts, and revenue' },
  { id: 'client_requests', label: 'Client Requests', desc: 'Customer portal support requests and tickets' },
  { id: 'trufocus_ai', label: 'Trufocus AI', desc: 'AI assistant and automated captioning' },
  { id: 'reports', label: 'Reports', desc: 'Exportable analytics and performance reports' },
  { id: 'settings', label: 'Settings', desc: 'System configuration, services, and team access' },
]

export function TeamAccessTab() {
  const [activeTab, setActiveTab] = useState<'library' | 'assignment' | 'matrix'>('library')
  const [roles, setRoles] = useState<RolePermissionConfig[]>(() => loadAllRoleConfigs())
  const [selectedRoleId, setSelectedRoleId] = useState<string>('manager')
  const [employees, setEmployees] = useState<UserAccount[]>([])

  // New Role Modal State
  const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false)
  const [newStage, setNewStage] = useState<ProductionStage>('on_production')
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')
  const [newRoleModules] = useState<Record<CrmModuleId, ModuleCrudPermission>>(() => {
    const res = {} as Record<CrmModuleId, ModuleCrudPermission>
    MODULE_DEFINITIONS.forEach((m) => {
      res[m.id] = { view: true, create: false, edit: false, delete: false, approve: false, export_share: false }
    })
    return res
  })

  // Role Assignment Filter & Search
  const [searchQuery, setSearchQuery] = useState('')

  // Multi-Role Assignment Drawer State
  const [assigningWorkRolesEmp, setAssigningWorkRolesEmp] = useState<UserAccount | null>(null)
  const [drawerWorkRoleIds, setDrawerWorkRoleIds] = useState<Set<string>>(new Set())
  const [drawerSearch, setDrawerSearch] = useState('')

  // Confirmation Modal State for Role Removal
  const [confirmRemoveRole, setConfirmRemoveRole] = useState<{
    empId: string
    empName: string
    roleId: string
    roleName: string
  } | null>(null)

  const refreshRoles = () => {
    setRoles(loadAllRoleConfigs())
  }

  const loadData = async () => {
    refreshRoles()
    const emps = await fetchAllEmployeesFromCloud()
    setEmployees(emps)
  }

  useEffect(() => {
    loadData()
    const handleSync = () => loadData()
    window.addEventListener('workOrdersUpdated', handleSync)
    window.addEventListener('trufocus_cloud_synced', handleSync)
    window.addEventListener('trufocus_employee_work_roles_updated', handleSync)
    return () => {
      window.removeEventListener('workOrdersUpdated', handleSync)
      window.removeEventListener('trufocus_cloud_synced', handleSync)
      window.removeEventListener('trufocus_employee_work_roles_updated', handleSync)
    }
  }, [])

  // Group roles by stage
  const groupedRoles = useMemo(() => {
    const map: Record<ProductionStage, RolePermissionConfig[]> = {
      pre_production: [],
      on_production: [],
      post_production: [],
      management: [],
    }

    roles.forEach((r) => {
      const stage = r.production_stage || 'management'
      if (!map[stage]) map[stage] = []
      map[stage].push(r)
    })

    return map
  }, [roles])

  // Handlers
  const handleCreateRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) {
      toast.error('Role name is required')
      return
    }

    createCustomRole(newRoleName.trim(), newRoleDesc, newStage, newRoleModules)
    refreshRoles()
    setIsNewRoleModalOpen(false)
    setNewRoleName('')
    setNewRoleDesc('')
    toast.success(`✅ Created custom role '${newRoleName}'!`)
  }

  const handleDeleteRole = (roleId: string, roleName: string) => {
    if (window.confirm(`Are you sure you want to delete role '${roleName}'?`)) {
      const success = deleteRole(roleId)
      if (success) {
        refreshRoles()
        toast.success(`Deleted role '${roleName}'`)
      } else {
        toast.error('Cannot delete system default role')
      }
    }
  }

  const handleOpenAssignWorkRolesDrawer = (emp: UserAccount) => {
    setAssigningWorkRolesEmp(emp)
    const currentIds = getWorkRoleIdsForEmployee(emp.id)
    setDrawerWorkRoleIds(new Set(currentIds))
    setDrawerSearch('')
  }

  const handleSaveDrawerWorkRoles = () => {
    if (!assigningWorkRolesEmp) return
    syncEmployeeWorkRoles(
      assigningWorkRolesEmp.id,
      Array.from(drawerWorkRoleIds)
    )
    toast.success(`Updated work roles for ${assigningWorkRolesEmp.employee_name || assigningWorkRolesEmp.full_name}`)
    setAssigningWorkRolesEmp(null)
    loadData()
  }

  const handleToggleDrawerRole = (roleId: string) => {
    const next = new Set(drawerWorkRoleIds)
    if (next.has(roleId)) {
      next.delete(roleId)
    } else {
      next.add(roleId)
    }
    setDrawerWorkRoleIds(next)
  }

  const handleModulePermissionToggle = (roleId: string, moduleId: CrmModuleId, key: keyof ModuleCrudPermission) => {
    const updated = roles.map((r) => {
      if (r.role_id === roleId) {
        const currentMod = r.modules[moduleId] || { view: false, create: false, edit: false, delete: false, approve: false, export_share: false }
        return {
          ...r,
          modules: {
            ...r.modules,
            [moduleId]: {
              ...currentMod,
              [key]: !currentMod[key],
            },
          },
        }
      }
      return r
    })

    setRoles(updated)
    saveAllRoleConfigs(updated)
    toast.success('Permissions updated successfully!')
  }

  const selectedRole = roles.find((r) => r.role_id === selectedRoleId) || roles[0]

  return (
    <div className="space-y-6 font-sans">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('library')}
            className={cn(
              'px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer',
              activeTab === 'library'
                ? 'bg-[#5B3FD9] text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <Layers size={15} /> Role Library (4 Stages)
          </button>

          <button
            onClick={() => setActiveTab('assignment')}
            className={cn(
              'px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer',
              activeTab === 'assignment'
                ? 'bg-[#5B3FD9] text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <Users size={15} /> Multi-Role Assignment
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={cn(
              'px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer',
              activeTab === 'matrix'
                ? 'bg-[#5B3FD9] text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <Sliders size={15} /> Permission Matrix & Audit
          </button>
        </div>
      </div>

      {/* ─── TAB 1: ROLE LIBRARY (4 STAGES) ─── */}
      {activeTab === 'library' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div>
              <h2 className="text-xl font-bold text-[#111827]">Role Library</h2>
              <p className="text-xs text-gray-500">Roles grouped by photography production stage.</p>
            </div>
            <button
              onClick={() => setIsNewRoleModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[#5B3FD9] hover:bg-[#4C34C3] text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 cursor-pointer"
            >
              <Plus size={16} /> New role
            </button>
          </div>

          {(
            [
              { stage: 'pre_production', title: 'Pre-Production' },
              { stage: 'on_production', title: 'On-Production' },
              { stage: 'post_production', title: 'Post-Production' },
              { stage: 'management', title: 'Management / Other' },
            ] as const
          ).map(({ stage, title }) => {
            const stageRoles = groupedRoles[stage] || []

            return (
              <div key={stage} className="space-y-3">
                <h3 className="text-sm font-bold text-[#111827]">{title}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stageRoles.map((r) => {
                    const isDefault = r.is_default || !r.is_custom

                    return (
                      <div
                        key={r.role_id}
                        className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs hover:border-[#5B3FD9] transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-gray-900 text-base">{r.role_name}</h4>
                            <span className="text-xs text-gray-400 font-medium block mt-0.5">{title}</span>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#5B3FD9] shrink-0 shadow-2xs">
                            {isDefault ? 'Default' : 'Custom'}
                          </span>
                        </div>

                        {!isDefault ? (
                          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedRoleId(r.role_id)
                                setActiveTab('matrix')
                              }}
                              className="px-4 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Edit3 size={13} /> Edit
                            </button>

                            <button
                              onClick={() => handleDeleteRole(r.role_id, r.role_name)}
                              className="px-4 py-1.5 text-xs font-bold rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── TAB 2: ROLE ASSIGNMENT ─── */}
      {activeTab === 'assignment' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-[#E5E7EB]">
                    <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Employee</th>
                    <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Type</th>
                    <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Workspace Role</th>
                    <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Assigned Work Roles</th>
                    <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {employees
                    .filter((e) => {
                      const name = e.employee_name || e.full_name || ''
                      return !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase()) || e.email.toLowerCase().includes(searchQuery.toLowerCase())
                    })
                    .map((emp) => {
                      const empName = emp.employee_name || emp.full_name || 'Staff Member'
                      const workspaceRole = emp.workspace_role || 'staff'
                      const assignedWorkRoles = getWorkRolesForEmployee(emp.id)

                      return (
                        <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-full bg-[#5B3FD9]/15 text-[#5B3FD9] font-bold flex items-center justify-center text-xs shrink-0">
                                {empName.charAt(0)}
                              </div>
                              <div>
                                <span className="block font-bold text-gray-900">{empName}</span>
                                <span className="font-mono text-[11px] text-gray-400">{emp.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                              {emp.employment_type === 'freelancer' ? 'Freelancer' : 'In-House'}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          </td>

                          <td className="p-4 font-bold text-gray-800">
                            <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 border border-gray-200 font-extrabold text-[11px] capitalize">
                              {workspaceRole}
                            </span>
                          </td>

                          <td className="p-4">
                            {assignedWorkRoles.length === 0 ? (
                              <span className="text-gray-400 italic text-[11px]">No work roles assigned</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5 max-w-md">
                                {assignedWorkRoles.map((role) => (
                                  <span
                                    key={role.role_id}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-[#5B3FD9]/10 text-[#5B3FD9] border border-[#5B3FD9]/30"
                                  >
                                    <span>{role.role_name}</span>
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#5B3FD9] text-white">
                                      {role.is_default || !role.is_custom ? 'Default' : 'Custom'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setConfirmRemoveRole({
                                          empId: emp.id,
                                          empName,
                                          roleId: role.role_id,
                                          roleName: role.role_name,
                                        })
                                      }
                                      className="hover:text-red-600 font-bold transition-colors ml-0.5 cursor-pointer text-xs"
                                      title="Remove role"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenAssignWorkRolesDrawer(emp)}
                              className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white cursor-pointer shadow-2xs"
                            >
                              + Assign Role
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: PERMISSION MATRIX & AUDIT ─── */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-700">Select Role to Edit:</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold text-xs text-gray-900 focus:outline-none"
              >
                {roles.map((r) => (
                  <option key={r.role_id} value={r.role_id}>
                    {r.role_name} ({r.production_stage || 'management'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedRole && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
              <div className="p-5 border-b border-gray-200 bg-gray-50/50">
                <h3 className="ui-card-title text-[20px] font-bold text-[#1E293B]">
                  Editing Permissions: {selectedRole.role_name}
                </h3>
                <p className="ui-small-label text-[13px] text-gray-500 mt-0.5">{selectedRole.description}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-[#E5E7EB]">
                      <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Module</th>
                      <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider text-center">View</th>
                      <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider text-center">Create</th>
                      <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider text-center">Edit</th>
                      <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {MODULE_DEFINITIONS.map((m) => {
                      const modPerm = selectedRole.modules[m.id] || { view: false, create: false, edit: false, delete: false }
                      return (
                        <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="p-4 font-bold text-gray-900">
                            <div>
                              <span className="block font-bold text-gray-900">{m.label}</span>
                              <span className="text-[11px] text-gray-400">{m.desc}</span>
                            </div>
                          </td>

                          {(['view', 'create', 'edit', 'delete'] as const).map((key) => (
                            <td key={key} className="p-4 text-center">
                              <input
                                type="checkbox"
                                checked={Boolean(modPerm[key])}
                                disabled={selectedRole.role_id === 'owner'}
                                onChange={() => handleModulePermissionToggle(selectedRole.role_id, m.id, key)}
                                className="size-4 text-[#5B3FD9] rounded border-gray-300 focus:ring-[#5B3FD9] cursor-pointer"
                              />
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── MULTI-WORK ROLE ASSIGNMENT DRAWER / MODAL ─── */}
      {assigningWorkRolesEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Assign Work Roles
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Select work roles for <strong className="text-gray-900">{assigningWorkRolesEmp.employee_name || assigningWorkRolesEmp.full_name}</strong>
                </p>
              </div>
              <button onClick={() => setAssigningWorkRolesEmp(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            {/* Search Role */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Roles..."
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            {/* Role List Grouped by Stage */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {(
                [
                  { stage: 'pre_production', title: 'Pre-Production' },
                  { stage: 'on_production', title: 'On-Production' },
                  { stage: 'post_production', title: 'Post-Production' },
                  { stage: 'management', title: 'Management' },
                ] as const
              ).map(({ stage, title }) => {
                const stageRoles = (groupedRoles[stage] || []).filter((r) =>
                  !drawerSearch || r.role_name.toLowerCase().includes(drawerSearch.toLowerCase())
                )

                if (stageRoles.length === 0) return null

                return (
                  <div key={stage} className="space-y-2">
                    <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">{title}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {stageRoles.map((r) => {
                        const isChecked = drawerWorkRoleIds.has(r.role_id)
                        return (
                          <label
                            key={r.role_id}
                            onClick={() => handleToggleDrawerRole(r.role_id)}
                            className={cn(
                              'p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-xs font-bold',
                              isChecked
                                ? 'bg-purple-50 border-[#5B3FD9] text-[#5B3FD9] shadow-2xs'
                                : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
                            )}
                          >
                            <span className="truncate pr-2">{r.role_name}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="size-4 text-[#5B3FD9] rounded border-gray-300 pointer-events-none"
                            />
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Selected Roles Preview */}
            <div className="pt-3 border-t border-gray-200 space-y-2">
              <span className="text-xs font-extrabold text-gray-800 block">
                Selected Roles ({drawerWorkRoleIds.size})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-gray-50 rounded-2xl border border-gray-200">
                {Array.from(drawerWorkRoleIds).length === 0 ? (
                  <span className="text-gray-400 italic text-xs">No roles selected</span>
                ) : (
                  Array.from(drawerWorkRoleIds).map((roleId) => {
                    const r = roles.find((x) => x.role_id === roleId)
                    const roleName = r?.role_name || roleId
                    return (
                      <span
                        key={roleId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-[#5B3FD9] text-white shadow-2xs"
                      >
                        {roleName}
                        <button
                          type="button"
                          onClick={() => handleToggleDrawerRole(roleId)}
                          className="hover:text-red-200 transition-colors ml-0.5 cursor-pointer font-bold"
                          title="Uncheck role"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => setAssigningWorkRolesEmp(null)}
                className="px-4 h-9 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDrawerWorkRoles}
                className="px-6 h-9 text-xs font-extrabold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] shadow-md shadow-[#5B3FD9]/20 cursor-pointer"
              >
                Save Roles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REMOVE ROLE CONFIRMATION MODAL ─── */}
      {confirmRemoveRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-base text-gray-900">Remove Role</h3>
              <button onClick={() => setConfirmRemoveRole(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Remove role <strong className="text-gray-900 font-extrabold">{confirmRemoveRole.roleName}</strong> from <strong className="text-gray-900 font-extrabold">{confirmRemoveRole.empName}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setConfirmRemoveRole(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeWorkRoleFromEmployee(confirmRemoveRole.empId, confirmRemoveRole.roleId)
                  loadData()
                  toast.success(`Removed ${confirmRemoveRole.roleName} from ${confirmRemoveRole.empName}`)
                  setConfirmRemoveRole(null)
                }}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-md shadow-red-600/20"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── NEW ROLE MODAL ─── */}
      {isNewRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-extrabold text-gray-900">Create New Custom Role</h3>
              <button onClick={() => setIsNewRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Production Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as ProductionStage)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                >
                  <option value="pre_production">Pre-Production (Sales & Enquiries)</option>
                  <option value="on_production">On-Production (Photography & Videography)</option>
                  <option value="post_production">Post-Production (Editing & Design)</option>
                  <option value="management">Management & Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Drone Pilot, Colorist, Sales Lead"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe operational responsibilities..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewRoleModalOpen(false)}
                  className="px-4 h-10 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 h-10 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] shadow-md shadow-[#5B3FD9]/20"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
