import { useState, useEffect } from 'react'
import {
  X, Copy, RefreshCw, QrCode, Share2, Check,
  ExternalLink, Eye, EyeOff, Lock, MessageCircle, Mail, Phone,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import type { UserAccount } from '@/types/teamLogin'
import {
  getStaffPortalRecord,
  regenerateStaffPin,
  updateStaffModuleSettings,
  enableStaffPortal,
  disableStaffPortal,
  suspendStaffPortal,
  type StaffModuleVisibilitySettings,
  type StaffPortalRecord,
} from '@/services/crewAuthService'
import { toast } from 'react-hot-toast'

interface ShareStaffPortalModalProps {
  isOpen: boolean
  onClose: () => void
  employee: UserAccount
}

export function ShareStaffPortalModal({
  isOpen,
  onClose,
  employee,
}: ShareStaffPortalModalProps) {
  const [portalRec, setPortalRec] = useState<StaffPortalRecord>(() => getStaffPortalRecord(employee.id))
  const [copied, setCopied] = useState(false)
  const [pinCopied, setPinCopied] = useState(false)
  const [settings, setSettings] = useState<StaffModuleVisibilitySettings>(portalRec.module_settings)

  const portalLink = `${window.location.origin}/crew/login?id=${employee.employee_id || employee.id}`

  useEffect(() => {
    const fresh = getStaffPortalRecord(employee.id)
    setPortalRec(fresh)
    setSettings(fresh.module_settings)
    const handleUpdate = () => {
      const updated = getStaffPortalRecord(employee.id)
      setPortalRec(updated)
      setSettings(updated.module_settings)
    }
    window.addEventListener('trufocus_staff_portal_updated', handleUpdate)
    return () => window.removeEventListener('trufocus_staff_portal_updated', handleUpdate)
  }, [employee])

  if (!isOpen) return null

  const empName = employee.employee_name || employee.full_name || 'Staff Member'
  const empRole = employee.workspace_role || employee.role_name || 'Crew'
  const empIdStr = employee.employee_id || employee.id

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalLink)
    setCopied(true)
    toast.success('Staff portal link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyPin = () => {
    navigator.clipboard.writeText(portalRec.active_pin)
    setPinCopied(true)
    toast.success('Access PIN copied to clipboard!')
    setTimeout(() => setPinCopied(false), 2000)
  }

  const handleRegeneratePin = () => {
    if (confirm(`Regenerate 4-digit PIN for ${empName}? The old PIN will no longer work.`)) {
      const newPin = regenerateStaffPin(employee.id)
      setPortalRec((prev) => ({ ...prev, active_pin: newPin }))
      toast.success(`New PIN generated: ${newPin}`)
    }
  }

  const handleToggleModule = (key: keyof StaffModuleVisibilitySettings) => {
    const updated = { ...settings, [key]: !settings[key] }
    setSettings(updated)
    updateStaffModuleSettings(employee.id, updated)
    toast.success('Staff module visibility updated!')
  }

  const shareText = `Hello ${empName},\n\nWelcome to Trufocus Crew Portal.\n\nPortal Link:\n${portalLink}\n\nAccess PIN:\n${portalRec.active_pin}\n\nRegards,\nTrufocus Photography`

  const handleWhatsAppShare = () => {
    const mobileDigits = (employee.mobile || '').replace(/\D/g, '')
    const url = `https://api.whatsapp.com/send?phone=${mobileDigits}&text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank')
  }

  const handleSmsShare = () => {
    const mobileDigits = (employee.mobile || '').replace(/\D/g, '')
    window.location.href = `sms:${mobileDigits}?body=${encodeURIComponent(shareText)}`
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Trufocus Staff Portal Credentials - ${empName}`)
    const body = encodeURIComponent(shareText)
    window.location.href = `mailto:${employee.email || ''}?subject=${subject}&body=${body}`
  }

  const qrCodeUrl = `https://api.quickchart.io/qr?text=${encodeURIComponent(portalLink)}&size=150`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-2xl rounded-3xl bg-white border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-[#5B3FD9]/15 flex items-center justify-center text-[#5B3FD9] font-bold">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">
                Staff Portal & Sharing
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Share portal credentials with <span className="font-extrabold text-gray-800">{empName}</span> ({empRole} • {empIdStr})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Link & PIN Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Share Link */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">Unique Portal Link</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={portalLink}
                  className="w-full h-9 px-2.5 text-xs rounded-xl bg-white border border-gray-200 font-mono text-gray-800 font-medium"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-2 rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] transition-colors shrink-0 cursor-pointer shadow-2xs"
                  title="Copy Portal Link"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <a
                  href={portalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-gray-900 transition-colors shrink-0 cursor-pointer"
                  title="Open Portal Preview"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* 4 Digit PIN */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">4-Digit Access PIN</span>
                <button
                  onClick={handleRegeneratePin}
                  className="text-[10px] font-bold text-[#5B3FD9] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={10} /> Regenerate
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 px-3.5 py-1 rounded-xl bg-white border border-gray-200">
                  <Lock size={15} className="text-[#5B3FD9]" />
                  <span className="font-mono font-extrabold text-lg text-gray-900 tracking-widest">{portalRec.active_pin}</span>
                </div>
                <button
                  onClick={handleCopyPin}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {pinCopied ? 'Copied!' : 'Copy PIN'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Share Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
            <div>
              <h4 className="text-xs font-extrabold text-gray-900">Quick Send to Staff</h4>
              <p className="text-[11px] text-gray-500 font-medium">Send portal link and access PIN directly via WhatsApp, SMS, or Email</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleWhatsAppShare}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <MessageCircle size={15} /> WhatsApp
              </button>
              <button
                onClick={handleSmsShare}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Phone size={15} /> SMS
              </button>
              <button
                onClick={handleEmailShare}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Mail size={15} /> Email
              </button>
            </div>
          </div>

          {/* QR Code & Security */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-center">
              <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <img src={qrCodeUrl} alt="Staff Portal QR Code" className="size-28" />
              </div>
            </div>
            <div className="sm:col-span-2 space-y-1">
              <h4 className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                <QrCode size={14} className="text-[#5B3FD9]" /> Scan QR Code & Portal Security
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Scan QR code for direct staff portal login. The 4-digit PIN is required for authentication. Employees enter PIN after scanning.
              </p>
            </div>
          </div>

          {/* Staff Module Visibility Toggles */}
          <div className="space-y-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                Staff Module Visibility Controls
              </h4>
              <span className="text-[10px] text-gray-500 font-medium">Enable or hide portal sections for this team member</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { key: 'dashboard', label: 'Dashboard' },
                { key: 'my_assignments', label: 'My Assignments' },
                { key: 'today_schedule', label: 'Today\'s Schedule' },
                { key: 'calendar', label: 'Calendar' },
                { key: 'attendance', label: 'Attendance' },
                { key: 'my_shoots', label: 'My Shoots' },
                { key: 'my_editing', label: 'My Editing' },
                { key: 'equipment', label: 'Equipment' },
                { key: 'reports', label: 'Reports' },
                { key: 'notifications', label: 'Notifications' },
                { key: 'ai_assistant', label: 'AI Assistant' },
                { key: 'profile', label: 'Profile' },
              ].map((item) => {
                const k = item.key as keyof StaffModuleVisibilitySettings
                const enabled = settings[k] !== false
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleToggleModule(k)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-colors cursor-pointer',
                      enabled
                        ? 'bg-purple-50/70 border-[#5B3FD9] text-[#5B3FD9] font-bold shadow-2xs'
                        : 'bg-gray-50 border-gray-200 text-gray-400 font-medium'
                    )}
                  >
                    <span>{item.label}</span>
                    {enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status & Administrative Actions */}
          <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 font-medium">Status:</span>
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border',
                portalRec.portal_status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                portalRec.portal_status === 'suspended' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-100 text-gray-500 border-gray-200'
              )}>
                {portalRec.portal_status || 'active'}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (portalRec.portal_enabled) {
                    disableStaffPortal(employee.id)
                    toast.success(`Disabled staff portal for ${empName}`)
                  } else {
                    enableStaffPortal(employee.id)
                    toast.success(`Enabled staff portal for ${empName}`)
                  }
                }}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold cursor-pointer"
              >
                {portalRec.portal_enabled ? 'Disable Portal' : 'Enable Portal'}
              </button>

              <button
                type="button"
                onClick={() => {
                  suspendStaffPortal(employee.id)
                  toast.success(`Suspended staff portal for ${empName}`)
                }}
                className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold cursor-pointer"
              >
                Suspend Portal
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-extrabold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] cursor-pointer shadow-md shadow-[#5B3FD9]/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
