import { useState } from 'react'
import { X, MessageSquare, Send } from 'lucide-react'
import { requestQuotationChanges } from '@/services/quotationStore'
import { toast } from 'react-hot-toast'

interface RequestChangesModalProps {
  isOpen: boolean
  onClose: () => void
  quotationNumber: string
  onSubmitted?: () => void
}

export function RequestChangesModal({
  isOpen,
  onClose,
  quotationNumber,
  onSubmitted,
}: RequestChangesModalProps) {
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter details of the requested changes.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await requestQuotationChanges(quotationNumber, feedback.trim())
      if (res.success) {
        toast.success('Revision request submitted to Trufocus team! 📩')
        if (onSubmitted) onSubmitted()
        onClose()
      } else {
        toast.error(res.message)
      }
    } catch (e) {
      toast.error('Failed submitting revision request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans text-xs">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-amber-600">
            <MessageSquare size={18} />
            <h3 className="text-sm font-extrabold text-gray-900">Request Quotation Changes</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Please specify what adjustments or additions you would like to make to Quotation <strong className="font-mono text-[#5B3FD9]">{quotationNumber}</strong>.
          </p>
          <textarea
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Please add Drone coverage for Reception event, or revise the payment schedule dates..."
            className="w-full p-3 text-xs rounded-xl border border-gray-200 font-medium text-gray-900 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-4 py-2 font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Send size={13} /> {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}
