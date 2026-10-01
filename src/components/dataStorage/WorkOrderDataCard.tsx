import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown, ChevronUp, Pencil, Check, X, HardDrive, AlertCircle,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { WorkOrderDataGroup, DataStorageRecord } from '@/types/dataStorage'
import { EventStorageTable } from './EventStorageTable'
import { ProgressBar } from '@/components/workOrders/WorkOrderBadges'
import { saveBulkStorageRecords } from '@/services/dataStorageStore'
import { toast } from 'react-hot-toast'

interface WorkOrderDataCardProps {
  group: WorkOrderDataGroup
  onSaved: () => void
}

export function WorkOrderDataCard({ group, onSaved }: WorkOrderDataCardProps) {
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Mutable copy of records during edit mode
  const [draftRecords, setDraftRecords] = useState<Record<string, DataStorageRecord>>({})

  const allGroupRecords = group.events.flatMap((e) => e.records)

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    const map: Record<string, DataStorageRecord> = {}
    allGroupRecords.forEach((r) => {
      map[r.id] = { ...r }
    })
    setDraftRecords(map)
    setIsEditing(true)
    setIsExpanded(true)
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(false)
    setDraftRecords({})
  }

  const handleRecordChange = (recordId: string, updates: Partial<DataStorageRecord>) => {
    setDraftRecords((prev) => {
      const target = prev[recordId] || allGroupRecords.find((r) => r.id === recordId)
      if (!target) return prev
      return {
        ...prev,
        [recordId]: {
          ...target,
          ...updates,
        },
      }
    })
  }

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    const recordsToSave = Object.values(draftRecords)
    if (recordsToSave.length > 0) {
      saveBulkStorageRecords(recordsToSave)
      toast.success(`Data storage location updated for ${group.work_order_number}!`)
    }
    setIsEditing(false)
    setDraftRecords({})
    onSaved()
  }

  const progressPercent = Math.min(
    100,
    Math.round((group.completed_records / (group.total_records || 1)) * 100)
  )

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden font-sans transition-all duration-200">
      {/* Card Header Bar (Collapsible trigger) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/80 transition-colors select-none"
      >
        {/* Left Info */}
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center font-bold">
            <HardDrive size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/work-orders/${group.work_order_id}`)
                }}
                className="font-mono font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 hover:underline px-2.5 py-0.5 rounded text-xs cursor-pointer"
              >
                {group.work_order_number}
              </button>
              <h3 className="text-base font-bold text-[#111827]">{group.customer_name}</h3>
              {group.has_issue && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] flex items-center gap-1">
                  <AlertCircle size={11} /> Issue Found
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Event: <strong>{group.event_type}</strong> • Mobile: {group.mobile} {group.city ? `• City: ${group.city}` : ''}
            </p>
          </div>
        </div>

        {/* Right Actions & Progress */}
        <div className="flex items-center gap-5">
          {/* Completion Counter & Progress Bar */}
          <div className="text-right min-w-[140px]">
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-gray-500 text-[11px]">Records Status</span>
              <span className="font-mono text-[#5B3FD9]">
                {group.completed_records} / {group.total_records} Recorded
              </span>
            </div>
            <ProgressBar value={progressPercent} />
          </div>

          {/* Edit / Save Actions */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-1"
                >
                  <X size={13} /> Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-2xs"
                >
                  <Check size={13} /> Save Details
                </button>
              </>
            ) : (
              <button
                onClick={handleStartEdit}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
              >
                <Pencil size={13} /> Edit Data Location
              </button>
            )}
          </div>

          {/* Expand/Collapse Icon */}
          <div className="size-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Expanded Content (Events & Crew Tables) */}
      {isExpanded && (
        <div className="border-t border-[#E5E7EB] p-5 bg-gray-50/40 space-y-6">
          {group.events.map((evt) => {
            const recordsToDisplay = evt.records.map(
              (r) => (isEditing && draftRecords[r.id] ? draftRecords[r.id] : r)
            )

            return (
              <div key={evt.event_id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#5B3FD9]" />
                    <h4 className="text-sm font-bold text-[#111827]">{evt.event_name} Shoot</h4>
                    {evt.event_date && (
                      <span className="text-xs text-gray-400 font-medium">({formatDate(evt.event_date)})</span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-gray-400">
                    {recordsToDisplay.length} Crew Members Assigned
                  </span>
                </div>

                <EventStorageTable
                  records={recordsToDisplay}
                  isEditing={isEditing}
                  onRecordChange={handleRecordChange}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
