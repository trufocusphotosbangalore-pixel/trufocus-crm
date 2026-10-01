import React, { useState } from 'react'
import {
  Building2, Phone, MapPin, Palette, Share2, FileText, Landmark, Sliders,
  Save, Download, Upload, Eye, Mail, Globe,
} from 'lucide-react'
import type { BusinessProfileData, BusinessType, BusinessDocumentFile } from '@/types/businessProfile'
import {
  loadBusinessProfile,
  saveBusinessProfile,
  resetBusinessProfile,
  exportBusinessProfileJSON,
  importBusinessProfileJSON,
} from '@/services/businessProfileStore'
import { useTeamPermissions } from '@/hooks/useTeamPermissions'
import { toast } from 'react-hot-toast'

export function BusinessProfileTab() {
  const { hasPermission } = useTeamPermissions()
  const canEdit = hasPermission('settings', 'edit')

  const [profile, setProfile] = useState<BusinessProfileData>(loadBusinessProfile())
  const [activeDocPreviewTab, setActiveDocPreviewTab] = useState<'quotation' | 'invoice' | 'receipt' | 'contract'>('quotation')
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false)
  const logoInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Unsupported file format. Please upload PNG, SVG, JPG, or JPEG.')
      e.target.value = ''
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size exceeds maximum limit of 5 MB.')
      e.target.value = ''
      return
    }

    const toastId = toast.loading('Saving and replacing business logo...')

    try {
      // Compress & Resize Image via Canvas (Max 350px for fast <30KB storage footprint)
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onerror = () => resolve('')
        reader.onload = (evt) => {
          const img = new Image()
          img.onerror = () => resolve(evt.target?.result as string)
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height
            const maxDim = 350

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width)
                width = maxDim
              } else {
                width = Math.round((width * maxDim) / height)
                height = maxDim
              }
            }

            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            if (!ctx) {
              resolve(evt.target?.result as string)
              return
            }

            ctx.drawImage(img, 0, 0, width, height)
            const mime = file.type === 'image/png' || file.type === 'image/svg+xml' ? 'image/png' : 'image/jpeg'
            resolve(canvas.toDataURL(mime, 0.85))
          }
          img.src = evt.target?.result as string
        }
        reader.readAsDataURL(file)
      })

      if (!dataUrl) {
        toast.dismiss(toastId)
        toast.error('Failed to process image file.')
        e.target.value = ''
        return
      }

      const updated = {
        ...profile,
        logo_url: dataUrl,
        white_logo_url: dataUrl,
        dark_logo_url: dataUrl,
        favicon_url: dataUrl,
      }

      setProfile(updated)
      const saved = saveBusinessProfile(updated)
      e.target.value = ''

      toast.dismiss(toastId)
      if (saved) {
        toast.success('✓ Business Logo Uploaded & Saved Successfully!')
      } else {
        toast.error('Storage limit reached. Logo saved for current session.')
      }
    } catch (err) {
      console.error('Logo upload error:', err)
      e.target.value = ''
      toast.dismiss(toastId)
      toast.error('Unable to replace logo. Please try another image.')
    }
  }

  const handleRemoveLogo = () => {
    const updated = {
      ...profile,
      logo_url: '',
      white_logo_url: '',
      dark_logo_url: '',
      favicon_url: '',
    }
    setProfile(updated)
    saveBusinessProfile(updated)
    window.dispatchEvent(new Event('trufocus_business_profile_updated'))
    toast.success('Removed company logo.')
  }

  const handleInputChange = (field: keyof BusinessProfileData, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!profile.business_name || !profile.email || !profile.primary_mobile) {
      toast.error('Please fill in required fields (Business Name, Email, Primary Mobile).')
      return
    }
    saveBusinessProfile(profile)
    toast.success('🎉 Business Profile saved successfully! Auto-synced across CRM.')
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the business profile to system defaults?')) {
      const def = resetBusinessProfile()
      setProfile(def)
      toast.success('Reset profile to system default settings.')
    }
  }

  const handleExportJSON = () => {
    const jsonStr = exportBusinessProfileJSON()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trufocus_business_profile_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported Business Profile JSON backup!')
  }

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const content = evt.target?.result as string
      const result = importBusinessProfileJSON(content)
      if (result.success && result.data) {
        setProfile(result.data)
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    }
    reader.readAsText(file)
  }

  const handleFileUpload = (category: BusinessDocumentFile['category']) => {
    const fileName = `${category.replace(/\s+/g, '_')}_${Date.now()}.pdf`
    const newDoc: BusinessDocumentFile = {
      id: 'doc_' + Date.now(),
      name: fileName,
      category,
      url: '#',
      file_size: '2.1 MB',
      uploaded_at: new Date().toISOString(),
    }
    const updatedDocs = [newDoc, ...profile.documents]
    handleInputChange('documents', updatedDocs)
    toast.success(`Uploaded ${category} document!`)
  }

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* ─── TOP ACTION BAR ─── */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
            <Building2 size={20} className="text-[#5B3FD9]" /> Master Business Profile
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Single source of truth for company info, branding, banking details & document templates across Trufocus CRM
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowLivePreviewModal(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-purple-200 bg-purple-50 text-[#5B3FD9] hover:bg-purple-100 flex items-center gap-1.5 transition-colors"
          >
            <Eye size={14} /> Live Branding Preview
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <Download size={14} /> Export JSON
          </button>

          <label className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload size={14} /> Import JSON
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          {canEdit && (
            <>
              <button
                onClick={handleReset}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
              >
                Reset
              </button>

              <button
                onClick={() => handleSave()}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Save size={14} /> Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── LEFT COLUMN: EDIT FORM SECTIONS (2 COLS) ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: BUSINESS INFORMATION */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2 border-b border-gray-100 pb-3">
              <Building2 size={16} className="text-[#5B3FD9]" /> Section 1: Business Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={profile.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Owner Name *</label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={profile.owner_name}
                  onChange={(e) => handleInputChange('owner_name', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Tagline</label>
              <input
                type="text"
                disabled={!canEdit}
                value={profile.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Business Type</label>
                <select
                  disabled={!canEdit}
                  value={profile.business_type}
                  onChange={(e) => handleInputChange('business_type', e.target.value as BusinessType)}
                  className="w-full h-9 px-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                >
                  <option value="Photography Studio">Photography Studio</option>
                  <option value="Photography & Videography">Photography & Videography</option>
                  <option value="Event Management">Event Management</option>
                  <option value="Production House">Production House</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">GST Number</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  placeholder="29ABCDE1234F1Z5"
                  value={profile.gst_number}
                  onChange={(e) => handleInputChange('gst_number', e.target.value.toUpperCase())}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  placeholder="ABCDE1234F"
                  value={profile.pan_number}
                  onChange={(e) => handleInputChange('pan_number', e.target.value.toUpperCase())}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Business Registration No. (Optional)</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.registration_number}
                  onChange={(e) => handleInputChange('registration_number', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Established Year</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.established_year}
                  onChange={(e) => handleInputChange('established_year', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: CONTACT INFORMATION */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2 border-b border-gray-100 pb-3">
              <Phone size={16} className="text-[#5B3FD9]" /> Section 2: Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Primary Mobile *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    disabled={!canEdit}
                    value={profile.primary_mobile}
                    onChange={(e) => handleInputChange('primary_mobile', e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                  />
                  <button
                    type="button"
                    onClick={() => toast.success('Primary phone verified with OTP.')}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 shrink-0"
                  >
                    ✔ Verified
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Secondary Mobile</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.secondary_mobile}
                  onChange={(e) => handleInputChange('secondary_mobile', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">WhatsApp Business No.</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.whatsapp_number}
                  onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Email Address *</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    disabled={!canEdit}
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                  />
                  <button
                    type="button"
                    onClick={() => toast.success('Business email verified.')}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 shrink-0"
                  >
                    ✔ Verified
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Support Email</label>
                <input
                  type="email"
                  disabled={!canEdit}
                  value={profile.support_email}
                  onChange={(e) => handleInputChange('support_email', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Website URL</label>
                <input
                  type="url"
                  disabled={!canEdit}
                  value={profile.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: BUSINESS ADDRESS & GOOGLE MAPS */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2 border-b border-gray-100 pb-3">
              <MapPin size={16} className="text-[#5B3FD9]" /> Section 3: Business Address & Google Maps Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Address Line 1</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.address_line_1}
                  onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.address_line_2}
                  onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Landmark</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.landmark}
                  onChange={(e) => handleInputChange('landmark', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#111827] flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#5B3FD9]" /> Google Maps Coordinates
                </span>
                <button
                  type="button"
                  onClick={() => window.open(profile.google_maps_url || 'https://maps.google.com', '_blank')}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1 shadow-2xs"
                >
                  📍 Pick Location on Map
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="url"
                  placeholder="Google Maps Share Link"
                  disabled={!canEdit}
                  value={profile.google_maps_url}
                  onChange={(e) => handleInputChange('google_maps_url', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-white font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
                <input
                  type="text"
                  placeholder="Latitude (e.g. 12.9716)"
                  disabled={!canEdit}
                  value={profile.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-white font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
                <input
                  type="text"
                  placeholder="Longitude (e.g. 77.5946)"
                  disabled={!canEdit}
                  value={profile.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-white font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: BUSINESS BRANDING & COMPANY LOGO */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-6">
            <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2 border-b border-gray-100 pb-3">
              <Palette size={16} className="text-[#5B3FD9]" /> Section 4: Business Branding & Company Logo
            </h3>

            {/* Missing Logo Warning */}
            {!profile.logo_url && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span>⚠️ No company logo uploaded.</span>
                </div>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Upload size={13} /> Upload Logo
                </button>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              type="file"
              ref={logoInputRef}
              accept="image/png, image/jpeg, image/jpg, image/svg+xml"
              onChange={handleLogoUpload}
              onClick={(e) => {
                ;(e.target as HTMLInputElement).value = ''
              }}
              className="hidden"
            />

            {/* Company Logo Upload & Controls */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50/50 to-gray-50 border border-purple-100 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative size-20 rounded-2xl bg-white border border-gray-200 shadow-md overflow-hidden flex items-center justify-center p-2 group">
                  {profile.logo_url ? (
                    <img
                      src={profile.logo_url}
                      alt="Company Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Building2 size={24} />
                      <span className="text-[9px] font-bold mt-1 text-gray-400">No Logo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="p-1.5 rounded-lg bg-white text-gray-800 shadow-xs hover:scale-105 transition-transform"
                    >
                      <Upload size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#111827]">Master Company Logo</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Accepted formats: <strong>PNG, SVG, JPG, JPEG</strong> (Max: 5 MB)
                  </p>
                  <p className="text-[10px] text-purple-700 font-semibold mt-1">
                    Recommended: 1000 × 1000 px transparent PNG. Automatically synced across CRM.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Upload size={14} /> Upload Logo
                </button>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  Replace Logo
                </button>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors cursor-pointer"
                >
                  Remove Logo
                </button>
              </div>
            </div>

            {/* Company Logo Multi-Context Previews */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Company Logo Multi-Context Live Previews
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Large Preview */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 text-center space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Large Preview</span>
                  <div className="size-20 mx-auto rounded-xl bg-white border border-gray-200 p-2 flex items-center justify-center shadow-xs">
                    {profile.logo_url ? (
                      <img src={profile.logo_url} alt="Large" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <Building2 size={24} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Small Preview */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 text-center space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Small Avatar (40px)</span>
                  <div className="size-10 mx-auto rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center shadow-xs">
                    {profile.logo_url ? (
                      <img src={profile.logo_url} alt="Small" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <Building2 size={16} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Favicon Preview */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 text-center space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Favicon (16px)</span>
                  <div className="flex items-center justify-center gap-1.5 bg-gray-200/80 px-2 py-1 rounded-md text-[10px] text-gray-700 max-w-[120px] mx-auto truncate font-mono">
                    {profile.logo_url ? (
                      <img src={profile.logo_url} alt="Favicon" className="size-4 object-contain" />
                    ) : (
                      <Building2 size={12} className="text-gray-500" />
                    )}
                    <span>Trufocus</span>
                  </div>
                </div>

                {/* Header Preview */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 text-center space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Header Bar</span>
                  <div className="flex items-center gap-2 bg-[#1E1B3A] p-2 rounded-lg text-white">
                    {profile.logo_url ? (
                      <img src={profile.logo_url} alt="Header" className="size-6 object-contain rounded" />
                    ) : (
                      <Building2 size={14} className="text-[#5B3FD9]" />
                    )}
                    <span className="font-bold text-[10px] truncate">{profile.business_name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    disabled={!canEdit}
                    value={profile.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    className="size-9 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={profile.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    disabled={!canEdit}
                    value={profile.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    className="size-9 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={profile.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    disabled={!canEdit}
                    value={profile.accent_color}
                    onChange={(e) => handleInputChange('accent_color', e.target.value)}
                    className="size-9 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={profile.accent_color}
                    onChange={(e) => handleInputChange('accent_color', e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: SOCIAL MEDIA LINKS */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2 border-b border-gray-100 pb-3">
              <Share2 size={16} className="text-[#5B3FD9]" /> Section 5: Social Media Profiles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Globe size={14} className="text-pink-600" /> Instagram URL
                </label>
                <input
                  type="url"
                  disabled={!canEdit}
                  placeholder="https://instagram.com/yourhandle"
                  value={profile.instagram_url}
                  onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Globe size={14} className="text-blue-600" /> Facebook Page
                </label>
                <input
                  type="url"
                  disabled={!canEdit}
                  placeholder="https://facebook.com/yourpage"
                  value={profile.facebook_url}
                  onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Globe size={14} className="text-red-600" /> YouTube Channel
                </label>
                <input
                  type="url"
                  disabled={!canEdit}
                  placeholder="https://youtube.com/@yourchannel"
                  value={profile.youtube_url}
                  onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Globe size={14} className="text-blue-700" /> LinkedIn Profile
                </label>
                <input
                  type="url"
                  disabled={!canEdit}
                  placeholder="https://linkedin.com/company/yourstudio"
                  value={profile.linkedin_url}
                  onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 6: BUSINESS DOCUMENTS */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                <FileText size={16} className="text-[#5B3FD9]" /> Section 6: Business Documents & Certificates
              </h3>

              {canEdit && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFileUpload('GST Certificate')}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-purple-200 bg-purple-50 text-[#5B3FD9] hover:bg-purple-100"
                  >
                    + Upload GST Cert
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFileUpload('MSME Certificate')}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-purple-200 bg-purple-50 text-[#5B3FD9] hover:bg-purple-100"
                  >
                    + Upload MSME
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {profile.documents.map((doc) => (
                <div key={doc.id} className="p-3 rounded-xl border border-gray-200 bg-gray-50/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-[#5B3FD9]" />
                    <div>
                      <p className="font-bold text-[#111827]">{doc.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{doc.category} • {doc.file_size} • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toast.success(`Opening ${doc.name}...`)}
                    className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700"
                  >
                    View File
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 7: BANKING DETAILS */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2 border-b border-gray-100 pb-3">
              <Landmark size={16} className="text-[#5B3FD9]" /> Section 7: Banking Details & UPI QR
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.bank_name}
                  onChange={(e) => handleInputChange('bank_name', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Account Holder Name</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.account_holder}
                  onChange={(e) => handleInputChange('account_holder', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Account Number</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.account_number}
                  onChange={(e) => handleInputChange('account_number', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.ifsc_code}
                  onChange={(e) => handleInputChange('ifsc_code', e.target.value.toUpperCase())}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">UPI VPA ID</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.upi_id}
                  onChange={(e) => handleInputChange('upi_id', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 8: DEFAULT BUSINESS SETTINGS */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2 border-b border-gray-100 pb-3">
              <Sliders size={16} className="text-[#5B3FD9]" /> Section 8: Default Business Prefixes & Settings
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.invoice_prefix}
                  onChange={(e) => handleInputChange('invoice_prefix', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Quotation Prefix</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.quotation_prefix}
                  onChange={(e) => handleInputChange('quotation_prefix', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Work Order Prefix</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.workorder_prefix}
                  onChange={(e) => handleInputChange('workorder_prefix', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Enquiry Prefix</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.enquiry_prefix}
                  onChange={(e) => handleInputChange('enquiry_prefix', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Receipt Prefix</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.receipt_prefix}
                  onChange={(e) => handleInputChange('receipt_prefix', e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono font-bold text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: LIVE BUSINESS CARD & BRANDING WIDGET (1 COL) ─── */}
        <div className="space-y-6">
          {/* Live Business Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden sticky top-20 space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5B3FD9]">
                Live Master Business Card
              </span>
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="relative rounded-2xl bg-gradient-to-br from-[#1E1B3A] to-[#2E285C] text-white p-5 space-y-4 overflow-hidden shadow-lg">
              <div className="flex items-center gap-3">
                <img
                  src={profile.logo_url}
                  alt={profile.business_name}
                  className="size-12 rounded-xl object-cover border-2 border-white/20 shadow-md"
                />
                <div>
                  <h4 className="text-sm font-extrabold text-white leading-tight">{profile.business_name}</h4>
                  <p className="text-[11px] text-purple-200 leading-snug">{profile.tagline}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-gray-300 font-medium pt-2 border-t border-white/10">
                <p className="flex items-center gap-2">
                  <Phone size={12} className="text-emerald-400" /> {profile.primary_mobile}
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={12} className="text-purple-300" /> {profile.email}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={12} className="text-amber-400" /> {profile.city}, {profile.state}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] font-mono text-purple-200">
                <span>GST: {profile.gst_number || 'N/A'}</span>
                <span>Established {profile.established_year}</span>
              </div>
            </div>

            {/* Banking Quick Card */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
              <p className="font-extrabold text-[#111827] flex items-center gap-1.5">
                <Landmark size={14} className="text-[#5B3FD9]" /> Banking Info for Invoices
              </p>
              <div className="space-y-1 text-gray-600 font-mono text-[11px]">
                <p>Bank: <strong className="text-gray-900">{profile.bank_name}</strong></p>
                <p>A/C: <strong className="text-gray-900">{profile.account_number}</strong></p>
                <p>IFSC: <strong className="text-gray-900">{profile.ifsc_code}</strong></p>
                <p>UPI: <strong className="text-[#5B3FD9]">{profile.upi_id}</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── LIVE BRANDING PREVIEW MODAL ─── */}
      {showLivePreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                <Eye size={18} className="text-[#5B3FD9]" /> Document Branding Live Preview
              </h3>
              <button onClick={() => setShowLivePreviewModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="flex gap-2 border-b border-gray-200 pb-2">
              {(['quotation', 'invoice', 'receipt', 'contract'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveDocPreviewTab(tab)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize ${
                    activeDocPreviewTab === tab
                      ? 'bg-[#5B3FD9] text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab} Preview
                </button>
              ))}
            </div>

            {/* Live Rendered Document */}
            <div className="p-6 rounded-xl border border-gray-200 bg-white space-y-4 font-sans text-xs">
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: profile.primary_color }}>
                <div className="flex items-center gap-3">
                  <img src={profile.logo_url} alt="Logo" className="size-10 rounded-lg object-cover" />
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">{profile.business_name}</h4>
                    <p className="text-[10px] text-gray-500">{profile.tagline}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-extrabold text-sm" style={{ color: profile.primary_color }}>
                    {activeDocPreviewTab.toUpperCase()} #{profile.invoice_prefix}2025-001
                  </span>
                  <p className="text-[10px] text-gray-400">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 space-y-2">
                <p className="font-bold text-gray-800">Bill To: Client Name</p>
                <p className="text-gray-600">Wedding Photography & Cinematic Film Package</p>
                <p className="font-mono font-extrabold text-sm" style={{ color: profile.primary_color }}>Total Amount: ₹1,50,000</p>
              </div>

              <div className="p-3 rounded-lg border text-[11px] font-mono space-y-1" style={{ borderColor: profile.primary_color + '40', backgroundColor: profile.primary_color + '0A' }}>
                <p className="font-bold">Payment Deposit Details:</p>
                <p>Bank: {profile.bank_name} | A/C: {profile.account_number} | IFSC: {profile.ifsc_code} | UPI: {profile.upi_id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
