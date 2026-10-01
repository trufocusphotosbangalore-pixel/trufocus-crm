import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, ExternalLink, Copy, CheckCircle2, Check, MapPin, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { WorkOrder, WorkOrderEvent } from '@/types/workOrders'
import {
  generateGoogleCalendarUrl,
  isCalendarSynced,
  toggleCalendarSynced,
} from '@/services/googleCalendarService'
import { toast } from 'react-hot-toast'

interface CalendarTabProps {
  workOrder: WorkOrder
}

export function CalendarTab({ workOrder }: CalendarTabProps) {
  const events = workOrder.events || []
  const [syncedMap, setSyncedMap] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const list = workOrder.events || []
    const map: Record<string, boolean> = {}
    if (list.length === 0) {
      map['main'] = isCalendarSynced(workOrder.work_order_number, 'main')
    } else {
      list.forEach((evt) => {
        map[evt.id] = isCalendarSynced(workOrder.work_order_number, evt.id)
      })
    }
    setSyncedMap(map)

    const handleSyncUpdate = () => {
      const updatedList = workOrder.events || []
      const updatedMap: Record<string, boolean> = {}
      if (updatedList.length === 0) {
        updatedMap['main'] = isCalendarSynced(workOrder.work_order_number, 'main')
      } else {
        updatedList.forEach((evt) => {
          updatedMap[evt.id] = isCalendarSynced(workOrder.work_order_number, evt.id)
        })
      }
      setSyncedMap(updatedMap)
    }
    window.addEventListener('workOrdersUpdated', handleSyncUpdate)
    return () => window.removeEventListener('workOrdersUpdated', handleSyncUpdate)
  }, [workOrder])

  const handleOpenGoogleCalendar = (evt?: WorkOrderEvent) => {
    const url = generateGoogleCalendarUrl(workOrder, evt)
    window.open(url, '_blank')
    toast.success('Opening pre-filled Google Calendar event page...')
  }

  const handleCopyLink = (evt?: WorkOrderEvent, idKey: string = 'main') => {
    const url = generateGoogleCalendarUrl(workOrder, evt)
    navigator.clipboard.writeText(url)
    setCopiedId(idKey)
    toast.success('Google Calendar event link copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleToggleSynced = (eventId?: string) => {
    const idKey = eventId || 'main'
    const newState = toggleCalendarSynced(workOrder.work_order_number, eventId)
    setSyncedMap((prev) => ({ ...prev, [idKey]: newState }))
    if (newState) {
      toast.success('✅ Event marked as synced to Google Calendar!')
    } else {
      toast('Marked as not synced', { icon: '⚪' })
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#E5E7EB] pb-4 gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#111827]">Google Calendar Events & Key Dates</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Sync shoot schedules, venue directions, and customer details directly to Google Calendar (Asia/Kolkata)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenGoogleCalendar(events[0])}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <CalendarIcon size={14} /> 📅 Open in Google Calendar
            </button>
            <button
              onClick={() => handleCopyLink(events[0], events[0]?.id || 'main')}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Copy size={13} /> 📋 Copy Calendar Link
            </button>
          </div>
        </div>

        {/* Events Cards List */}
        {events.length === 0 ? (
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-100 text-[#5B3FD9] flex items-center justify-center font-bold">
                <CalendarIcon size={18} />
              </div>
              <div>
                <p className="font-extrabold text-[#111827] text-sm">{workOrder.project_name} - Shoot Date</p>
                <p className="text-xs text-gray-500 font-medium">Venue: {workOrder.venue || 'Main Venue'}</p>
                <p className="text-xs text-[#5B3FD9] font-bold font-mono">
                  {workOrder.booking_date ? formatDate(workOrder.booking_date) : 'Date TBD'} • 10:00 AM – 02:00 PM
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleOpenGoogleCalendar()}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1 transition-colors"
              >
                📅 Open in Google Calendar <ExternalLink size={12} />
              </button>
              <button
                onClick={() => handleCopyLink(undefined, 'main')}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 flex items-center gap-1 transition-colors"
              >
                {copiedId === 'main' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copiedId === 'main' ? 'Copied' : 'Copy Link'}
              </button>
              <button
                onClick={() => handleToggleSynced()}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1 ${
                  syncedMap['main']
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {syncedMap['main'] ? '✅ Synced' : '⚪ Not Synced'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((evt, idx) => {
              const isSynced = Boolean(syncedMap[evt.id])

              return (
                <div key={evt.id || idx} className="p-5 rounded-2xl bg-gray-50/80 border border-gray-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="size-8 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9] font-extrabold text-xs flex items-center justify-center border border-[#5B3FD9]/20">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-[#111827] text-sm">
                          {workOrder.project_name} - {evt.event_type_name || 'Event Shoot'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 pt-0.5 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-[#5B3FD9]" /> {evt.venue || workOrder.venue || 'Venue Address'}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-[#5B3FD9]">
                            <CalendarIcon size={13} /> {evt.event_date ? formatDate(evt.event_date) : 'TBD'}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500">
                            <Clock size={13} /> {evt.event_time || 'Full Day'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                      isSynced ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {isSynced ? '✅ Synced' : '⚪ Not Synced'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="text-xs text-gray-500 font-medium">
                      Location: <strong className="text-gray-800">{evt.google_map_link || evt.venue || workOrder.venue || 'Venue Location'}</strong>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleOpenGoogleCalendar(evt)}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        📅 Open in Google Calendar <ExternalLink size={12} />
                      </button>
                      <button
                        onClick={() => handleCopyLink(evt, evt.id)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedId === evt.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        {copiedId === evt.id ? 'Copied' : '📋 Copy Link'}
                      </button>
                      <button
                        onClick={() => handleToggleSynced(evt.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
                          isSynced
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {isSynced ? '✅ Mark Unsynced' : '✔ Mark Synced'}
                      </button>
                    </div>
                  </div>

                  {/* Assigned Crew Members */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Assigned Crew:</span>
                      {(() => {
                        const allAssigned = (evt.services || []).flatMap((s) => s.assigned_team || [])
                        if (allAssigned.length === 0) {
                          return <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Unassigned</span>
                        }
                        return allAssigned.map((m, mIdx) => (
                          <span key={m.employee_id || mIdx} className="px-2 py-0.5 rounded-full bg-purple-50 text-[#5B3FD9] border border-purple-200 text-[10px] font-bold">
                            {m.employee_name} {m.role_title && `(${m.role_title})`}
                          </span>
                        ))
                      })()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Milestone Delivery Date Card */}
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="font-bold text-[#111827]">Final Output Delivery Target</p>
              <p className="text-[10px] text-gray-500">Edited photos & video release deadline</p>
            </div>
          </div>
          <p className="font-bold text-blue-600">
            {workOrder.final_delivery_date ? formatDate(workOrder.final_delivery_date) : 'Within 30 Days'}
          </p>
        </div>
      </div>
    </div>
  )
}
