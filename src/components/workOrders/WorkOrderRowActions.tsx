import { useState } from 'react'
import {
  Eye, Pencil, Users, GitBranch, FileText,
  Upload, Image, Trash2, Share2, AlertTriangle, X,
} from 'lucide-react'
import type { WorkOrder } from '@/types/workOrders'
import { canUserPerformDelete } from '@/services/permissionService'
import { softDeleteWorkOrder } from '@/services/supabase/workOrders'
import { PermissionDeniedModal } from '@/components/common/PermissionDeniedModal'
import { toast } from 'react-hot-toast'
import { ActionMenu, type ActionMenuItem } from '@/components/common/ActionMenu'

interface WorkOrderRowActionsProps {
  wo: WorkOrder
  onView: (w: WorkOrder) => void
  onEdit: (w: WorkOrder) => void
  onDelete?: (id: string) => void
  onSharePortal?: (w: WorkOrder) => void
}

export function WorkOrderRowActions({ wo, onView, onEdit, onDelete, onSharePortal }: WorkOrderRowActionsProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPermissionDeniedModal, setShowPermissionDeniedModal] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleExecuteDelete = () => {
    setIsDeleting(true)
    const res = softDeleteWorkOrder(wo.id, 'Admin', deleteReason.trim())
    if (res.success) {
      toast.success(res.message)
      if (onDelete) onDelete(wo.id)
    } else {
      toast.error(res.message)
    }
    setIsDeleting(false)
    setShowDeleteModal(false)
    setDeleteReason('')
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
    {
      icon: Trash2,
      label: 'Delete Work Order',
      danger: true,
      onClick: () => {
        if (!canUserPerformDelete('work_orders')) {
          setShowPermissionDeniedModal(true)
          return
        }
        setShowDeleteModal(true)
      },
    },
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

      {/* Delete Confirmation Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={20} />
                <h3 className="text-base font-extrabold text-[#111827]">Delete Work Order?</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <p className="font-semibold text-gray-800">You are about to delete this Work Order.</p>

              <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 space-y-1 font-sans">
                <p>
                  Project: <strong className="text-gray-900">{wo.project_name}</strong>
                </p>
                <p>
                  Work Order: <strong className="font-mono text-red-700">{wo.work_order_number}</strong>
                </p>
              </div>

              <p className="text-gray-500">
                This action will remove the project and all related records (events, deliverables, payments, receipts, contract).
              </p>

              <div className="pt-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Deletion (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Client requested cancellation / Duplicate entry"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-red-500 font-sans"
                />
              </div>

              <span className="text-[11px] font-bold text-red-600 block">
                ⚠️ Soft delete mode enabled. This Work Order can be restored anytime by an Admin from Settings → Deleted Work Orders.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={13} /> {isDeleting ? 'Deleting...' : 'Delete Work Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PermissionDeniedModal
        isOpen={showPermissionDeniedModal}
        onClose={() => setShowPermissionDeniedModal(false)}
        recordType="Work Order"
      />
    </>
  )
}
