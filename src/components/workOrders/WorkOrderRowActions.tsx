import { useState } from 'react'
import {
  Eye, Pencil, Users, GitBranch, FileText,
  Upload, Image, Archive, RotateCcw, Share2, X,
} from 'lucide-react'
import type { WorkOrder } from '@/types/workOrders'
import { archiveWorkOrder, unarchiveWorkOrder } from '@/services/supabase/workOrders'
import { toast } from 'react-hot-toast'
import { ActionMenu, type ActionMenuItem } from '@/components/common/ActionMenu'

interface WorkOrderRowActionsProps {
  wo: WorkOrder
  onView: (w: WorkOrder) => void
  onEdit: (w: WorkOrder) => void
  onArchive?: (id: string) => void
  onRestore?: (id: string) => void
  onDelete?: (id: string) => void
  onSharePortal?: (w: WorkOrder) => void
}

export function WorkOrderRowActions({
  wo,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onSharePortal,
}: WorkOrderRowActionsProps) {
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [archiveReason, setArchiveReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const isArchived = Boolean(wo.is_archived || wo.status === 'archived')

  const handleExecuteArchive = () => {
    setIsProcessing(true)
    const res = archiveWorkOrder(wo.id, 'Admin', archiveReason.trim())
    if (res.success) {
      toast.success(res.message)
      if (onArchive) onArchive(wo.id)
      else if (onDelete) onDelete(wo.id)
    } else {
      toast.error(res.message)
    }
    setIsProcessing(false)
    setShowArchiveModal(false)
    setArchiveReason('')
  }

  const handleExecuteRestore = () => {
    setIsProcessing(true)
    const res = unarchiveWorkOrder(wo.id, 'Admin')
    if (res.success) {
      toast.success(res.message)
      if (onRestore) onRestore(wo.id)
      else if (onDelete) onDelete(wo.id)
    } else {
      toast.error(res.message)
    }
    setIsProcessing(false)
  }

  const actionItems: ActionMenuItem[] = [
    { icon: Eye, label: 'View Details', onClick: () => onView(wo) },
    { icon: Share2, label: 'Customer Portal & Share', onClick: () => (onSharePortal ? onSharePortal(wo) : onView(wo)) },
    { icon: Pencil, label: 'Edit Work Order', onClick: () => onEdit(wo) },
    { icon: Users, label: 'Assign Team', onClick: () => onView(wo) },
    { icon: GitBranch, label: 'View Timeline', onClick: () => onView(wo) },
    { icon: FileText, label: 'Generate Invoice', onClick: () => onView(wo) },
    { icon: Upload, label: 'Upload Files', onClick: () => onView(wo) },
    { icon: Image, label: 'Gallery', onClick: () => onView(wo) },
    ...(isArchived
      ? [
          {
            icon: RotateCcw,
            label: 'Restore to Active',
            onClick: handleExecuteRestore,
          },
        ]
      : [
          {
            icon: Archive,
            label: 'Archive Work Order',
            onClick: () => setShowArchiveModal(true),
          },
        ]),
  ]

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => onView(wo)}
          title="View Details"
          className="size-7 rounded-md flex items-center justify-center text-gray-500 hover:text-[#111827] hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Eye size={13} />
        </button>
        <button
          onClick={() => onEdit(wo)}
          title="Edit Work Order"
          className="size-7 rounded-md flex items-center justify-center text-gray-500 hover:text-[#111827] hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Pencil size={13} />
        </button>
        <ActionMenu items={actionItems} menuWidth={220} />
      </div>

      {/* Archive Confirmation Dialog */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-[#5B3FD9]">
                <Archive size={20} />
                <h3 className="text-base font-extrabold text-[#111827]">Archive Work Order?</h3>
              </div>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <p className="font-semibold text-gray-800">
                You are about to archive this Work Order.
              </p>

              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1 font-sans">
                <p>
                  Project: <strong className="text-gray-900">{wo.project_name}</strong>
                </p>
                <p>
                  Work Order: <strong className="font-mono text-[#5B3FD9]">{wo.work_order_number}</strong>
                </p>
                <p>
                  Customer: <strong className="text-gray-900">{wo.customer_name}</strong>
                </p>
              </div>

              <p className="text-gray-500">
                Archiving removes this work order from the active list. All associated records (deliverables, schedules, and financial transactions) remain safely preserved.
              </p>

              <div className="pt-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Reason for Archiving (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Completed & closed / Inactive / Client requested hold"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9] font-sans"
                />
              </div>

              <span className="text-[11px] font-semibold text-[#5B3FD9] block bg-purple-50 p-2.5 rounded-lg border border-purple-100">
                📁 You can access, view, or restore this order anytime from the <strong>Archived</strong> tab.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                disabled={isProcessing}
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isProcessing}
                onClick={handleExecuteArchive}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Archive size={13} /> {isProcessing ? 'Archiving...' : 'Archive Work Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
