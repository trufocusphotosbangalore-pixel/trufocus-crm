import React, { useState, useEffect } from 'react'
import {
  Image, ExternalLink, Copy, Check, Trash2, Sparkles, Eye,
} from 'lucide-react'
import type { WorkOrder, ProjectGallery } from '@/types/workOrders'
import { updateProjectGallery } from '@/services/supabase/workOrders'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface GalleryTabProps {
  workOrder: WorkOrder
}

export function GalleryTab({ workOrder }: GalleryTabProps) {
  const gallery = workOrder.gallery

  const [galleryUrl, setGalleryUrl] = useState(gallery?.gallery_url || '')
  const [galleryName, setGalleryName] = useState(
    gallery?.gallery_name || `${workOrder.customer_name} ${workOrder.event_type} Gallery`
  )
  const [galleryPassword, setGalleryPassword] = useState(gallery?.gallery_password || '')
  const [publishDate, setPublishDate] = useState(
    gallery?.publish_date || new Date().toISOString().split('T')[0]
  )
  const [expiryDate, setExpiryDate] = useState(gallery?.expiry_date || '')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (workOrder.gallery) {
      setGalleryUrl(workOrder.gallery.gallery_url || '')
      setGalleryName(workOrder.gallery.gallery_name || `${workOrder.customer_name} ${workOrder.event_type} Gallery`)
      setGalleryPassword(workOrder.gallery.gallery_password || '')
      setPublishDate(workOrder.gallery.publish_date || new Date().toISOString().split('T')[0])
      setExpiryDate(workOrder.gallery.expiry_date || '')
    }
  }, [workOrder.gallery, workOrder.customer_name, workOrder.event_type])

  const isPublished = Boolean(gallery && gallery.status === 'published' && gallery.gallery_url)

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault()
    if (!galleryUrl.trim()) {
      toast.error('Please enter a valid Gallery URL.')
      return
    }

    if (!galleryName.trim()) {
      toast.error('Please enter a Gallery Name.')
      return
    }

    const payload: Partial<ProjectGallery> = {
      gallery_url: galleryUrl.trim(),
      gallery_name: galleryName.trim(),
      gallery_password: galleryPassword.trim(),
      publish_date: publishDate,
      expiry_date: expiryDate,
      status: 'published',
    }

    const res = updateProjectGallery(workOrder.id, payload, isPublished ? 'update' : 'publish', 'Admin')
    if (res.success) {
      toast.success(res.message)
    } else {
      toast.error(res.message)
    }
  }

  const handleRemove = () => {
    if (!confirm('Are you sure you want to remove this gallery? The Client Portal will return to "Photo Editing & Color Grading" state.')) {
      return
    }

    const res = updateProjectGallery(workOrder.id, null, 'remove', 'Admin')
    if (res.success) {
      toast.success(res.message)
      setGalleryUrl('')
      setGalleryPassword('')
      setExpiryDate('')
    } else {
      toast.error(res.message)
    }
  }

  const handleCopyLink = () => {
    if (!galleryUrl) return
    navigator.clipboard.writeText(galleryUrl)
    setCopied(true)
    toast.success('Copied Gallery URL to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Top Status Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center font-bold">
            <Image size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#111827]">Client Photo Gallery</h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isPublished
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {isPublished ? '● Published' : '○ Not Published'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Control when the photo gallery is published and visible on the Client Portal
            </p>
          </div>
        </div>

        {isPublished && (
          <div className="flex items-center gap-2">
            <a
              href={galleryUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ExternalLink size={13} /> Open Gallery
            </a>
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
            <button
              onClick={handleRemove}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={13} /> Remove
            </button>
          </div>
        )}
      </div>

      {/* Main Publishing Form */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-5">
        <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
          <h4 className="text-sm font-extrabold text-[#111827]">Gallery Configuration</h4>
          <span className="text-[11px] text-gray-400 font-mono">
            {isPublished && gallery?.updated_at
              ? `Last Published: ${formatDate(gallery.updated_at)}`
              : 'Only Admin can publish'}
          </span>
        </div>

        <form onSubmit={handlePublish} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gallery URL */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-bold mb-1">
                Gallery URL *
              </label>
              <input
                type="url"
                required
                placeholder="e.g. https://gallery.trufocus.photos/gallery/336835?pass_key=397737"
                value={galleryUrl}
                onChange={(e) => setGalleryUrl(e.target.value)}
                className="w-full h-10 px-3.5 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Paste the full Pic-Time / CloudSpot / ShootProof or custom gallery link with pass key.
              </span>
            </div>

            {/* Gallery Name */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">
                Gallery Display Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rajesh & Ananya Wedding Highlights"
                value={galleryName}
                onChange={(e) => setGalleryName(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-bold focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            {/* Gallery Password */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">
                Gallery Password (Optional)
              </label>
              <input
                type="text"
                placeholder="Optional pass code e.g. 397737"
                value={galleryPassword}
                onChange={(e) => setGalleryPassword(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-mono text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            {/* Publish Date */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">
                Publish Date *
              </label>
              <input
                type="date"
                required
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">
              Publishing will automatically notify the customer and display the gallery card in the Client Portal.
            </span>

            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 transition-colors"
            >
              <Sparkles size={15} /> {isPublished ? 'Update Gallery' : 'Publish Gallery'}
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview Card */}
      {galleryUrl && (
        <div className="bg-purple-50/40 p-5 rounded-2xl border border-purple-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#5B3FD9] uppercase tracking-wider flex items-center gap-1.5">
              <Eye size={14} /> Client Portal Card Preview
            </span>
            <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Realtime Synced
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#5B3FD9] tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                  Online Photo Gallery
                </span>
                <h4 className="text-base font-extrabold text-[#111827] mt-1">{galleryName}</h4>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Published: {formatDate(publishDate)} {expiryDate && `• Expires: ${formatDate(expiryDate)}`}
                </p>
              </div>

              {galleryPassword && (
                <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-gray-800">
                  🔑 PIN: {galleryPassword}
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <a
                href={galleryUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white inline-flex items-center gap-1.5 shadow-xs"
              >
                🖼 Open Gallery <ExternalLink size={12} />
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 inline-flex items-center gap-1.5"
              >
                <Copy size={13} /> Copy Gallery Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
