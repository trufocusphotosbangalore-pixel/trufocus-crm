import { HardDrive } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type {
  DataStorageRecord,
  BackupStatus,
  DataCopiedStatus,
} from '@/types/dataStorage'
import {
  BACKUP_STATUS_LABELS,
  BACKUP_STATUS_COLORS,
  DATA_COPIED_LABELS,
  STORAGE_DEVICE_OPTIONS,
} from '@/types/dataStorage'

interface EventStorageTableProps {
  records: DataStorageRecord[]
  isEditing: boolean
  onRecordChange?: (recordId: string, updates: Partial<DataStorageRecord>) => void
}

export function EventStorageTable({
  records,
  isEditing,
  onRecordChange,
}: EventStorageTableProps) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 font-sans">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-[#FAFAFC] border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="px-3.5 py-2.5">Crew Member</th>
            <th className="px-3.5 py-2.5">Role</th>
            <th className="px-3.5 py-2.5">Storage Device</th>
            <th className="px-3.5 py-2.5">Folder Path</th>
            <th className="px-3.5 py-2.5">Memory Card</th>
            <th className="px-3.5 py-2.5">Backup Status</th>
            <th className="px-3.5 py-2.5">Copied</th>
            <th className="px-3.5 py-2.5">Remarks</th>
            <th className="px-3.5 py-2.5 text-right">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {records.map((r) => {
            const statusConfig = BACKUP_STATUS_COLORS[r.backup_status] || BACKUP_STATUS_COLORS.not_started

            return (
              <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                {/* Crew Member */}
                <td className="px-3.5 py-3 font-bold text-[#111827]">
                  <div className="flex items-center gap-1.5">
                    <div className="size-6 rounded-full bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center font-bold text-[10px]">
                      {(r.employee_name || 'C')[0].toUpperCase()}
                    </div>
                    <span>{r.employee_name || 'Crew Member'}</span>
                  </div>
                </td>

                {/* Role */}
                <td className="px-3.5 py-3 font-semibold text-gray-600 whitespace-nowrap">
                  {r.role_title || r.service_name}
                </td>

                {/* Storage Device */}
                <td className="px-3.5 py-3">
                  {isEditing ? (
                    <select
                      value={r.storage_device}
                      onChange={(e) => onRecordChange?.(r.id, { storage_device: e.target.value })}
                      className="h-8 px-2 rounded-lg border border-gray-200 bg-gray-50 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                    >
                      {STORAGE_DEVICE_OPTIONS.map((dev) => (
                        <option key={dev} value={dev}>
                          {dev}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                      <HardDrive size={11} className="text-[#5B3FD9]" /> {r.storage_device}
                    </span>
                  )}
                </td>

                {/* Folder Path */}
                <td className="px-3.5 py-3">
                  {isEditing ? (
                    <input
                      type="text"
                      value={r.folder_path}
                      onChange={(e) => onRecordChange?.(r.id, { folder_path: e.target.value })}
                      className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-gray-50 font-mono text-xs text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                    />
                  ) : (
                    <span className="font-mono text-gray-600 truncate max-w-[180px] block" title={r.folder_path}>
                      {r.folder_path || '—'}
                    </span>
                  )}
                </td>

                {/* Memory Card */}
                <td className="px-3.5 py-3">
                  {isEditing ? (
                    <input
                      type="text"
                      value={r.memory_card}
                      onChange={(e) => onRecordChange?.(r.id, { memory_card: e.target.value })}
                      className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                    />
                  ) : (
                    <span className="text-gray-700 font-medium whitespace-nowrap">
                      {r.memory_card || '—'}
                    </span>
                  )}
                </td>

                {/* Backup Status */}
                <td className="px-3.5 py-3">
                  {isEditing ? (
                    <select
                      value={r.backup_status}
                      onChange={(e) => onRecordChange?.(r.id, { backup_status: e.target.value as BackupStatus })}
                      className="h-8 px-2 rounded-lg border border-gray-200 bg-gray-50 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="backing_up">Backing Up</option>
                      <option value="completed">Backup Completed</option>
                      <option value="verified">Verified</option>
                    </select>
                  ) : (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                      {BACKUP_STATUS_LABELS[r.backup_status] || 'Not Started'}
                    </span>
                  )}
                </td>

                {/* Data Copied */}
                <td className="px-3.5 py-3">
                  {isEditing ? (
                    <select
                      value={r.data_copied}
                      onChange={(e) => onRecordChange?.(r.id, { data_copied: e.target.value as DataCopiedStatus })}
                      className="h-8 px-2 rounded-lg border border-gray-200 bg-gray-50 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                      <option value="partial">Partial</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.data_copied === 'yes' ? 'bg-emerald-50 text-emerald-700' : r.data_copied === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {DATA_COPIED_LABELS[r.data_copied]}
                    </span>
                  )}
                </td>

                {/* Remarks */}
                <td className="px-3.5 py-3">
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="Remarks..."
                      value={r.remark}
                      onChange={(e) => onRecordChange?.(r.id, { remark: e.target.value })}
                      className="w-full h-8 px-2 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                    />
                  ) : (
                    <span className="text-gray-600 italic truncate max-w-[150px] block" title={r.remark}>
                      {r.remark || '—'}
                    </span>
                  )}
                </td>

                {/* Last Updated */}
                <td className="px-3.5 py-3 text-right text-[11px] font-mono text-gray-400 whitespace-nowrap">
                  {formatDate(r.updated_at)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
