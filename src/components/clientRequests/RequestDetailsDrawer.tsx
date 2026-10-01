import React, { useState } from 'react'
import {
  X, Send, Paperclip, MessageSquare, MessageCircle,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { ClientRequest, RequestStatus } from '@/types/clientRequests'
import {
  REQUEST_STATUS_LABELS,
  REQUEST_PRIORITY_COLORS,
} from '@/types/clientRequests'
import {
  updateRequestStatus,
  assignRequestEmployee,
  addRequestMessage,
} from '@/services/clientRequestStore'
import { getTeamMembers } from '@/services/teamStore'
import { toast } from 'react-hot-toast'

interface RequestDetailsDrawerProps {
  request: ClientRequest | null
  isOpen: boolean
  onClose: () => void
  userRole?: 'staff' | 'customer'
  onUpdated: () => void
}

export function RequestDetailsDrawer({
  request,
  isOpen,
  onClose,
  userRole = 'staff',
  onUpdated,
}: RequestDetailsDrawerProps) {
  const teamMembers = getTeamMembers()
  const [replyText, setReplyText] = useState('')

  if (!isOpen || !request) return null

  const handleStatusChange = (newStatus: RequestStatus) => {
    updateRequestStatus(request.id, newStatus, userRole === 'staff' ? 'Studio Staff' : request.customer_name)
    toast.success(`Updated status to ${REQUEST_STATUS_LABELS[newStatus]}`)
    onUpdated()
  }

  const handleAssigneeChange = (empId: string) => {
    const emp = teamMembers.find((m) => m.id === empId)
    if (!emp) return
    assignRequestEmployee(request.id, emp.id, `${emp.full_name} (${emp.job_role})`)
    toast.success(`Assigned request to ${emp.full_name}`)
    onUpdated()
  }

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return

    const senderName = userRole === 'staff' ? 'Trufocus Support Team' : request.customer_name
    const senderRole = userRole === 'staff' ? 'Customer Support' : 'Client'

    addRequestMessage(request.id, userRole, senderName, replyText, senderRole)
    setReplyText('')
    toast.success('Reply sent successfully!')
    onUpdated()
  }

  const handleWhatsApp = () => {
    const cleanNum = request.customer_mobile.replace(/[^\d]/g, '')
    const msg = `Hello ${request.customer_name}! Regarding your Trufocus request ${request.request_number} (${request.subject})...`
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl border-l border-gray-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 border-b border-gray-200 bg-gray-50/60 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-0.5 rounded text-xs">
                  {request.request_number}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    REQUEST_PRIORITY_COLORS[request.priority].bg
                  } ${REQUEST_PRIORITY_COLORS[request.priority].text}`}
                >
                  {request.priority} Priority
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-[#111827] mt-1.5 line-clamp-1">{request.subject}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Client: <strong>{request.customer_name}</strong> • {request.work_order_number}
              </p>
            </div>

            <button
              onClick={onClose}
              className="size-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Drawer Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* Quick Actions & Status Workflow Controls */}
            <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Status Dropdown */}
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase mb-1">Status Workflow</label>
                  <select
                    value={request.status}
                    onChange={(e) => handleStatusChange(e.target.value as RequestStatus)}
                    className="w-full h-8 px-2.5 text-xs rounded-xl border border-gray-200 bg-white font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                  >
                    <option value="new">New</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_for_customer">Waiting for Customer</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Assigned Employee Dropdown */}
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase mb-1">Assigned Employee</label>
                  <select
                    value={request.assigned_to_id || ''}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs rounded-xl border border-gray-200 bg-white font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
                  >
                    <option value="">Select Employee...</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.job_role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-[11px] text-gray-500 font-medium">
                  Category: <strong>{request.category}</strong>
                </span>
                <button
                  onClick={handleWhatsApp}
                  className="px-3 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors"
                >
                  <MessageCircle size={12} /> WhatsApp Client
                </button>
              </div>
            </div>

            {/* Request Description Card */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Initial Client Request</span>
              <p className="text-gray-800 font-medium whitespace-pre-line leading-relaxed">{request.description}</p>
              
              {/* Attachments */}
              {request.attachments.length > 0 && (
                <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                  {request.attachments.map((att) => (
                    <span
                      key={att.id}
                      className="inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-700 hover:bg-gray-200 cursor-pointer"
                    >
                      <Paperclip size={12} className="text-[#5B3FD9]" /> {att.file_name} ({att.file_size_mb} MB)
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 2-Way Conversation Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-[#5B3FD9]" /> Conversation Timeline ({request.messages.length})
              </h4>

              <div className="space-y-3">
                {request.messages.map((msg) => {
                  const isStaff = msg.sender_type === 'staff'
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${isStaff ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="font-bold text-[11px] text-gray-800">{msg.sender_name}</span>
                        {msg.sender_role && (
                          <span className="text-[10px] text-[#5B3FD9] bg-purple-50 px-1.5 py-0.2 rounded font-bold">
                            {msg.sender_role}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-mono">{formatDate(msg.created_at)}</span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl leading-relaxed text-xs shadow-2xs ${
                          isStaff
                            ? 'bg-[#5B3FD9] text-white rounded-tr-none'
                            : 'bg-gray-100 text-gray-900 rounded-tl-none border border-gray-200'
                        }`}
                      >
                        {msg.message_text}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Reply Footer Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <form onSubmit={handleSendReply} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={userRole === 'staff' ? 'Type reply to client...' : 'Type message to studio team...'}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#5B3FD9] font-medium"
              />
              <button
                type="submit"
                className="h-9 px-4 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
