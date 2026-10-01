import { useState } from 'react'
import { X, AlertTriangle, Send } from 'lucide-react'
import { declineQuotation } from '@/services/quotationStore'
import { toast } from 'react-hot-toast'

interface DeclineQuotationModalProps {
  isOpen: boolean
  onClose: () => void
  quotationNumber: string
  onSubmitted?: () => void
}

export function DeclineQuotationModal({
  isOpen,
  onClose,
  quotationNumber,
  onSubmitted,
}: DeclineQuotationModalProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await declineQuotation(quotationNumber, reason.trim())
      if (res.success) {
        toast.success(res.message)
        if (onSubmitted) onSubmitted()
        onClose()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error('Failed to decline quotation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans text-xs">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle size={20} />
            <h3 className="text-base font-extrabold text-[#111827]">Decline Quotation Proposal</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-gray-600 font-medium">
            You are about to decline quotation proposal <strong className="font-mono text-[#5B3FD9]">{quotationNumber}</strong>. Please let us know the reason so we can improve our packages.
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Reason for Declining (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Budget constraints, date conflict, selected another vendor..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none font-medium"
            />
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-900 text-[11px] font-medium leading-relaxed">
            ⚠️ Declining will notify Trufocus photography and mark your inquiry as declined.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 font-extrabold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={13} /> {isSubmitting ? 'Declining...' : 'Decline Quotation'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
