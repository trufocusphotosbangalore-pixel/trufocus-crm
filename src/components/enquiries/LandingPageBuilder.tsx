import { useState, useEffect } from 'react'
import {
  Copy, Eye, QrCode, Upload, RefreshCw, Camera,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { getLandingPageSettings, saveLandingPageSettings } from '@/services/landingPageStore'
import type { LandingPageSettings } from '@/types/landingPage'
import { toast } from 'react-hot-toast'

export function LandingPageBuilder() {
  const [settings, setSettings] = useState<LandingPageSettings>(() => getLandingPageSettings())
  const [activeSubTab, setActiveSubTab] = useState<'content' | 'fields' | 'branding' | 'social'>('content')
  const [showQrModal, setShowQrModal] = useState(false)

  // Public URL
  const origin = window.location.origin
  const publicUrl = `${origin}/enquiry/${settings.public_id}`

  // Autosave settings on change
  useEffect(() => {
    saveLandingPageSettings(settings)
  }, [settings])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl)
    toast.success('Public enquiry link copied to clipboard!')
  }

  const handleRegenerateLink = () => {
    const newPublicId = 'TRF-LP-' + Math.floor(1000 + Math.random() * 9000)
    setSettings(prev => ({ ...prev, public_id: newPublicId }))
    toast.success(`Generated new link: ${newPublicId}`)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5 MB limit.')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSettings(prev => ({ ...prev, cover_image_url: reader.result as string }))
          toast.success('Banner image updated!')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">

      {/* ─── PUBLIC LINK BAR ─── */}
      <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B3FD9]">Live Public Share Link</span>
          <p className="text-xs font-mono font-bold text-[#111827] mt-0.5 truncate max-w-md">{publicUrl}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-[#E5E7EB] hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
          >
            <Copy size={13} /> Copy Link
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 shadow-sm"
          >
            <Eye size={13} /> Preview Page
          </a>
          <button
            onClick={() => setShowQrModal(true)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-[#E5E7EB] hover:bg-gray-50 flex items-center gap-1.5"
          >
            <QrCode size={13} /> QR Code
          </button>
          <button
            onClick={handleRegenerateLink}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-gray-500 hover:text-[#5B3FD9] hover:bg-gray-50 flex items-center gap-1"
          >
            <RefreshCw size={12} /> Regenerate
          </button>
        </div>
      </div>

      {/* ─── SPLIT SCREEN BUILDER: LEFT CONTROLS, RIGHT LIVE PREVIEW ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT CONTROLS (7/12 width) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-6">

          {/* Builder Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 border-b border-[#E5E7EB] pb-3">
            {[
              { id: 'content', label: 'Content & Banner' },
              { id: 'fields', label: 'Form Fields' },
              { id: 'branding', label: 'Branding & Colors' },
              { id: 'social', label: 'Social & Support' },
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setActiveSubTab(st.id as any)}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                  activeSubTab === st.id
                    ? 'bg-[#5B3FD9] text-white shadow-2xs'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-100'
                )}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* TAB 1: CONTENT & BANNER */}
          {activeSubTab === 'content' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827]">Banner Cover Image (Max 5MB)</label>
                <div className="flex items-center gap-3">
                  <img src={settings.cover_image_url} alt="Cover Preview" className="size-16 rounded-xl object-cover border border-[#E5E7EB]" />
                  <label className="px-3.5 py-2 text-xs font-bold rounded-lg border border-[#E5E7EB] bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center gap-2">
                    <Upload size={14} /> Upload Banner
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827]">Main Headline</label>
                <input
                  type="text"
                  value={settings.headline}
                  onChange={(e) => setSettings(prev => ({ ...prev, headline: e.target.value }))}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-[#E5E7EB] focus:border-[#5B3FD9] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827]">Description / Subtitle</label>
                <textarea
                  rows={2}
                  value={settings.description}
                  onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 text-xs rounded-lg border border-[#E5E7EB] focus:border-[#5B3FD9] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111827]">Submit Button Text</label>
                  <input
                    type="text"
                    value={settings.submit_button_text}
                    onChange={(e) => setSettings(prev => ({ ...prev, submit_button_text: e.target.value }))}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-[#E5E7EB] focus:border-[#5B3FD9]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111827]">Footer Copyright Text</label>
                  <input
                    type="text"
                    value={settings.footer_text}
                    onChange={(e) => setSettings(prev => ({ ...prev, footer_text: e.target.value }))}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-[#E5E7EB] focus:border-[#5B3FD9]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FORM FIELDS */}
          {activeSubTab === 'fields' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-xs text-[#6B7280]">
                Customer Name, Mobile, Event Type & Event Date are always required. Enable optional fields below:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'show_venue', label: 'Venue Name' },
                  { key: 'show_location', label: 'City / Location' },
                  { key: 'show_guests_count', label: 'Estimated Guest Count' },
                  { key: 'show_budget', label: 'Estimated Budget (₹)' },
                  { key: 'show_email', label: 'Email Address' },
                  { key: 'show_source', label: 'How did you hear about us?' },
                  { key: 'show_special_requirements', label: 'Special Requirements' },
                  { key: 'show_instagram_username', label: 'Instagram Username' },
                  { key: 'show_referral_name', label: 'Referral Name' },
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFC] cursor-pointer hover:bg-gray-50">
                    <span className="text-xs font-medium text-[#111827]">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={(settings as any)[item.key]}
                      onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="size-4 text-[#5B3FD9] rounded border-gray-300 focus:ring-[#5B3FD9]"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BRANDING & COLORS */}
          {activeSubTab === 'branding' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827]">Studio Brand Name</label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => setSettings(prev => ({ ...prev, company_name: e.target.value }))}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-[#E5E7EB] focus:border-[#5B3FD9]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111827]">Primary Theme Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value, button_color: e.target.value }))}
                      className="size-9 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value, button_color: e.target.value }))}
                      className="w-28 h-9 px-3 text-xs rounded-lg border border-[#E5E7EB] font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SOCIAL & SUPPORT */}
          {activeSubTab === 'social' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#111827]">Instagram URL</label>
                <input
                  type="text"
                  value={settings.instagram_url || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, instagram_url: e.target.value }))}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-[#E5E7EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#111827]">WhatsApp Contact Number</label>
                <input
                  type="text"
                  value={settings.whatsapp_number || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-[#E5E7EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#111827]">Website URL</label>
                <input
                  type="text"
                  value={settings.website_url || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, website_url: e.target.value }))}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-[#E5E7EB]"
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT LIVE MOBILE PREVIEW (5/12 width) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-[320px] rounded-[36px] border-[10px] border-[#1E1B3A] bg-white shadow-2xl overflow-hidden relative font-sans text-[#111827]">
            {/* Phone Notch */}
            <div className="w-28 h-4 bg-[#1E1B3A] rounded-b-xl mx-auto mb-2" />

            {/* Mobile Header */}
            <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Camera size={16} className="text-[#5B3FD9]" />
                <span className="text-xs font-bold text-[#111827]">{settings.company_name}</span>
              </div>
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Mobile Scrollable Body */}
            <div className="max-h-[520px] overflow-y-auto space-y-4 pb-6">
              {/* Cover Banner */}
              <div className="h-32 bg-gray-200 relative overflow-hidden">
                <img src={settings.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
                  <h4 className="text-xs font-bold text-white leading-tight">{settings.headline}</h4>
                </div>
              </div>

              {/* Form Box */}
              <div className="px-4 space-y-3">
                <p className="text-[11px] text-[#6B7280] leading-snug">{settings.description}</p>

                <div className="space-y-2 text-[10px]">
                  <div>
                    <label className="block font-semibold text-gray-700">Full Name *</label>
                    <input disabled placeholder="e.g. Ananya Roy" className="w-full h-7 px-2 border rounded bg-gray-50 text-[10px]" />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700">Mobile Number *</label>
                    <input disabled placeholder="+91 98765 43210" className="w-full h-7 px-2 border rounded bg-gray-50 text-[10px]" />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700">Event Type *</label>
                    <select disabled className="w-full h-7 px-2 border rounded bg-gray-50 text-[10px]">
                      <option>Wedding Photography</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700">Event Date *</label>
                    <input disabled type="date" className="w-full h-7 px-2 border rounded bg-gray-50 text-[10px]" />
                  </div>

                  {settings.show_location && (
                    <div>
                      <label className="block font-semibold text-gray-700">Location / City</label>
                      <input disabled placeholder="e.g. Udaipur" className="w-full h-7 px-2 border rounded bg-gray-50 text-[10px]" />
                    </div>
                  )}

                  {settings.show_budget && (
                    <div>
                      <label className="block font-semibold text-gray-700">Estimated Budget (₹)</label>
                      <input disabled placeholder="₹1,50,000" className="w-full h-7 px-2 border rounded bg-gray-50 text-[10px]" />
                    </div>
                  )}
                </div>

                <button
                  disabled
                  style={{ backgroundColor: settings.button_color }}
                  className="w-full py-2 text-xs font-bold text-white rounded-lg shadow-sm"
                >
                  {settings.submit_button_text}
                </button>

                <p className="text-[9px] text-center text-gray-400 pt-2 border-t border-gray-100">
                  {settings.footer_text}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-2xl max-w-sm w-full text-center space-y-4">
            <h3 className="text-sm font-bold text-[#111827]">Public Landing Page QR Code</h3>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`}
              alt="QR Code"
              className="size-48 mx-auto border p-2 rounded-xl"
            />
            <p className="text-xs text-gray-500 font-mono truncate">{publicUrl}</p>
            <button onClick={() => setShowQrModal(false)} className="w-full py-2 text-xs font-bold bg-gray-100 rounded-lg text-gray-700">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
