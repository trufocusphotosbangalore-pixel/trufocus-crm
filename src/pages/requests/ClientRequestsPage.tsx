import React, { useState, useMemo } from 'react'
import {
  MessageSquare, Search, Plus, RotateCcw, Eye,
} from 'lucide-react'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import {
  getClientRequests,
  updateRequestStatus,
  assignRequestEmployee,
} from '@/services/clientRequestStore'
import { getTeamMembers } from '@/services/teamStore'
import type { ClientRequest, RequestStatus } from '@/types/clientRequests'
import {
  REQUEST_CATEGORY_LIST,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  REQUEST_PRIORITY_COLORS,
} from '@/types/clientRequests'
import { NewRequestModal } from '@/components/clientRequests/NewRequestModal'
import { RequestDetailsDrawer } from '@/components/clientRequests/RequestDetailsDrawer'
import { toast } from 'react-hot-toast'

export default function ClientRequestsPage() {
  const [requests, setRequests] = useState<ClientRequest[]>(() => getClientRequests())
  const teamMembers = getTeamMembers()

  // Search & Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Modals & Drawer State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedDrawerRequest, setSelectedDrawerRequest] = useState<ClientRequest | null>(null)

  // Real-time synchronization
  useRealtimeSync(() => {
    setRequests(getClientRequests())
  })

  const refreshList = () => {
    setRequests(getClientRequests())
  }

  // Summary Metrics
  const newRequestsCount = useMemo(() => requests.filter((r) => r.status === 'new').length, [requests])
  const pendingRequestsCount = useMemo(() => requests.filter((r) => r.status === 'assigned' || r.status === 'waiting_for_customer').length, [requests])
  const inProgressCount = useMemo(() => requests.filter((r) => r.status === 'in_progress').length, [requests])
  const resolvedCount = useMemo(() => requests.filter((r) => r.status === 'resolved' || r.status === 'closed').length, [requests])

  // Filtered List
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const query = search.toLowerCase()
      const matchesSearch =
        !search ||
        r.request_number.toLowerCase().includes(query) ||
        r.customer_name.toLowerCase().includes(query) ||
        r.work_order_number.toLowerCase().includes(query) ||
        r.subject.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query)

      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || r.priority === priorityFilter
      const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory
    })
  }, [requests, search, statusFilter, priorityFilter, categoryFilter])

  const handleStatusChange = (requestId: string, newStatus: RequestStatus, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation()
    updateRequestStatus(requestId, newStatus, 'Studio Staff')
    toast.success(`Updated status to ${REQUEST_STATUS_LABELS[newStatus]}`)
    refreshList()
  }

  const handleAssigneeChange = (requestId: string, empId: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation()
    const emp = teamMembers.find((m) => m.id === empId)
    if (!emp) return
    assignRequestEmployee(requestId, emp.id, `${emp.full_name} (${emp.job_role})`)
    toast.success(`Assigned request to ${emp.full_name}`)
    refreshList()
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <MessageSquare size={20} />
            </span>
            <h1 className="text-xl font-extrabold text-[#111827]">Client Requests Module</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Communication bridge tracking customer inquiries, revisions, and feedback across Client Portal & Work Orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshList}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw size={13} /> Refresh
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-md shadow-[#5B3FD9]/20 transition-colors"
          >
            <Plus size={15} /> New Request
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-sans">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">New Requests</span>
          <span className="text-xl font-extrabold text-blue-700 font-mono mt-1 block">{newRequestsCount}</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Pending Requests</span>
          <span className="text-xl font-extrabold text-amber-700 font-mono mt-1 block">{pendingRequestsCount}</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">In Progress</span>
          <span className="text-xl font-extrabold text-[#5B3FD9] font-mono mt-1 block">{inProgressCount}</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Recently Resolved</span>
          <span className="text-xl font-extrabold text-emerald-700 font-mono mt-1 block">{resolvedCount}</span>
        </div>
      </div>

      {/* Sticky Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Request REQ-2026-XXXX, customer, Work Order, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-400 text-[10px] uppercase">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-bold focus:outline-none focus:border-[#5B3FD9]"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_for_customer">Waiting for Customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-400 text-[10px] uppercase">Category</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-bold focus:outline-none focus:border-[#5B3FD9]"
          >
            <option value="all">All Categories</option>
            {REQUEST_CATEGORY_LIST.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-400 text-[10px] uppercase">Priority</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-bold focus:outline-none focus:border-[#5B3FD9]"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Client Requests Master Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAFAFC] border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                <th className="px-4 py-3">Request No</th>
                <th className="px-4 py-3">Work Order</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Assigned Employee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400 italic">
                    No client requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#5B3FD9]">
                      {req.request_number}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">
                      <a
                        href={`/work-orders/${req.work_order_id}`}
                        title="Open Work Order details"
                        className="text-[#5B3FD9] bg-[#5B3FD9]/10 hover:bg-[#5B3FD9]/20 hover:underline px-2 py-0.5 rounded cursor-pointer transition-colors inline-block"
                      >
                        {req.work_order_number}
                      </a>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {req.customer_name}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-600">
                      {req.category}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 max-w-xs truncate">
                      {req.subject}
                    </td>
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
                      <select
                        value={req.assigned_to_id || ''}
                        onChange={(e) => handleAssigneeChange(req.id, e.target.value, e)}
                        className="h-7 px-2 text-[11px] font-bold rounded-lg border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:border-[#5B3FD9]"
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req.id, e.target.value as RequestStatus, e)}
                        className={`h-7 px-2 text-[11px] font-bold rounded-lg ${REQUEST_STATUS_COLORS[req.status].bg} ${REQUEST_STATUS_COLORS[req.status].text} focus:outline-none`}
                      >
                        <option value="new">New</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="waiting_for_customer">Waiting for Customer</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedDrawerRequest(req)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-[#5B3FD9] hover:text-white text-gray-700 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye size={13} /> View & Reply
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      {isNewModalOpen && (
        <NewRequestModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
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
