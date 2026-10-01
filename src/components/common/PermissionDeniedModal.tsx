import { ShieldAlert, X } from 'lucide-react'

export interface PermissionDeniedModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  recordType?: string
}

export function PermissionDeniedModal({
  isOpen,
  onClose,
  title = 'Permission Denied',
  message,
  recordType = 'Work Order',
}: PermissionDeniedModalProps) {
  if (!isOpen) return null

  const displayMessage =
    message ||
    `You don't have permission to delete this ${recordType}.\n\nPlease contact your Administrator if this action is required.`

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-5 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="size-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert size={32} />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-extrabold text-[#111827]">{title}</h3>
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line px-2">
            {displayMessage}
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-[#5B3FD9] hover:bg-[#4C34C3] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
