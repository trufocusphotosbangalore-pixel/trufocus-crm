import React, { useState } from 'react'
import {
  MapPin, ExternalLink, Copy, Edit2, Check, Save, AlertTriangle, CheckCircle2, Clock, Calendar,
} from 'lucide-react'
import type { WorkOrderEvent } from '@/types/workOrders'
import { isValidGoogleMapsUrl, formatGoogleMapsUrl } from '@/utils/googleMapsValidator'
import { updateEventGoogleMapsLink } from '@/services/supabase/workOrders'
import { toast } from 'react-hot-toast'

interface PortalEventMapCardProps {
  workOrderId: string
  event: WorkOrderEvent
  onUpdated: () => void
}

export function PortalEventMapCard({ workOrderId, event, onUpdated }: PortalEventMapCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [mapInput, setMapInput] = useState(event.google_map_link || '')
  const [copied, setCopied] = useState(false)

  const hasLocation = Boolean(event.google_map_link && event.google_map_link.trim().length > 0)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!mapInput.trim()) {
      toast.error('Please enter a Google Maps location link.')
      return
    }

    if (!isValidGoogleMapsUrl(mapInput)) {
      toast.error('Please enter a valid Google Maps link (e.g., https://maps.app.goo.gl/...).')
      return
    }

    const formatted = formatGoogleMapsUrl(mapInput)
    const result = updateEventGoogleMapsLink(workOrderId, event.id, formatted, 'Customer')

    if (result.success) {
      toast.success('✅ Venue location saved successfully!')
      setIsEditing(false)
      onUpdated()
    } else {
      toast.error(result.message)
    }
  }

  const handleCopy = () => {
    if (!event.google_map_link) return
    navigator.clipboard.writeText(event.google_map_link)
    setCopied(true)
    toast.success('Copied Google Maps link to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs font-sans space-y-4 transition-all hover:border-purple-200">
      {/* Event Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-[#5B3FD9] tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
            {event.event_type_name}
          </span>
          <h3 className="text-base font-extrabold text-[#111827] mt-1">{event.venue || 'Venue TBD'}</h3>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-[#5B3FD9]" />
            <span>{event.event_date || 'Date TBD'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-[#5B3FD9]" />
            <span>{event.event_time || 'Full Day'}</span>
          </div>
        </div>
      </div>

      {/* Services List */}
      {event.services && event.services.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Services</span>
          <div className="flex flex-wrap gap-1.5">
            {event.services.map((srv) => (
              <span
                key={srv.id}
                className="bg-gray-50 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 text-[11px] font-semibold"
              >
                {srv.service_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Google Maps Location Section */}
      <div className="pt-2">
        {!hasLocation && !isEditing ? (
          /* Missing Location Alert Box */
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold text-amber-900">⚠️ Venue location missing</h4>
                <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                  Please add your venue location link so our photography & videography crew can navigate smoothly on shoot day.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <MapPin size={14} /> Add Google Maps Link
            </button>
          </div>
        ) : isEditing ? (
          /* Edit / Input Form */
          <form onSubmit={handleSave} className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200 space-y-3">
            <div>
              <label className="block text-gray-700 font-bold text-xs mb-1">
                Paste Google Maps Location Link *
              </label>
              <input
                type="url"
                required
                autoFocus
                placeholder="Paste link e.g. https://maps.app.goo.gl/..."
                value={mapInput}
                onChange={(e) => setMapInput(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-white text-gray-900 font-mono focus:outline-none focus:border-[#5B3FD9]"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Open Google Maps app → Search Venue → Tap "Share" → Copy Link
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 h-8 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 h-8 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Save size={13} /> Save Location
              </button>
            </div>
          </form>
        ) : (
          /* Location Display & Quick Actions */
          <div className="bg-purple-50/40 border border-purple-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Venue location saved & synced with studio team</span>
              </div>
              <button
                onClick={() => {
                  setMapInput(event.google_map_link || '')
                  setIsEditing(true)
                }}
                className="text-xs font-bold text-[#5B3FD9] hover:underline flex items-center gap-1"
              >
                <Edit2 size={12} /> Edit Location
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={formatGoogleMapsUrl(event.google_map_link || '')}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <MapPin size={14} /> 📍 View on Google Maps <ExternalLink size={12} />
              </a>

              <button
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
