import { useState } from 'react'
import { MessageSquare, Plus, Eye } from 'lucide-react'
import type { WorkOrder } from '@/types/workOrders'
import { getClientRequests } from '@/services/clientRequestStore'
import { formatDate } from '@/lib/utils'
import type { ClientRequest } from '@/types/clientRequests'
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  REQUEST_PRIORITY_COLORS,
} from '@/types/clientRequests'
import { NewRequestModal } from '@/components/clientRequests/NewRequestModal'
import { RequestDetailsDrawer } from '@/components/clientRequests/RequestDetailsDrawer'

interface CustomerPortalRequestsTabProps {
  workOrder: WorkOrder
}

export function CustomerPortalRequestsTab({ workOrder }: CustomerPortalRequestsTabProps) {
  const [requests, setRequests] = useState<ClientRequest[]>(() =>
    getClientRequests().filter(
      (r) => r.work_order_id === workOrder.id || r.work_order_number === workOrder.work_order_number
    )
  )

  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedDrawerRequest, setSelectedDrawerRequest] = useState<ClientRequest | null>(null)

  const refreshList = () => {
    setRequests(
      getClientRequests().filter(
        (r) => r.work_order_id === workOrder.id || r.work_order_number === workOrder.work_order_number
      )
    )
  }

  return (
    <div className="space-y-6 font-sans text-xs animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <MessageSquare size={20} />
            </span>
            <h2 className="text-xl font-extrabold text-[#111827]">Client Requests</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Need help or have a request? Send your request to the Trufocus Photography team. We'll respond as soon as possible.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-md shadow-[#5B3FD9]/20 transition-colors"
        >
          <Plus size={15} /> Raise New Request
        </button>
      </div>

      {/* Requests Table OR Empty State */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center space-y-4 shadow-xs">
          <div className="size-16 rounded-2xl bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center font-bold text-2xl mx-auto">
            📩
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#111827]">No requests yet</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              Need assistance, have a revision request, or a suggestion? Click <strong>"Raise New Request"</strong> to contact the Trufocus Photography team.
            </p>
          </div>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white inline-flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 transition-colors"
          >
            <Plus size={15} /> Raise New Request
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">My Requests History</h3>
            <span className="font-mono text-xs font-bold text-[#5B3FD9]">{requests.length} Requests Submitted</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFAFC] border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                  <th className="px-4 py-3">Request No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#5B3FD9]">
                      {req.request_number}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-medium">{formatDate(req.created_at)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{req.category}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{req.subject}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          REQUEST_PRIORITY_COLORS[req.priority].bg
                        } ${REQUEST_PRIORITY_COLORS[req.priority].text}`}
                      >
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          REQUEST_STATUS_COLORS[req.status].bg
                        } ${REQUEST_STATUS_COLORS[req.status].text}`}
                      >
                        {REQUEST_STATUS_LABELS[req.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedDrawerRequest(req)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-[#5B3FD9] hover:text-white text-gray-700 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye size={13} /> View & Reply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {isNewModalOpen && (
        <NewRequestModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          defaultWorkOrderId={workOrder.id}
          defaultCustomerName={workOrder.customer_name}
          defaultMobile={workOrder.mobile}
          onSaved={refreshList}
        />
      )}

      {/* Request Details Drawer */}
      {selectedDrawerRequest && (
        <RequestDetailsDrawer
          isOpen={!!selectedDrawerRequest}
          onClose={() => setSelectedDrawerRequest(null)}
          request={selectedDrawerRequest}
          userRole="customer"
          onUpdated={refreshList}
        />
      )}
    </div>
  )
}
