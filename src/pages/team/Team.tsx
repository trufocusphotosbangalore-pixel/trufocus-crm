import { useState, useMemo } from 'react'
import {
  Users, Plus, Download, Search, RotateCcw,
} from 'lucide-react'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import {
  getTeamMembers,
  deleteTeamMember,
  exportTeamToCSV,
} from '@/services/teamStore'
import { TeamTable } from '@/components/team/TeamTable'
import { AddEditTeamMemberModal } from '@/components/team/AddEditTeamMemberModal'
import { AddTeamMemberWizardModal } from '@/components/team/AddTeamMemberWizardModal'
import { TeamMemberProfileDrawer } from '@/components/team/TeamMemberProfileDrawer'
import type { TeamMember, TeamType } from '@/types/team'
import { DEPARTMENTS, ALL_JOB_ROLES } from '@/types/team'
import { useTeamPermissions } from '@/hooks/useTeamPermissions'
import { toast } from 'react-hot-toast'

export default function Team() {
  const { hasPermission } = useTeamPermissions()
  const [members, setMembers] = useState<TeamMember[]>(() => getTeamMembers())
  const [activeTab, setActiveTab] = useState<TeamType>('in_house')

  // Search & Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [deptFilter, setDeptFilter] = useState<string>('all')
  const [availFilter, setAvailFilter] = useState<string>('all')

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null)

  const [selectedDrawerMember, setSelectedDrawerMember] = useState<TeamMember | null>(null)

  // Real-time synchronization
  useRealtimeSync(() => {
    setMembers(getTeamMembers())
  })

  const refreshList = () => {
    setMembers(getTeamMembers())
  }

  // Counts
  const inHouseMembers = useMemo(() => members.filter((m) => m.team_type === 'in_house'), [members])
  const freelancerMembers = useMemo(() => members.filter((m) => m.team_type === 'freelancer'), [members])

  const totalAvailable = members.filter((m) => m.availability === 'available').length
  const totalBusy = members.filter((m) => m.availability === 'busy').length

  // Active Tab list with filters applied
  const tabMembers = activeTab === 'in_house' ? inHouseMembers : freelancerMembers

  const filteredMembers = useMemo(() => {
    return tabMembers.filter((m) => {
      const query = search.toLowerCase()
      const matchesSearch =
        !search ||
        m.full_name.toLowerCase().includes(query) ||
        m.employee_id.toLowerCase().includes(query) ||
        (m.job_roles && m.job_roles.some((r) => r.toLowerCase().includes(query))) ||
        (m.job_role && m.job_role.toLowerCase().includes(query)) ||
        m.mobile_number.toLowerCase().includes(query) ||
        (m.email_address && m.email_address.toLowerCase().includes(query))

      const matchesRole =
        roleFilter === 'all' ||
        (m.job_roles && m.job_roles.some((r) => r.toLowerCase().includes(roleFilter.toLowerCase()))) ||
        (m.job_role && m.job_role.toLowerCase().includes(roleFilter.toLowerCase()))
      const matchesDept = deptFilter === 'all' || m.department === deptFilter
      const matchesAvail = availFilter === 'all' || m.availability === availFilter

      return matchesSearch && matchesRole && matchesDept && matchesAvail
    })
  }, [tabMembers, search, roleFilter, deptFilter, availFilter])

  const handleOpenAddModal = () => {
    setMemberToEdit(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (m: TeamMember) => {
    setMemberToEdit(m)
    setIsModalOpen(true)
  }

  const handleDeleteMember = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete team member ${name}?`)) {
      deleteTeamMember(id)
      toast.success(`Deleted ${name} from Team master database.`)
      refreshList()
    }
  }

  const handleCSVExport = () => {
    exportTeamToCSV(activeTab)
    toast.success(`Exported ${activeTab === 'in_house' ? 'In-House' : 'Freelancer'} team to CSV!`)
  }

  const handleResetFilters = () => {
    setSearch('')
    setRoleFilter('all')
    setDeptFilter('all')
    setAvailFilter('all')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <Users size={20} />
            </span>
            <h1 className="text-xl font-extrabold text-[#111827]">Team Management</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Master database of all photographers, videographers, editors & staff for Work Order assignments
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCSVExport}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <Download size={14} /> Export CSV
          </button>

          {hasPermission('team', 'create') && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-md shadow-[#5B3FD9]/20 transition-colors cursor-pointer"
            >
              <Plus size={15} /> Add Team Member
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Stats Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Top 2 Tabs */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <button
            onClick={() => setActiveTab('in_house')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'in_house'
                ? 'bg-[#5B3FD9] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            In-House Team ({inHouseMembers.length})
          </button>

          <button
            onClick={() => setActiveTab('freelancer')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'freelancer'
                ? 'bg-[#5B3FD9] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Freelancers ({freelancerMembers.length})
          </button>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-emerald-700 font-bold shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500" /> {totalAvailable} Available Now
          </span>
          <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-amber-700 font-bold shadow-2xs">
            <span className="size-2 rounded-full bg-amber-500" /> {totalBusy} Busy on Shoots
          </span>
        </div>
      </div>

      {/* Search & Sticky Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, role, mobile, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
          />
        </div>

        {/* Job Role Filter */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-400 text-[10px] uppercase">Job Role</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-bold focus:outline-none focus:border-[#5B3FD9]"
          >
            <option value="all">All Roles</option>
            {ALL_JOB_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-400 text-[10px] uppercase">Department</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-bold focus:outline-none focus:border-[#5B3FD9]"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Availability Filter */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-400 text-[10px] uppercase">Availability</span>
          <select
            value={availFilter}
            onChange={(e) => setAvailFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-bold focus:outline-none focus:border-[#5B3FD9]"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Reset */}
        {(search || deptFilter !== 'all' || availFilter !== 'all') && (
          <button
            onClick={handleResetFilters}
            className="px-3 h-9 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center gap-1"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {/* Team Table */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center text-xs text-gray-500 font-sans">
          No team members found matching your search criteria.
        </div>
      ) : (
        <TeamTable
          members={filteredMembers}
          onViewProfile={(m) => setSelectedDrawerMember(m)}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteMember}
        />
      )}

      {/* Add / Edit Popup Modal */}
      {isModalOpen && !memberToEdit && (
        <AddTeamMemberWizardModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={refreshList}
        />
      )}

      {isModalOpen && memberToEdit && (
        <AddEditTeamMemberModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          memberToEdit={memberToEdit}
          defaultType={activeTab}
          onSaved={refreshList}
        />
      )}

      {/* Profile Details Slide-Over Drawer */}
      {selectedDrawerMember && (
        <TeamMemberProfileDrawer
          isOpen={!!selectedDrawerMember}
          onClose={() => setSelectedDrawerMember(null)}
          member={selectedDrawerMember}
        />
      )}
    </div>
  )
}
