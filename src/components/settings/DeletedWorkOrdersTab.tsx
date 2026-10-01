import { useState, useEffect } from 'react'
import {
  Trash2, RotateCcw, Search, X, ShieldAlert,
} from 'lucide-react'
import type { WorkOrder } from '@/types/workOrders'
import {
  fetchDeletedWorkOrders,
  restoreWorkOrder,
  hardDeleteWorkOrder,
} from '@/services/supabase/workOrders'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'react-hot-toast'

export function DeletedWorkOrdersTab() {
  const [deletedOrders, setDeletedOrders] = useState<WorkOrder[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [hardDeleteTarget, setHardDeleteTarget] = useState<WorkOrder | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<WorkOrder | null>(null)

  const refreshList = () => {
    setDeletedOrders(fetchDeletedWorkOrders())
  }

  useEffect(() => {
    refreshList()

    const handleUpdate = () => refreshList()
    window.addEventListener('workOrdersUpdated', handleUpdate)
    return () => window.removeEventListener('workOrdersUpdated', handleUpdate)
  }, [])

  const handleConfirmRestore = () => {
    if (!restoreTarget) return
    const res = restoreWorkOrder(restoreTarget.id, 'Admin')
    if (res.success) {
      toast.success(res.message)
      refreshList()
    } else {
      toast.error(res.message)
    }
    setRestoreTarget(null)
  }

  const handleConfirmHardDelete = () => {
    if (!hardDeleteTarget) return
    const res = hardDeleteWorkOrder(hardDeleteTarget.id, 'Admin')
    if (res.success) {
      toast.success(res.message)
      refreshList()
    } else {
      toast.error(res.message)
    }
    setHardDeleteTarget(null)
  }

  const filteredOrders = deletedOrders.filter((wo) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      wo.project_name.toLowerCase().includes(q) ||
      wo.work_order_number.toLowerCase().includes(q) ||
      wo.customer_name.toLowerCase().includes(q) ||
      (wo.mobile && wo.mobile.includes(q))
    )
  })

  return (
    <div className="space-y-5 font-sans text-xs">
      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trash2 size={20} className="text-red-600" />
            <h3 className="text-base font-extrabold text-[#111827]">Deleted Work Orders / Trash Management</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-extrabold text-[10px]">
              Admin Recovery
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Soft-deleted Work Orders are archived here. You can restore them to active projects or permanently purge them.
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 font-extrabold text-red-700 text-xs">
          {deletedOrders.length} Soft-Deleted Work Orders
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search deleted projects by name, client, WO number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 h-8 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
          />
        </div>
      </div>

      {/* Deleted Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Trash2 size={36} className="mx-auto text-gray-300" />
            <h4 className="text-sm font-extrabold text-gray-800">No Deleted Work Orders Found</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Soft-deleted Work Orders will appear here where Admins can restore them anytime.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                  <th className="p-3.5 pl-5">Work Order & Project</th>
                  <th className="p-3.5">Client & Contact</th>
                  <th className="p-3.5">Grand Total</th>
                  <th className="p-3.5">Deleted Date & Time</th>
                  <th className="p-3.5">Deleted By & Reason</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((wo) => {
                  const deletedBy = (wo as any).deleted_by || 'Admin'
                  const reason = (wo as any).delete_reason || 'N/A'
                  const grandTotal = wo.payment?.grand_total || 0

                  return (
                    <tr key={wo.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-3.5 pl-5">
                        <span className="font-mono text-xs font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                          {wo.work_order_number}
                        </span>
                        <p className="font-extrabold text-[#111827] text-sm mt-0.5">{wo.project_name}</p>
                        <p className="text-[10px] text-gray-400">{wo.event_type} • {wo.city || 'Bengaluru'}</p>
                      </td>

                      <td className="p-3.5">
                        <p className="font-extrabold text-gray-900">{wo.customer_name}</p>
                        <p className="text-[10px] font-mono text-gray-400">{wo.mobile}</p>
                      </td>

                      <td className="p-3.5 font-extrabold text-[#5B3FD9]">
                        {formatCurrency(grandTotal)}
                      </td>

                      <td className="p-3.5 font-mono text-gray-600">
                        {wo.deleted_at ? formatDate(wo.deleted_at) : 'Recently'}
                      </td>

                      <td className="p-3.5 space-y-0.5">
                        <p className="font-bold text-gray-800">{deletedBy}</p>
                        <p className="text-[10px] text-gray-400 italic">"{reason}"</p>
                      </td>

                      <td className="p-3.5 text-right pr-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setRestoreTarget(wo)}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Restore Work Order to active projects"
                          >
                            <RotateCcw size={12} /> Restore
                          </button>

                          <button
                            onClick={() => setHardDeleteTarget(wo)}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Permanently hard delete"
                          >
                            <Trash2 size={12} /> Delete Permanently
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
                <RotateCcw className="text-emerald-600" size={18} /> Restore Work Order?
              </h3>
              <button onClick={() => setRestoreTarget(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to restore <strong className="text-gray-900">{restoreTarget.project_name}</strong> ({restoreTarget.work_order_number}) back to active projects?
              <br />
              All related events, deliverables, and payment logs will be un-archived.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setRestoreTarget(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
              >
                ↺ Restore Work Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {hardDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600 border-b border-gray-100 pb-3">
              <ShieldAlert size={22} />
              <h3 className="text-base font-extrabold text-[#111827]">Permanently Delete Work Order?</h3>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <p className="font-extrabold text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                ⚠️ CRITICAL WARNING: This action will PERMANENTLY purge Work Order {hardDeleteTarget.work_order_number} ({hardDeleteTarget.project_name}) from the database.
              </p>
              <p>This action CANNOT BE UNDONE or restored.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setHardDeleteTarget(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmHardDelete}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer"
              >
                ❌ Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
