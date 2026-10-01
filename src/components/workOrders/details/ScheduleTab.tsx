import React, { useState } from 'react'
import {
  Calendar, Clock, MapPin, Pencil, Camera, ExternalLink, Copy, Check, AlertTriangle, Edit2, Save, Link2, Plus, Users,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatDate } from '@/lib/utils'
import type { WorkOrder, WorkOrderEvent } from '@/types/workOrders'
import { isValidGoogleMapsUrl, formatGoogleMapsUrl } from '@/utils/googleMapsValidator'
import { updateEventGoogleMapsLink } from '@/services/supabase/workOrders'
import { generateGoogleCalendarUrl } from '@/services/googleCalendarService'
import { toast } from 'react-hot-toast'

interface ScheduleTabProps {
  workOrder: WorkOrder
  onEditSchedule: () => void
}

export function ScheduleTab({ workOrder, onEditSchedule }: ScheduleTabProps) {
  const events = workOrder.events || []
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [mapInput, setMapInput] = useState<string>('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleOpenEdit = (evt: WorkOrderEvent) => {
    setEditingEventId(evt.id)
    setMapInput(evt.google_map_link || '')
  }

  const handleSaveMap = (evt: WorkOrderEvent, e: React.FormEvent) => {
    e.preventDefault()
    if (!mapInput.trim()) {
      toast.error('Please enter a Google Maps link.')
      return
    }

    if (!isValidGoogleMapsUrl(mapInput)) {
      toast.error('Please enter a valid Google Maps link (e.g. https://maps.app.goo.gl/...).')
      return
    }

    const formatted = formatGoogleMapsUrl(mapInput)
    const res = updateEventGoogleMapsLink(workOrder.id, evt.id, formatted, 'Coordinator')

    if (res.success) {
      toast.success('✅ Saved Google Maps location link!')
      setEditingEventId(null)
    } else {
      toast.error(res.message)
    }
  }

  const handleCopyLink = (evt: WorkOrderEvent) => {
    if (!evt.google_map_link) return
    navigator.clipboard.writeText(evt.google_map_link)
    setCopiedId(evt.id)
    toast.success('Copied Google Maps link to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-[#111827]">Event Schedule & Venues</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Read-only event shoot breakdown, venue locations, and Google Maps directions for {workOrder.work_order_number}
          </p>
        </div>
        <button
          onClick={onEditSchedule}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Pencil size={13} /> Edit Full Schedule
        </button>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center text-xs text-gray-500">
          No events created for this Work Order yet.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((evt, idx) => {
            const hasLink = Boolean(evt.google_map_link && evt.google_map_link.trim().length > 0)
            const isEditing = editingEventId === evt.id

            return (
              <div key={evt.id || idx} className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
                {/* Event Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="size-9 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9] font-extrabold text-sm flex items-center justify-center border border-[#5B3FD9]/20">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-base font-extrabold text-[#111827]">{evt.event_type_name || 'Event Shoot'}</h4>
                      <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={13} className="text-[#5B3FD9]" />
                        <span>Venue: <strong>{evt.venue || 'Venue Name Not Specified'}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                    {evt.event_date && (
                      <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                        <Calendar size={14} className="text-[#5B3FD9]" /> {formatDate(evt.event_date)}
                      </span>
                    )}
                    {evt.event_time && (
                      <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                        <Clock size={14} className="text-[#5B3FD9]" /> {evt.event_time}
                      </span>
                    )}
                  </div>
                </div>

                {/* Read-Only Google Maps Location Section */}
                <div className="text-xs">
                  {isEditing ? (
                    <form onSubmit={(e) => handleSaveMap(evt, e)} className="bg-purple-50/50 p-4 rounded-2xl border border-purple-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-[#111827] font-extrabold text-xs">
                          Edit Google Maps Location Link for {evt.event_type_name}
                        </label>
                        <span className="text-[10px] font-mono text-[#5B3FD9] font-bold">2-Way Portal & CRM Sync</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          required
                          autoFocus
                          placeholder="Paste link e.g. https://maps.app.goo.gl/..."
                          value={mapInput}
                          onChange={(e) => setMapInput(e.target.value)}
                          className="flex-1 h-9 px-3 text-xs rounded-xl border border-gray-200 bg-white text-gray-900 font-mono focus:outline-none focus:border-[#5B3FD9]"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingEventId(null)}
                          className="px-3.5 h-9 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 h-9 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Save size={13} /> Save Location
                        </button>
                      </div>
                    </form>
                  ) : hasLink ? (
                    <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-100 flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#111827]">
                          <MapPin size={15} className="text-[#5B3FD9] shrink-0" />
                          <span>Venue Location</span>
                        </div>
                        <p className="text-xs font-bold text-gray-800 truncate">{evt.venue || 'Venue Address'}</p>
                        <div className="flex items-center gap-1.5 text-xs text-[#5B3FD9] font-mono font-medium truncate pt-0.5">
                          <Link2 size={13} className="shrink-0" />
                          <span className="truncate">{evt.google_map_link}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            const url = generateGoogleCalendarUrl(workOrder, evt)
                            window.open(url, '_blank')
                            toast.success('Opening pre-filled Google Calendar event page...')
                          }}
                          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-100 text-[#5B3FD9] hover:bg-purple-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          📅 Google Calendar
                        </button>

                        <a
                          href={formatGoogleMapsUrl(evt.google_map_link || '')}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          📍 Open Map <ExternalLink size={12} />
                        </a>

                        <button
                          onClick={() => handleCopyLink(evt)}
                          className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
                        >
                          {copiedId === evt.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          <span>{copiedId === evt.id ? 'Copied!' : 'Copy Link'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(evt)}
                          className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 size={13} /> Edit Link
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                        <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                        <span>⚠️ Venue location not added</span>
                      </div>

                      <button
                        onClick={() => handleOpenEdit(evt)}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Plus size={13} /> Add Location
                      </button>
                    </div>
                  )}
                </div>

                {/* Services & Team Assignments Breakdown */}
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <Users size={14} className="text-[#5B3FD9]" /> Services & Assigned Team
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {(evt.services || []).length} Services Configured
                    </span>
                  </div>

                  {(evt.services || []).length === 0 ? (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-400 italic">
                      No services configured for this event.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(evt.services || []).map((srv, sIdx) => {
                        const team = srv.assigned_team || []
                        const isAssigned = team.length > 0

                        return (
                          <div
                            key={srv.id || sIdx}
                            className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 space-y-3 shadow-2xs"
                          >
                            {/* Service Title Bar */}
                            <div className="flex items-center justify-between border-b border-gray-200/80 pb-2.5">
                              <div className="flex items-center gap-2">
                                <div className="size-7 rounded-lg bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center font-bold">
                                  <Camera size={14} />
                                </div>
                                <div>
                                  <h5 className="font-extrabold text-xs text-[#111827]">
                                    {srv.service_name}
                                  </h5>
                                  <p className="text-[10px] text-gray-500 font-medium">
                                    {srv.quantity || 1} Staff Required {srv.start_time && `• ${srv.start_time}`} {srv.end_time && `- ${srv.end_time}`}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={cn(
                                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border',
                                  isAssigned
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-amber-50 text-amber-700 border-amber-300'
                                )}
                              >
                                {isAssigned ? 'Assigned' : 'Pending Assignment'}
                              </span>
                            </div>

                            {/* Assigned Members List */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                Assigned Team:
                              </span>

                              {isAssigned ? (
                                <div className="space-y-1.5">
                                  {team.map((member) => (
                                    <div
                                      key={member.employee_id}
                                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-gray-200 shadow-2xs text-xs font-semibold"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="size-6 rounded-full bg-[#5B3FD9] text-white flex items-center justify-center text-[10px] font-extrabold">
                                          {member.employee_name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-[#111827] font-bold">
                                          {member.employee_name}
                                        </span>
                                      </div>

                                      {member.role_title && (
                                        <span className="text-[10px] font-bold text-[#5B3FD9] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                                          {member.role_title}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="px-3 py-2 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-800 font-medium italic flex items-center justify-between">
                                  <span>Unassigned</span>
                                  <span className="text-[10px] font-semibold text-amber-600">Pending Assignment</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
