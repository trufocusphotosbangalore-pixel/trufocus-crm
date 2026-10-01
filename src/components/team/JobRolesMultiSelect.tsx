import React, { useState, useRef, useEffect } from 'react'
import { Search, X, Check, ChevronDown } from 'lucide-react'
import { getJobRolesByCategory, type JobRoleCategory } from '@/services/jobRolesStore'

interface JobRolesMultiSelectProps {
  selectedRoles: string[]
  onChange: (roles: string[]) => void
}

export function JobRolesMultiSelect({
  selectedRoles,
  onChange,
}: JobRolesMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [categorizedRoles, setCategorizedRoles] = useState(() => getJobRolesByCategory())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleUpdate = () => setCategorizedRoles(getJobRolesByCategory())
    window.addEventListener('trufocus_job_roles_updated', handleUpdate)
    return () => window.removeEventListener('trufocus_job_roles_updated', handleUpdate)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleToggleRole = (roleName: string) => {
    if (selectedRoles.includes(roleName)) {
      onChange(selectedRoles.filter((r) => r !== roleName))
    } else {
      onChange([...selectedRoles, roleName])
    }
  }

  const handleRemoveRole = (roleName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedRoles.filter((r) => r !== roleName))
  }

  const categories = Object.keys(categorizedRoles) as JobRoleCategory[]
  const filteredCategories = categories.map((cat) => ({
    category: cat,
    roles: (categorizedRoles[cat] || [])
      .map((r) => r.role_name)
      .filter((r) => r.toLowerCase().includes(search.toLowerCase())),
  })).filter((cat) => cat.roles.length > 0)

  return (
    <div className="relative font-sans" ref={containerRef}>
      {/* Selected Badges & Trigger Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[42px] p-2 rounded-2xl border border-gray-200 bg-gray-50 flex flex-wrap items-center gap-1.5 cursor-pointer hover:bg-gray-100/70 focus-within:border-[#5B3FD9] transition-colors"
      >
        {selectedRoles.length === 0 ? (
          <span className="text-xs text-gray-400 font-medium px-2">Select one or more Job Roles...</span>
        ) : (
          selectedRoles.map((role) => (
            <span
              key={role}
              className="inline-flex items-center gap-1 bg-[#5B3FD9] text-white px-2.5 py-1 rounded-xl text-xs font-bold shadow-2xs animate-in zoom-in-95 duration-100"
            >
              {role}
              <button
                type="button"
                onClick={(e) => handleRemoveRole(role, e)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          ))
        )}

        <div className="ml-auto pr-1 text-gray-400">
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box */}
          <div className="p-3 border-b border-gray-100 bg-gray-50/60 relative">
            <Search size={14} className="absolute left-6 top-5 text-gray-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search job roles (e.g. Traditional Photographer, Editor, Drone Pilot)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-xl border border-gray-200 bg-white text-gray-900 font-medium focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          {/* Categorized Options List */}
          <div className="max-h-64 overflow-y-auto p-2 space-y-3 text-xs">
            {filteredCategories.length === 0 ? (
              <div className="p-4 text-center text-gray-400">No matching job roles found</div>
            ) : (
              filteredCategories.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <span className="px-2 text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                    {cat.category}
                  </span>
                  <div className="space-y-0.5">
                    {cat.roles.map((role) => {
                      const isSelected = selectedRoles.includes(role)
                      return (
                        <div
                          key={role}
                          onClick={() => handleToggleRole(role)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer font-medium transition-colors ${
                            isSelected
                              ? 'bg-[#5B3FD9]/10 text-[#5B3FD9] font-bold'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>{role}</span>
                          {isSelected && <Check size={14} className="text-[#5B3FD9]" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
