import { useState, useEffect } from 'react'
import {
  X, Copy, RefreshCw, QrCode, Share2, Check,
  ExternalLink, Eye, EyeOff, Lock, MessageCircle, Mail,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import type { WorkOrder } from '@/types/workOrders'
import {
  getOrCreatePortalForWorkOrder,
  regeneratePortalPin,
  updatePortalModuleSettings,
} from '@/services/customerPortalStore'
import type { PortalModuleSettings } from '@/types/customerPortal'
import { toast } from 'react-hot-toast'

interface SharePortalModalProps {
  isOpen: boolean
  onClose: () => void
  workOrder: WorkOrder
}

export function SharePortalModal({
  isOpen,
  onClose,
  workOrder,
}: SharePortalModalProps) {
  const [portal, setPortal] = useState(() => getOrCreatePortalForWorkOrder(workOrder))
  const [copied, setCopied] = useState(false)
  const [pinCopied, setPinCopied] = useState(false)
  const [settings, setSettings] = useState<PortalModuleSettings>(portal.settings)

  useEffect(() => {
    const fresh = getOrCreatePortalForWorkOrder(workOrder)
    setPortal(fresh)
    setSettings(fresh.settings)
    const handleUpdate = () => {
      const updated = getOrCreatePortalForWorkOrder(workOrder)
      setPortal(updated)
      setSettings(updated.settings)
    }
    window.addEventListener('trufocus_portal_updated', handleUpdate)
    return () => window.removeEventListener('trufocus_portal_updated', handleUpdate)
  }, [workOrder])

  if (!isOpen) return null

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portal.share_link)
    setCopied(true)
    toast.success('Portal link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyPin = () => {
    navigator.clipboard.writeText(portal.pin_code)
    setPinCopied(true)
    toast.success('Access PIN copied to clipboard!')
    setTimeout(() => setPinCopied(false), 2000)
  }

  const handleRegeneratePin = () => {
    if (confirm('Regenerate PIN for this customer portal? The old PIN will no longer work.')) {
      const newPin = regeneratePortalPin(portal.id)
      setPortal(prev => ({ ...prev, pin_code: newPin }))
      toast.success(`New PIN generated: ${newPin}`)
    }
  }

  const handleToggleModule = (key: keyof PortalModuleSettings) => {
    const updated = { ...settings, [key]: !settings[key] }
    setSettings(updated)
    updatePortalModuleSettings(portal.id, updated)
    toast.success('Portal visibility settings updated!')
  }

  const shareText = `Hello ${workOrder.customer_name},\n\nHere is your private Customer Portal for ${workOrder.project_name}:\n\nPortal Link: ${portal.share_link}\nAccess PIN: ${portal.pin_code}\n\nView event schedule, pay online, sign agreement & track project deliverables.\n\nTrufocus Photography`

  const handleWhatsAppShare = () => {
    const mobileDigits = workOrder.mobile.replace(/\D/g, '')
    const url = `https://api.whatsapp.com/send?phone=${mobileDigits}&text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank')
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Trufocus Customer Portal - ${workOrder.project_name}`)
    const body = encodeURIComponent(shareText)
    window.location.href = `mailto:${workOrder.email || ''}?subject=${subject}&body=${body}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-[var(--radius-xl)] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[var(--color-primary)]/15 flex items-center justify-center text-[var(--color-primary)]">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[var(--color-text-primary)]">
                Customer Portal & Sharing
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Share portal credentials with <span className="font-medium text-[var(--color-text-secondary)]">{workOrder.customer_name}</span> ({workOrder.work_order_number})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Link & PIN Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Share Link */}
            <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Unique Portal Link</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={portal.share_link}
                  className="w-full h-8 px-2.5 text-xs rounded bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] font-mono text-[var(--color-text-primary)]"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-2 rounded bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors shrink-0"
                  title="Copy Portal Link"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <a
                  href={portal.share_link}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
                  title="Open Portal Preview"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* 4 Digit PIN */}
            <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">4-Digit Access PIN</span>
                <button
                  onClick={handleRegeneratePin}
                  className="text-[10px] font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={10} /> Regenerate
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">
                  <Lock size={14} className="text-[var(--color-primary)]" />
                  <span className="font-mono font-bold text-lg text-[var(--color-text-primary)] tracking-widest">{portal.pin_code}</span>
                </div>
                <button
                  onClick={handleCopyPin}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                >
                  {pinCopied ? 'Copied!' : 'Copy PIN'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Share Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[var(--color-primary-light)]/40 border border-[var(--color-primary)]/30">
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Quick Send to Client</h4>
              <p className="text-[11px] text-[var(--color-text-muted)]">Send portal link and access PIN directly via WhatsApp or Email</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleWhatsAppShare}
                className="px-3.5 py-2 text-xs font-semibold rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <MessageCircle size={15} /> WhatsApp
              </button>
              <button
                onClick={handleEmailShare}
                className="px-3.5 py-2 text-xs font-semibold rounded-md bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Mail size={15} /> Email
              </button>
            </div>
          </div>

          {/* QR Code & Security */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
            <div className="flex items-center justify-center">
              <div className="p-2 bg-white rounded-lg border shadow-xs">
                <img src={portal.qr_code_url} alt="Portal QR Code" className="size-28" />
              </div>
            </div>
            <div className="sm:col-span-2 space-y-1">
              <h4 className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <QrCode size={14} className="text-[var(--color-primary)]" /> Printed QR Code & Portal Security
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Scan QR code for direct portal access. The 4-digit PIN is required for authentication. Clients cannot view other work orders.
              </p>
            </div>
          </div>

          {/* Admin Module Visibility Toggles */}
          <div className="space-y-3 pt-2 border-t border-[var(--color-border-default)]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Admin Module Visibility Controls
              </h4>
              <span className="text-[10px] text-[var(--color-text-muted)]">Enable or hide portal sections for this client</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { key: 'show_payments', label: 'Payments & Ledger' },
                { key: 'show_contract', label: 'Contract Agreement' },
                { key: 'show_schedule', label: 'Event Schedule' },
                { key: 'show_moodboard', label: 'Moodboard' },
                { key: 'show_gallery', label: 'Photo Gallery' },
                { key: 'show_deliverables', label: 'Deliverables' },
                { key: 'show_documents', label: 'Documents' },
                { key: 'show_support', label: 'Studio Support' },
                { key: 'enable_online_payments', label: 'Online Pay Button' },
              ].map((item) => {
                const k = item.key as keyof PortalModuleSettings
                const enabled = settings[k]
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleToggleModule(k)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors',
                      enabled
                        ? 'bg-[var(--color-primary-light)]/50 border-[var(--color-primary)] text-[var(--color-primary)] font-medium'
                        : 'bg-[var(--color-bg-surface)] border-[var(--color-border-default)] text-[var(--color-text-muted)]'
                    )}
                  >
                    <span>{item.label}</span>
                    {enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-md bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
