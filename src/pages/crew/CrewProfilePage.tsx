import React, { useState } from 'react'
import { getCrewSession } from '@/services/crewSessionService'
import { getWorkRolesForEmployee } from '@/services/employeeWorkRolesService'
import { resetStaffPin } from '@/services/crewAuthService'
import { User, Key, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function CrewProfilePage() {
  const [crewUser] = useState(() => getCrewSession())
  const [showPinModal, setShowPinModal] = useState(false)
  const [newPin, setNewPin] = useState('')

  if (!crewUser) return null
  const workRoles = getWorkRolesForEmployee(crewUser.id)

  const handlePinChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPin || newPin.length < 4) {
      toast.error('Please enter a 4-digit PIN.')
      return
    }
    resetStaffPin(crewUser.id, newPin)
    toast.success('Staff PIN updated successfully!')
    setShowPinModal(false)
    setNewPin('')
  }

  return (
    <div className="space-y-6 text-gray-900 font-sans max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <User size={24} className="text-[#5B3FD9]" /> Employee Profile
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Personal information, HR documents, emergency contacts, and security credentials.
          </p>
        </div>

        <button
          onClick={() => setShowPinModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white font-extrabold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Key size={15} /> Change Staff PIN
        </button>
      </div>

      {/* Profile Overview Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="size-20 rounded-full bg-purple-50 border-2 border-[#5B3FD9] text-[#5B3FD9] font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-xs">
          {(crewUser.employee_name || crewUser.full_name || 'E').charAt(0).toUpperCase()}
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-gray-900">{crewUser.employee_name || crewUser.full_name}</h2>
          <p className="text-xs text-[#5B3FD9] font-bold">
            {workRoles.length > 0 ? workRoles.map((r) => r.role_name).join(' • ') : 'Crew Specialist'}
          </p>
          <p className="text-xs text-gray-500 font-mono">Employee ID: {crewUser.employee_id || crewUser.id}</p>
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-3">
          <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2">Personal & Contact Info</h3>
          <div className="text-xs space-y-2 text-gray-700">
            <p><span className="font-bold text-gray-900">Email:</span> {crewUser.email || 'N/A'}</p>
            <p><span className="font-bold text-gray-900">Mobile:</span> {crewUser.mobile || (crewUser as any).phone || '+91 9876543210'}</p>
            <p><span className="font-bold text-gray-900">Department:</span> Production & Events</p>
            <p><span className="font-bold text-gray-900">Base Location:</span> Studio Main Office</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-3">
          <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2">Assigned Work Roles ({workRoles.length})</h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {workRoles.map((r) => (
              <span key={r.role_id} className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-50 text-[#5B3FD9] border border-purple-200">
                {r.role_name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Change PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl w-full max-w-sm space-y-4 text-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900">Change 4-Digit Staff PIN</h3>
              <button onClick={() => setShowPinModal(false)} className="p-1 text-gray-400 hover:text-gray-900">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePinChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">New 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="e.g. 8622"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 text-center tracking-widest text-lg font-extrabold rounded-xl bg-slate-50 border border-gray-200 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-gray-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#5B3FD9] text-white text-xs font-extrabold"
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
