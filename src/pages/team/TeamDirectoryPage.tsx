import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Plus, Search, ShieldCheck, Download,
  UserCheck, UserX, Trash2, Phone, Copy, Check, Eye, Pencil,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  fetchAllEmployeesFromCloud,
  deleteEmployeeFromCloud,
  updateEmployeeInCloud,
  type UserAccount,
} from '@/services/employeeService'
import { getWorkRolesForEmployee } from '@/services/employeeWorkRolesService'
import { getStaffPortalRecord } from '@/services/crewAuthService'
import { getTeamMemberFromAccount } from '@/services/teamStore'
import type { TeamMember } from '@/types/team'
import { AddTeamMemberWizardModal } from '@/components/team/AddTeamMemberWizardModal'
import { AddEditTeamMemberModal } from '@/components/team/AddEditTeamMemberModal'
import { TeamMemberProfileDrawer } from '@/components/team/TeamMemberProfileDrawer'
import { ShareStaffPortalModal } from '@/components/team/ShareStaffPortalModal'
import { toast } from 'react-hot-toast'

export default function TeamDirectoryPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<UserAccount[]>([])

  // Add Wizard Full-Page Modal
  const [isAddWizardOpen, setIsAddWizardOpen] = useState(false)

  // View & Edit Modal States
  const [selectedViewMember, setSelectedViewMember] = useState<TeamMember | null>(null)
  const [selectedEditMember, setSelectedEditMember] = useState<TeamMember | null>(null)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'date'>('name')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Staff Portal Sharing Modal State
  const [shareModalEmp, setShareModalEmp] = useState<UserAccount | null>(null)

  const loadData = async () => {
    try {
      const data = await fetchAllEmployeesFromCloud()
      setEmployees(data)
    } catch (e) {
      console.error('[TeamDirectoryPage] Error loading team data:', e)
    }
  }

  useEffect(() => {
    loadData()

    const handleSync = () => loadData()
    window.addEventListener('trufocus_employee_updated', handleSync)
    return () => window.removeEventListener('trufocus_employee_updated', handleSync)
  }, [])

  // KPI Metrics Calculation
  const stats = useMemo(() => {
    const total = employees.length
    const active = employees.filter((e) => e.account_status === 'active' || e.is_active !== false).length
    const inHouse = employees.filter((e) => (e.employment_type || e.team_type) === 'in_house').length
    const freelancers = employees.filter((e) => (e.employment_type || e.team_type) === 'freelancer' || (e.employment_type || e.team_type) === 'vendor').length
    const managers = employees.filter((e) => (e.system_role || '').toLowerCase() === 'admin' || (e.workspace_role || '').toLowerCase() === 'manager' || (e.workspace_role || '').toLowerCase() === 'owner').length

    return { total, active, inHouse, freelancers, managers }
  }, [employees])

  // Filtered & Sorted Employees
  const filteredEmployees = useMemo(() => {
    return employees
      .filter((e) => {
        const q = search.toLowerCase()
        const name = (e.employee_name || e.full_name || '').toLowerCase()
        const email = (e.email || '').toLowerCase()
        const mobile = (e.mobile || e.mobile_number || '').toLowerCase()
        const empId = (e.employee_id || '').toLowerCase()

        const matchesSearch = !search || name.includes(q) || email.includes(q) || mobile.includes(q) || empId.includes(q)

        const empType = e.employment_type || e.team_type || 'in_house'
        const matchesType = typeFilter === 'all' || empType === typeFilter

        const empStatus = e.account_status || (e.is_active !== false ? 'active' : 'inactive')
        const matchesStatus = statusFilter === 'all' || empStatus === statusFilter

        const wsRole = e.workspace_role || e.role_id || 'staff'
        const matchesRole = roleFilter === 'all' || wsRole === roleFilter

        return matchesSearch && matchesType && matchesStatus && matchesRole
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return (a.employee_name || a.full_name || '').localeCompare(b.employee_name || b.full_name || '')
        }
        if (sortBy === 'role') {
          return (a.role_name || a.workspace_role || '').localeCompare(b.role_name || b.workspace_role || '')
        }
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      })
  }, [employees, search, typeFilter, statusFilter, roleFilter, sortBy])

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Employee ID,Full Name,Email,Mobile,Type,Workspace Role,System Role,Status,Created At']
    const rows = filteredEmployees.map(
      (e) =>
        `"${e.employee_id || ''}","${e.employee_name || e.full_name || ''}","${e.email || ''}","${e.mobile || ''}","${e.employment_type || 'in_house'}","${e.workspace_role || 'staff'}","${e.system_role || 'staff'}","${e.account_status || 'active'}","${e.created_at || ''}"`
    )
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Team_Directory_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Team Directory CSV exported successfully!')
  }

  const handleShareLoginDetails = (emp: UserAccount) => {
    const text = `🔑 Trufocus CRM Credentials:\nEmail: ${emp.email}\nTemp Password: ${emp.plain_temp_password || 'Password@123'}\nLogin URL: ${window.location.origin}/login`
    navigator.clipboard.writeText(text)
    setCopiedId(emp.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success(`Copied login credentials for ${emp.employee_name || emp.full_name}!`)
  }

  const handleDeactivate = async (emp: UserAccount) => {
    const newStatus = emp.account_status === 'active' ? 'inactive' : 'active'
    await updateEmployeeInCloud(emp.id, { account_status: newStatus })
    toast.success(`Updated status to ${newStatus} for ${emp.employee_name || emp.full_name}`)
    loadData()
  }

  const handleDelete = async (emp: UserAccount) => {
    if (window.confirm(`Are you sure you want to delete ${emp.employee_name || emp.full_name}?`)) {
      await deleteEmployeeFromCloud(emp.id)
      toast.success(`Deleted ${emp.employee_name || emp.full_name}`)
      loadData()
    }
  }

  if (isAddWizardOpen) {
    return (
      <AddTeamMemberWizardModal
        isOpen={true}
        onClose={() => {
          setIsAddWizardOpen(false)
          loadData()
        }}
        onSaved={() => {
          setIsAddWizardOpen(false)
          loadData()
        }}
      />
    )
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* ─── Header Card ─── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="p-3 rounded-2xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <Users size={26} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-1 rounded-md text-xs">
                  TEAM MANAGEMENT
                </span>
                <h1 className="ui-page-title text-[32px] font-extrabold text-[#111827]">Team Directory</h1>
              </div>
              <p className="ui-small-label text-[13px] text-gray-500 mt-1">
                Manage in-house staff, freelancers, roles, dashboard logins, and permission assignments.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/team/roles')}
              className="ui-button-text text-[15px] px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-2 cursor-pointer font-bold"
            >
              <ShieldCheck size={16} /> Roles & Access
            </button>

            <button
              onClick={handleExportCSV}
              className="ui-button-text text-[15px] px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-2 cursor-pointer font-bold"
            >
              <Download size={16} /> Export CSV
            </button>

            <button
              onClick={() => setIsAddWizardOpen(true)}
              className="ui-button-text text-[15px] px-6 py-2.5 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 cursor-pointer font-extrabold"
            >
              <Plus size={18} /> Add Team Member
            </button>
          </div>
        </div>
      </div>

      {/* ─── Summary Cards Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <span className="ui-small-label text-gray-400 font-bold uppercase tracking-wider block text-[11px] mb-1">Total Team</span>
          <span className="font-mono text-2xl font-extrabold text-[#111827]">{stats.total}</span>
          <span className="text-xs text-gray-500 block mt-1">Configured Accounts</span>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 p-5 shadow-xs">
          <span className="ui-small-label text-emerald-700 font-bold uppercase tracking-wider block text-[11px] mb-1">Active Staff</span>
          <span className="font-mono text-2xl font-extrabold text-emerald-700">{stats.active}</span>
          <span className="text-xs text-emerald-600 block mt-1">Active Status</span>
        </div>

        <div className="bg-white rounded-2xl border border-blue-200 bg-blue-50/20 p-5 shadow-xs">
          <span className="ui-small-label text-blue-700 font-bold uppercase tracking-wider block text-[11px] mb-1">In-House Staff</span>
          <span className="font-mono text-2xl font-extrabold text-blue-700">{stats.inHouse}</span>
          <span className="text-xs text-blue-600 block mt-1">Fixed Payroll / Salary</span>
        </div>

        <div className="bg-white rounded-2xl border border-purple-200 bg-purple-50/20 p-5 shadow-xs">
          <span className="ui-small-label text-purple-700 font-bold uppercase tracking-wider block text-[11px] mb-1">Freelancers</span>
          <span className="font-mono text-2xl font-extrabold text-[#5B3FD9]">{stats.freelancers}</span>
          <span className="text-xs text-purple-600 block mt-1">Per Project / Shoot</span>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/20 p-5 shadow-xs">
          <span className="ui-small-label text-amber-700 font-bold uppercase tracking-wider block text-[11px] mb-1">Managers & Admins</span>
          <span className="font-mono text-2xl font-extrabold text-amber-700">{stats.managers}</span>
          <span className="text-xs text-amber-600 block mt-1">Full System Access</span>
        </div>
      </div>

      {/* ─── Filters & Search Bar ─── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone or employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-800 focus:outline-none"
          >
            <option value="all">All Employment Types</option>
            <option value="in_house">In-House Staff</option>
            <option value="freelancer">Freelancer / Vendor</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-800 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-800 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="owner">Studio Owner</option>
            <option value="administrator">Administrator</option>
            <option value="manager">Studio Manager</option>
            <option value="photographer">Photographer</option>
            <option value="videographer">Videographer</option>
            <option value="editor">Editor</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-800 focus:outline-none"
          >
            <option value="name">Sort by Name (A-Z)</option>
            <option value="role">Sort by Role</option>
            <option value="date">Sort by Date Added</option>
          </select>
        </div>
      </div>

      {/* ─── Employee Directory Table ─── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-[#E5E7EB]">
                <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Employee</th>
                <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Contact</th>
                <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Staff Portal</th>
                <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Workspace Role</th>
                <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider">Assigned Work Roles</th>
                <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">
                    No team members found matching search & filter parameters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const empName = emp.employee_name || emp.full_name || emp.username || 'Staff Member'
                  const empType = emp.employment_type || emp.team_type || 'in_house'
                  const isActive = emp.account_status === 'active' || emp.is_active !== false
                  const assignedWorkRoles = getWorkRolesForEmployee(emp.id)
                  const portalRec = getStaffPortalRecord(emp.id)

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-[#5B3FD9]/15 text-[#5B3FD9] font-bold flex items-center justify-center text-sm shrink-0">
                            {empName.charAt(0)}
                          </div>
                          <div>
                            <span className="block font-bold text-gray-900 text-sm">{empName}</span>
                            <span className="font-mono text-[11px] text-gray-400">{emp.employee_id || 'EMP-1001'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="block font-medium text-gray-800">{emp.email}</span>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                            <Phone size={11} /> {emp.mobile || emp.mobile_number || 'N/A'}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-md text-[11px] font-bold border',
                            empType === 'freelancer'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          )}
                        >
                          {empType === 'freelancer' ? 'Freelancer' : 'In-House'}
                        </span>
                      </td>

                      {/* Staff Portal Management Column */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-extrabold border inline-block cursor-pointer',
                              portalRec.portal_enabled
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            )}
                            onClick={() => setShareModalEmp(emp)}
                          >
                            {portalRec.portal_enabled ? 'Portal Enabled' : 'Portal Disabled'}
                          </span>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setShareModalEmp(emp)}
                              className="text-[11px] font-extrabold text-[#5B3FD9] hover:underline cursor-pointer"
                            >
                              Staff Portal & Sharing
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-bold text-gray-800">
                        <span className="px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200 text-gray-800 font-extrabold text-[11px] capitalize">
                          {emp.workspace_role || emp.role_name || 'Staff'}
                        </span>
                      </td>

                      <td className="p-4">
                        {assignedWorkRoles.length === 0 ? (
                          <span className="text-gray-400 italic text-[11px]">No work roles assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {assignedWorkRoles.map((wr) => (
                              <span
                                key={wr.role_id}
                                className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-50 text-[#5B3FD9] border border-purple-200"
                              >
                                {wr.role_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const tm = getTeamMemberFromAccount(emp)
                              setSelectedViewMember(tm)
                            }}
                            title="View Employee Profile"
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => {
                              const tm = getTeamMemberFromAccount(emp)
                              setSelectedEditMember(tm)
                            }}
                            title="Edit Employee Details"
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            onClick={() => handleShareLoginDetails(emp)}
                            title="Copy Login Credentials"
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                          >
                            {copiedId === emp.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>

                          <button
                            onClick={() => handleDeactivate(emp)}
                            title={isActive ? 'Deactivate Account' : 'Activate Account'}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                          >
                            {isActive ? <UserX size={14} className="text-amber-600" /> : <UserCheck size={14} className="text-emerald-600" />}
                          </button>

                          <button
                            onClick={() => handleDelete(emp)}
                            title="Delete Employee"
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {shareModalEmp && (
        <ShareStaffPortalModal
          isOpen={!!shareModalEmp}
          onClose={() => {
            setShareModalEmp(null)
            loadData()
          }}
          employee={shareModalEmp}
        />
      )}

      {selectedViewMember && (
        <TeamMemberProfileDrawer
          isOpen={!!selectedViewMember}
          onClose={() => setSelectedViewMember(null)}
          member={selectedViewMember}
        />
      )}

      {selectedEditMember && (
        <AddEditTeamMemberModal
          isOpen={!!selectedEditMember}
          onClose={() => setSelectedEditMember(null)}
          memberToEdit={selectedEditMember}
          onSaved={() => {
            setSelectedEditMember(null)
            loadData()
          }}
        />
      )}
    </div>
  )
}
