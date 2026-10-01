import React, { useState, useEffect } from 'react'
import {
  Briefcase, Plus, Search, Edit2, Trash2, Power, X, Save,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  getAllJobRoles, saveJobRole, toggleJobRoleStatus, deleteJobRole,
  type JobRoleItem, type JobRoleCategory,
} from '@/services/jobRolesStore'
import { toast } from 'react-hot-toast'

const CATEGORIES: JobRoleCategory[] = [
  'Photography',
  'Videography',
  'Editing',
  'Production',
  'Studio',
  'Technical',
  'Custom',
]

const CATEGORY_COLORS: Record<JobRoleCategory, { bg: string; text: string; border: string }> = {
  Photography: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Videography: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Editing: { bg: 'bg-[#5B3FD9]/10', text: 'text-[#5B3FD9]', border: 'border-[#5B3FD9]/20' },
  Production: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Studio: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Technical: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Custom: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
}

export function JobRolesTab() {
  const [roles, setRoles] = useState<JobRoleItem[]>(() => getAllJobRoles())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<JobRoleItem | null>(null)
  const [roleName, setRoleName] = useState('')
  const [category, setCategory] = useState<JobRoleCategory>('Photography')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    const handleUpdate = () => setRoles(getAllJobRoles())
    window.addEventListener('trufocus_job_roles_updated', handleUpdate)
    return () => window.removeEventListener('trufocus_job_roles_updated', handleUpdate)
  }, [])

  const handleOpenAddModal = () => {
    setEditingRole(null)
    setRoleName('')
    setCategory('Photography')
    setDescription('')
    setIsActive(true)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (role: JobRoleItem) => {
    setEditingRole(role)
    setRoleName(role.role_name)
    setCategory(role.category || 'Custom')
    setDescription(role.description || '')
    setIsActive(role.is_active)
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName.trim()) {
      toast.error('Role name is required.')
      return
    }

    saveJobRole({
      id: editingRole?.id,
      role_name: roleName,
      category,
      description,
      is_active: isActive,
    })

    setRoles(getAllJobRoles())
    setIsModalOpen(false)
    toast.success(editingRole ? 'Job role updated!' : '🎉 New Job Role added successfully!')
  }

  const handleToggleStatus = (id: string) => {
    toggleJobRoleStatus(id)
    setRoles(getAllJobRoles())
    toast.success('Job role status updated.')
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete job role "${name}"?`)) {
      deleteJobRole(id)
      setRoles(getAllJobRoles())
      toast.success('Job role deleted.')
    }
  }

  // Filter roles
  const filteredRoles = roles.filter((role) => {
    const matchesSearch = role.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || role.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const activeCount = roles.filter((r) => r.is_active).length

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Title */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-[#111827]">Job Roles Master Management</h3>
            <span className="text-[10px] font-extrabold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-0.5 rounded-full border border-[#5B3FD9]/20">
              {roles.length} Master Roles
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Create, edit, categorize, and control eligibility of job roles used across Team Members, Work Orders, and Event Assignments.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 h-10 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={15} /> Add Custom Job Role
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium">
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total Roles</span>
          <span className="font-extrabold text-lg text-[#111827]">{roles.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Active Eligible</span>
          <span className="font-extrabold text-lg text-emerald-600">{activeCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B3FD9] block">Role Categories</span>
          <span className="font-extrabold text-lg text-[#5B3FD9]">{CATEGORIES.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Custom Roles</span>
          <span className="font-extrabold text-lg text-amber-600">
            {roles.filter((r) => r.category === 'Custom' || !CATEGORIES.slice(0, 6).includes(r.category)).length}
          </span>
        </div>
      </div>

      {/* Search & Category Filter Chips */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={15} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search job roles e.g. Drone Pilot, Traditional Photographer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#5B3FD9] bg-gray-50/50"
            />
          </div>

          <span className="text-[10px] text-gray-400 font-bold uppercase">Showing {filteredRoles.length} Roles</span>
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer',
              selectedCategory === 'all'
                ? 'bg-[#5B3FD9] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            All Categories ({roles.length})
          </button>

          {CATEGORIES.map((cat) => {
            const count = roles.filter((r) => r.category === cat).length
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5',
                  isSelected
                    ? 'bg-[#5B3FD9] text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
              >
                <span>{cat}</span>
                <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-mono', isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600')}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map((role) => {
          const colors = CATEGORY_COLORS[role.category] || CATEGORY_COLORS.Custom

          return (
            <div
              key={role.id}
              className={cn(
                'bg-white rounded-2xl border p-4 shadow-2xs space-y-3 flex flex-col justify-between transition-all hover:shadow-xs',
                role.is_active ? 'border-[#E5E7EB]' : 'border-gray-200 bg-gray-50/50 opacity-75'
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border', colors.bg, colors.text, colors.border)}>
                    {role.category}
                  </span>

                  <button
                    onClick={() => handleToggleStatus(role.id)}
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer border transition-colors',
                      role.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                    )}
                  >
                    <Power size={10} />
                    <span>{role.is_active ? 'Active' : 'Disabled'}</span>
                  </button>
                </div>

                <h4 className="font-extrabold text-sm text-[#111827] flex items-center gap-1.5">
                  <Briefcase size={15} className="text-[#5B3FD9] shrink-0" />
                  <span>{role.role_name}</span>
                </h4>

                {role.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {role.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-gray-400 font-mono">ID: {role.id}</span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(role)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Edit Role"
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    onClick={() => handleDelete(role.id, role.role_name)}
                    className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete Role"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: Add/Edit Job Role */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center font-bold">
                  <Briefcase size={16} />
                </div>
                <h3 className="font-extrabold text-base text-[#111827]">
                  {editingRole ? 'Edit Job Role' : 'Add New Job Role'}
                </h3>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-medium">
              {/* Role Name */}
              <div className="space-y-1">
                <label className="block font-bold uppercase tracking-wider text-gray-600 text-[10px]">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Photographer, Reels Editor..."
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-gray-200 font-bold text-[#111827] focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="block font-bold uppercase tracking-wider text-gray-600 text-[10px]">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as JobRoleCategory)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-gray-200 font-bold text-[#111827] focus:outline-none focus:border-[#5B3FD9]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block font-bold uppercase tracking-wider text-gray-600 text-[10px]">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of duties or eligibility criteria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-gray-200 text-gray-800 focus:outline-none focus:border-[#5B3FD9] resize-none"
                />
              </div>

              {/* Status Toggle */}
              <div className="pt-1 flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div>
                  <span className="block font-bold text-[#111827]">Job Role Active Status</span>
                  <span className="text-[10px] text-gray-500">Active roles appear in Team Member dropdowns</span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5B3FD9]"></div>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-10 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Save size={14} /> Save Job Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
