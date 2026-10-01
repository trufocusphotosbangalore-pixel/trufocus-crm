import { useState } from 'react'
import {
  Image, ExternalLink, Copy, Check, Clock, Sparkles, MessageCircle,
} from 'lucide-react'
import type { WorkOrder } from '@/types/workOrders'
import { formatDate } from '@/lib/utils'
import { formatGoogleMapsUrl } from '@/utils/googleMapsValidator'
import { toast } from 'react-hot-toast'

interface PortalGalleryViewProps {
  workOrder: WorkOrder
}

export function PortalGalleryView({ workOrder }: PortalGalleryViewProps) {
  const gallery = workOrder.gallery
  const isPublished = Boolean(gallery && gallery.status === 'published' && gallery.gallery_url)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedPin, setCopiedPin] = useState(false)

  const handleCopyLink = () => {
    if (!gallery?.gallery_url) return
    navigator.clipboard.writeText(gallery.gallery_url)
    setCopiedLink(true)
    toast.success('Copied Gallery URL to clipboard!')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyPin = () => {
    if (!gallery?.gallery_password) return
    navigator.clipboard.writeText(gallery.gallery_password)
    setCopiedPin(true)
    toast.success('Copied Gallery Password to clipboard!')
    setTimeout(() => setCopiedPin(false), 2000)
  }

  const handleWhatsAppShare = () => {
    if (!gallery?.gallery_url) return
    const text = encodeURIComponent(
      `Check out our official photo gallery for ${workOrder.project_name}:\n${gallery.gallery_url}${
        gallery.gallery_password ? `\nPassword: ${gallery.gallery_password}` : ''
      }`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  if (!isPublished || !gallery) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center space-y-6 shadow-xs font-sans text-xs animate-in fade-in duration-200">
        <div className="size-20 rounded-3xl bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center mx-auto shadow-xs">
          <Sparkles size={36} />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-xl font-extrabold text-[#111827]">📷 Online Photo Gallery</h2>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Your high-resolution edited photographs are currently being processed by the Trufocus post-production team.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs">
          <Clock size={15} className="text-amber-600 shrink-0" />
          <span>Current Stage: Photo Editing & Color Grading</span>
        </div>

        <div className="bg-[#FAFAFC] border border-gray-200 p-4 rounded-xl max-w-md mx-auto text-gray-400 text-xs italic">
          No gallery available yet. As soon as your gallery is published by the studio administrator, it will appear here automatically with direct access.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans text-xs animate-in fade-in duration-200">
      {/* Main Gallery Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-2xl bg-[#5B3FD9] text-white flex items-center justify-center font-bold shadow-md shadow-[#5B3FD9]/20">
              <Image size={24} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#5B3FD9] tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                Published Gallery
              </span>
              <h3 className="text-lg font-extrabold text-[#111827] mt-1">{gallery.gallery_name}</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Published on {formatDate(gallery.publish_date)} {gallery.expiry_date && `• Valid until ${formatDate(gallery.expiry_date)}`}
              </p>
            </div>
          </div>

          {/* Password Info Box */}
          {gallery.gallery_password && (
            <div className="bg-purple-50/80 border border-purple-200 p-3 rounded-xl space-y-1 text-right shrink-0">
              <span className="text-[10px] font-bold uppercase text-purple-700 block tracking-wider">
                🔑 Gallery Access Password
              </span>
              <div className="flex items-center justify-end gap-2">
                <span className="font-mono text-sm font-extrabold text-[#5B3FD9]">{gallery.gallery_password}</span>
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="p-1 rounded bg-white hover:bg-purple-100 text-[#5B3FD9] transition-colors border border-purple-200"
                  title="Copy Password"
                >
                  {copiedPin ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Gallery Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={formatGoogleMapsUrl(gallery.gallery_url)}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white inline-flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 transition-colors"
            >
              🖼 Open Gallery <ExternalLink size={14} />
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 inline-flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied Link!' : 'Copy Gallery Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 inline-flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle size={14} className="text-emerald-600" /> Share Gallery
            </button>
          </div>

          <span className="text-[11px] text-gray-400 font-mono">
            Direct High-Resolution Access
          </span>
        </div>
      </div>
    </div>
  )
}
