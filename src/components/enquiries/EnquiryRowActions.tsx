import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, Pencil, MessageCircle, Mail, FileText,
  ArrowRightCircle, Trash2, AlertTriangle, X, ShieldAlert, ExternalLink,
} from 'lucide-react'
import type { Enquiry } from '@/types/enquiries'
import { canUserPerformDelete } from '@/services/permissionService'
import { softDeleteEnquiry } from '@/services/supabase/enquiries'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { ActionMenu, type ActionMenuItem } from '@/components/common/ActionMenu'
import { PermissionDeniedModal } from '@/components/common/PermissionDeniedModal'

interface EnquiryRowActionsProps {
  enquiry: Enquiry
  onView: (e: Enquiry) => void
  onEdit: (e: Enquiry) => void
  onDelete?: (id: string) => void
  onConvertToWorkOrder?: (e: Enquiry) => void
  onCreateQuotation?: (e: Enquiry) => void
}

export function EnquiryRowActions({
  enquiry,
  onView,
  onEdit,
  onDelete,
  onConvertToWorkOrder,
  onCreateQuotation,
}: EnquiryRowActionsProps) {
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPermissionDeniedModal, setShowPermissionDeniedModal] = useState(false)
  const [showConvertedModal, setShowConvertedModal] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const isConverted = enquiry.converted_to_work_order || Boolean(enquiry.work_order_id) || enquiry.status === 'converted'
  const workOrderNumber = enquiry.work_order_number || 'WO-2025-614'

  const handleWhatsApp = () => {
    const phone = enquiry.mobile.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Hi ${enquiry.customer_name}, this is Trufocus Photography. We received your enquiry for ${enquiry.event_type} event. How can we assist you?`
    )
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  const handleEmail = () => {
    if (!enquiry.email) return
    window.open(
      `mailto:${enquiry.email}?subject=Your Photography Enquiry — ${enquiry.enquiry_number}`,
      '_blank'
    )
  }

  const handleOpenDelete = () => {
    if (!canUserPerformDelete('enquiries')) {
      setShowPermissionDeniedModal(true)
      return
    }
    if (isConverted) {
      setShowConvertedModal(true)
    } else {
      setShowDeleteModal(true)
    }
  }

  const handleExecuteDelete = () => {
    setIsDeleting(true)
    const res = softDeleteEnquiry(enquiry.id, 'Admin', deleteReason.trim())
    if (res.success) {
      toast.success(res.message)
      if (onDelete) onDelete(enquiry.id)
    } else if (res.isConverted) {
      setShowDeleteModal(false)
      setShowConvertedModal(true)
    } else {
      toast.error(res.message)
    }
    setIsDeleting(false)
    setShowDeleteModal(false)
    setDeleteReason('')
  }

  const actionItems: ActionMenuItem[] = [
    { icon: Eye, label: 'View', onClick: () => onView(enquiry) },
    { icon: Pencil, label: 'Edit', onClick: () => onEdit(enquiry) },
    { icon: FileText, label: 'Create / View Quotation', onClick: () => onCreateQuotation ? onCreateQuotation(enquiry) : onView(enquiry) },
    { icon: MessageCircle, label: 'Send WhatsApp', onClick: handleWhatsApp },
    { icon: Mail, label: 'Send Email', onClick: handleEmail, disabled: !enquiry.email },
    ...(onConvertToWorkOrder
      ? [{
          icon: ArrowRightCircle,
          label: 'Convert to Work Order',
          onClick: () => onConvertToWorkOrder(enquiry),
        }]
      : []),
    {
      icon: Trash2,
      label: 'Delete Enquiry',
      danger: true,
      onClick: handleOpenDelete,
    },
  ]

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => onView(enquiry)}
          title="View Details"
          className="size-7 rounded-md flex items-center justify-center text-gray-500 hover:text-[#111827] hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Eye size={13} />
        </button>
        <button
          onClick={() => onEdit(enquiry)}
          title="Edit Enquiry"
          className="size-7 rounded-md flex items-center justify-center text-gray-500 hover:text-[#111827] hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onCreateQuotation ? onCreateQuotation(enquiry) : onView(enquiry)}
          title="Create / View Quotation"
          className="size-7 rounded-md flex items-center justify-center text-[#5B3FD9] bg-[#5B3FD9]/10 hover:bg-[#5B3FD9] hover:text-white transition-colors cursor-pointer"
        >
          <FileText size={13} />
        </button>

        <ActionMenu items={actionItems} menuWidth={220} />
      </div>

      {/* ─── Delete Confirmation Dialog ─── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans text-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={20} />
                <h3 className="text-base font-extrabold text-[#111827]">Delete Enquiry?</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-gray-600">
              <p className="font-semibold text-gray-800">You are about to delete this enquiry.</p>

              <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 space-y-1">
                <p>
                  Customer: <strong className="text-gray-900">{enquiry.customer_name}</strong>
                </p>
                <p>
                  Enquiry No: <strong className="font-mono text-red-700">{enquiry.enquiry_number}</strong>
                </p>
                <p>
                  Event: <strong className="capitalize text-gray-800">{enquiry.event_type}</strong>
                </p>
                <p>
                  Event Date: <strong className="text-gray-800">{enquiry.event_date ? formatDate(enquiry.event_date) : 'TBD'}</strong>
                </p>
              </div>

              <p className="text-gray-500">
                This action will remove the lead. Soft delete mode enabled so Admins can restore it from Settings → Deleted Enquiries.
              </p>

              <div className="pt-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Deletion (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Invalid inquiry / Duplicate lead / Customer lost interest"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="px-4 py-2 font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={13} /> {isDeleting ? 'Deleting...' : 'Delete Enquiry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Converted Protection Modal ─── */}
      {showConvertedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans text-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-amber-600">
                <ShieldAlert size={22} />
                <h3 className="text-base font-extrabold text-[#111827]">Cannot Delete Converted Enquiry</h3>
              </div>
              <button onClick={() => setShowConvertedModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-gray-600">
              <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold leading-relaxed">
                This enquiry has already been converted into Work Order <span className="font-mono text-[#5B3FD9] underline">{workOrderNumber}</span> and cannot be deleted.
              </p>
              <p className="text-gray-500">
                To preserve booking history and ledger integrity, converted leads must remain linked to their active Work Order.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowConvertedModal(false)}
                className="px-4 py-2 font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowConvertedModal(false)
                  navigate(`/projects/${enquiry.work_order_id || workOrderNumber}`)
                }}
                className="px-4 py-2 font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <ExternalLink size={13} /> Open Work Order
              </button>
            </div>
          </div>
        </div>
      )}

      <PermissionDeniedModal
        isOpen={showPermissionDeniedModal}
        onClose={() => setShowPermissionDeniedModal(false)}
        recordType="Enquiry"
      />
    </>
  )
}
