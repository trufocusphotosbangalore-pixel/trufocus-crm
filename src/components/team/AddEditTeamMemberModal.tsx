import React, { useState, useEffect } from 'react'
import {
  X, User, CreditCard, Building, CheckCircle2,
} from 'lucide-react'
import type {
  TeamMember,
  TeamType,
  DepartmentName,
  AvailabilityStatus,
} from '@/types/team'
import {
  DEPARTMENTS,
} from '@/types/team'
import { JobRolesMultiSelect } from './JobRolesMultiSelect'
import { saveTeamMember } from '@/services/teamStore'
import { loadSettingsFromStorage } from '@/services/settingsStore'
import { toast } from 'react-hot-toast'

interface AddEditTeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  memberToEdit?: TeamMember | null
  defaultType?: TeamType
  onSaved: () => void
}

export function AddEditTeamMemberModal({
  isOpen,
  onClose,
  memberToEdit,
  defaultType = 'in_house',
  onSaved,
}: AddEditTeamMemberModalProps) {
  const allServices = loadSettingsFromStorage().services
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    team_type: defaultType,
    availability: 'available',
    job_role: 'Photographer',
    department: 'Photography',
  })

  useEffect(() => {
    if (memberToEdit) {
      setFormData({ ...memberToEdit })
    } else {
      setFormData({
        team_type: defaultType,
        availability: 'available',
        job_role: 'Photographer',
        department: 'Photography',
      })
    }
  }, [memberToEdit, defaultType, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name?.trim()) {
      toast.error('Full Name is required.')
      return
    }
    if (!formData.mobile_number?.trim()) {
      toast.error('Mobile Number is required.')
      return
    }

    saveTeamMember(formData)
    toast.success(
      memberToEdit
        ? `Updated profile for ${formData.full_name}!`
        : `Added ${formData.full_name} to Team!`
    )
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <User size={20} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#111827]">
                {memberToEdit ? 'Edit Team Member' : 'Add New Team Member'}
              </h2>
              <p className="text-xs text-gray-500">
                {memberToEdit ? `Updating profile for ${memberToEdit.employee_id}` : 'Create a new staff or freelancer record'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
          {/* Section: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#5B3FD9] uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} /> Basic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sethi"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Team Type *</label>
                <select
                  value={formData.team_type || 'in_house'}
                  onChange={(e) => setFormData({ ...formData, team_type: e.target.value as TeamType })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-[#5B3FD9]"
                >
                  <option value="in_house">In-House Staff</option>
                  <option value="freelancer">Freelancer</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.mobile_number || ''}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={formData.whatsapp_number || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="vikram@example.com"
                  value={formData.email_address || ''}
                  onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Profile Photo URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.photo_url || ''}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>
          </div>

          {/* Section: Role & Department */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-[#5B3FD9] uppercase tracking-wider flex items-center gap-1.5">
              <Building size={14} /> Role & Compensation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-gray-700 font-bold mb-1">Job Roles (Select Multiple) *</label>
                <JobRolesMultiSelect
                  selectedRoles={formData.job_roles || (formData.job_role ? [formData.job_role] : [])}
                  onChange={(roles) => setFormData({ ...formData, job_roles: roles })}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Department</label>
                <select
                  value={formData.department || 'Photography'}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value as DepartmentName })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-[#5B3FD9]"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={formData.experience_years ?? 1}
                  onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Availability Status</label>
                <select
                  value={formData.availability || 'available'}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value as AvailabilityStatus })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-[#5B3FD9]"
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {formData.team_type === 'freelancer' ? (
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Daily Rate / Charges (₹)</label>
                  <input
                    type="number"
                    placeholder="12000"
                    value={formData.daily_rate || ''}
                    onChange={(e) => setFormData({ ...formData, daily_rate: parseInt(e.target.value) || 0 })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold focus:outline-none focus:border-[#5B3FD9]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    placeholder="40000"
                    value={formData.monthly_salary || ''}
                    onChange={(e) => setFormData({ ...formData, monthly_salary: parseInt(e.target.value) || 0 })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold focus:outline-none focus:border-[#5B3FD9]"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-bold mb-1">Preferred City / Region</label>
                <input
                  type="text"
                  placeholder="Mumbai / Goa"
                  value={formData.preferred_city || ''}
                  onChange={(e) => setFormData({ ...formData, preferred_city: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>
          </div>

          {/* Section: Dynamic Eligible Services (Loaded from Settings -> Services) */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-[#5B3FD9] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Service Eligibility (Loaded from Settings Master)
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              Select shoot services this staff member is qualified to perform for Work Order assignment filters.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-200 max-h-48 overflow-y-auto">
              {allServices.map((srv) => {
                const currentEligible = formData.skills || []
                const isChecked = currentEligible.includes(srv.name) || currentEligible.includes(srv.id)

                return (
                  <label
                    key={srv.id}
                    className="flex items-center gap-2 p-2 rounded-xl bg-white border border-gray-200 hover:border-[#5B3FD9] cursor-pointer text-xs transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        const updated = isChecked
                          ? currentEligible.filter((s) => s !== srv.name && s !== srv.id)
                          : [...currentEligible, srv.name]
                        setFormData({ ...formData, skills: updated })
                      }}
                      className="size-4 rounded text-[#5B3FD9] focus:ring-[#5B3FD9]/20 accent-[#5B3FD9]"
                    />
                    <span className="font-extrabold text-gray-800">{srv.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono ml-auto">({srv.department_name})</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Section: Additional & Bank Details */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-[#5B3FD9] uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard size={14} /> Bank & Verification Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">UPI ID</label>
                <input
                  type="text"
                  placeholder="username@okhdfcbank"
                  value={formData.upi_id || ''}
                  onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-mono focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">PAN Number</label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={formData.pan_number || ''}
                  onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-mono uppercase focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Aadhaar Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012"
                  value={formData.aadhaar_number || ''}
                  onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-mono focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Emergency Contact</label>
                <input
                  type="text"
                  placeholder="+91 98765 99999"
                  value={formData.emergency_contact || ''}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-gray-700 font-bold mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Full Residential Address..."
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="shrink-0 sticky bottom-0 z-20 pt-4 border-t border-gray-200 bg-white flex items-center justify-end gap-3 px-1 py-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 h-10 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-md shadow-[#5B3FD9]/20 transition-colors cursor-pointer"
            >
              <CheckCircle2 size={15} /> Save Team Member
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
