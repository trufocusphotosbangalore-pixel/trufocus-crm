import React, { useState } from 'react'
import { Building2, User, Save } from 'lucide-react'
import { BusinessProfileTab } from '@/components/profile/BusinessProfileTab'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

export default function Profile() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'business_profile' | 'personal_profile'>('business_profile')

  // Personal Profile state
  const [fullName, setFullName] = useState(user?.full_name || 'Trufocus Administrator')
  const [email] = useState(user?.email || 'trufocusphotosbangalore@gmail.com')
  const [phone, setPhone] = useState(user?.phone || '+91 90711 14965')

  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Personal profile details updated!')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-xs">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-[#5B3FD9]/15 flex items-center justify-center text-[#5B3FD9]">
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Profile & Business Settings</h1>
            <p className="text-xs text-gray-500">
              Manage master business profile, branding, banking details, and personal account preferences
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-px">
        <button
          onClick={() => setActiveTab('business_profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'business_profile'
              ? 'border-[#5B3FD9] text-[#5B3FD9] bg-white font-extrabold shadow-2xs'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <Building2 size={16} /> Business Profile
        </button>

        <button
          onClick={() => setActiveTab('personal_profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'personal_profile'
              ? 'border-[#5B3FD9] text-[#5B3FD9] bg-white font-extrabold shadow-2xs'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <User size={16} /> Personal Account
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'business_profile' ? (
        <BusinessProfileTab />
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs max-w-2xl space-y-6">
          <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2 border-b border-gray-100 pb-3">
            <User size={16} className="text-[#5B3FD9]" /> Personal Account Details
          </h3>

          <form onSubmit={handleSavePersonal} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  readOnly
                  value={email}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-100 font-medium text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 shadow-xs"
              >
                <Save size={14} /> Save Account Info
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
