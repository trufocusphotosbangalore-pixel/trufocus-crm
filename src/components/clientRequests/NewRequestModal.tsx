import React, { useState } from 'react'
import { X, MessageSquarePlus, CheckCircle2, Upload } from 'lucide-react'
import type { RequestCategory, RequestPriority } from '@/types/clientRequests'
import { REQUEST_CATEGORY_LIST } from '@/types/clientRequests'
import { createClientRequest } from '@/services/clientRequestStore'
import { getLocalWorkOrders } from '@/services/supabase/workOrders'
import { toast } from 'react-hot-toast'

interface NewRequestModalProps {
  isOpen: boolean
  onClose: () => void
  defaultWorkOrderId?: string
  defaultCustomerName?: string
  defaultMobile?: string
  onSaved: () => void
}

export function NewRequestModal({
  isOpen,
  onClose,
  defaultWorkOrderId,
  defaultCustomerName,
  defaultMobile,
  onSaved,
}: NewRequestModalProps) {
  const workOrders = getLocalWorkOrders()

  const [selectedWoId, setSelectedWoId] = useState<string>(defaultWorkOrderId || workOrders[0]?.id || '')
  const [category, setCategory] = useState<RequestCategory>('Photo Editing')
  const [subject, setSubject] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [priority, setPriority] = useState<RequestPriority>('medium')
  const [contactMethod, setContactMethod] = useState<'whatsapp' | 'phone' | 'email'>('whatsapp')
  const [fileName, setFileName] = useState<string>('')

  if (!isOpen) return null

  const targetWO = workOrders.find((w) => w.id === selectedWoId) || workOrders[0]
  const custName = defaultCustomerName || targetWO?.customer_name || 'Valued Client'
  const custMobile = defaultMobile || targetWO?.mobile || '+91 98765 43210'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) {
      toast.error('Please enter a subject and detailed description.')
      return
    }

    const created = createClientRequest({
      work_order_id: targetWO?.id || 'wo-101',
      work_order_number: targetWO?.work_order_number || 'WO-2025-001',
      customer_name: custName,
      customer_mobile: custMobile,
      category,
      subject,
      description,
      priority,
      preferred_contact_method: contactMethod,
      attachments: fileName
        ? [
            {
              id: `att-${Date.now()}`,
              file_name: fileName,
              file_size_mb: 3.5,
              file_url: '#',
              uploaded_at: new Date().toISOString(),
            },
          ]
        : [],
    })

    toast.success(`✅ Request Submitted Successfully! Reference #${created.request_number}`)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <MessageSquarePlus size={20} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#111827]">Submit Client Request / Feedback</h2>
              <p className="text-xs text-gray-500">
                Connected to Work Order: <strong>{targetWO?.work_order_number} ({custName})</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {!defaultWorkOrderId && (
            <div>
              <label className="block text-gray-700 font-bold mb-1">Work Order *</label>
              <select
                value={selectedWoId}
                onChange={(e) => setSelectedWoId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-[#5B3FD9]"
              >
                {workOrders.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.work_order_number} • {w.customer_name} ({w.event_type})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Request Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RequestCategory)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-[#5B3FD9]"
              >
                {REQUEST_CATEGORY_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Priority *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as RequestPriority)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-[#5B3FD9]"
              >
                <option value="medium">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Subject / Summary *</label>
            <input
              type="text"
              required
              placeholder="e.g. Skin retouching request for bride family group portraits"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Detailed Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Describe your request, revisions, or question in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Preferred Contact Method</label>
              <select
                value={contactMethod}
                onChange={(e) => setContactMethod(e.target.value as 'whatsapp' | 'phone' | 'email')}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:border-[#5B3FD9]"
              >
                <option value="whatsapp">WhatsApp Message</option>
                <option value="phone">Phone Call</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Upload Attachments (Max 20 MB)</label>
              <div className="relative border border-dashed border-gray-300 rounded-xl p-2.5 bg-gray-50 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors">
                <Upload size={14} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-600 truncate max-w-[180px]">
                  {fileName || 'Attach image/PDF/ZIP...'}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf,.zip,.docx"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 h-9 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-md shadow-[#5B3FD9]/20 transition-colors"
            >
              <CheckCircle2 size={15} /> Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
