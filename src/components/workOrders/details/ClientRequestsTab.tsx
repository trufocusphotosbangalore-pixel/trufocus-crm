import { useState } from 'react'
import { MessageSquare, Plus, Eye } from 'lucide-react'
import type { WorkOrder } from '@/types/workOrders'
import { getClientRequests } from '@/services/clientRequestStore'
import type { ClientRequest } from '@/types/clientRequests'
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  REQUEST_PRIORITY_COLORS,
} from '@/types/clientRequests'
import { NewRequestModal } from '@/components/clientRequests/NewRequestModal'
import { RequestDetailsDrawer } from '@/components/clientRequests/RequestDetailsDrawer'

interface ClientRequestsTabProps {
  workOrder: WorkOrder
}

export function ClientRequestsTab({ workOrder }: ClientRequestsTabProps) {
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
    <div className="space-y-4 font-sans text-xs">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
            <MessageSquare size={16} className="text-[#5B3FD9]" /> Client Requests & Feedback
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Customer portal messages and revision requests linked to {workOrder.work_order_number}
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus size={14} /> New Request
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FAFAFC] border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
              <th className="px-3.5 py-2.5">Request No</th>
              <th className="px-3.5 py-2.5">Category</th>
              <th className="px-3.5 py-2.5">Subject</th>
              <th className="px-3.5 py-2.5">Priority</th>
              <th className="px-3.5 py-2.5">Assigned Employee</th>
              <th className="px-3.5 py-2.5">Status</th>
              <th className="px-3.5 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3.5 py-6 text-center text-gray-400 italic">
                  No requests submitted yet for this Work Order.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono font-bold text-[#5B3FD9]">
                    {req.request_number}
                  </td>
                  <td className="px-3.5 py-2.5 font-medium text-gray-700">{req.category}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-gray-900">{req.subject}</td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        REQUEST_PRIORITY_COLORS[req.priority].bg
                      } ${REQUEST_PRIORITY_COLORS[req.priority].text}`}
                    >
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 font-medium text-gray-700">
                    {req.assigned_to_name || 'Unassigned'}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        REQUEST_STATUS_COLORS[req.status].bg
                      } ${REQUEST_STATUS_COLORS[req.status].text}`}
                    >
                      {REQUEST_STATUS_LABELS[req.status]}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <button
                      onClick={() => setSelectedDrawerRequest(req)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-gray-200 bg-gray-50 hover:bg-[#5B3FD9] hover:text-white text-gray-700 transition-colors inline-flex items-center gap-1"
                    >
                      <Eye size={11} /> View & Reply
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
          userRole="staff"
          onUpdated={refreshList}
        />
      )}
    </div>
  )
}
