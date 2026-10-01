import { useState } from 'react'
import { X, Plus, Pencil, Copy, Tag, Trash2, Camera, Mic } from 'lucide-react'
import {
  getDirectSalesCatalog,
  duplicateCatalogItem,
  deleteCatalogItem,
  toggleCatalogItemStatus,
} from '@/services/directSalesStore'
import { AddServiceDialog } from '@/components/directSales/AddServiceDialog'
import type { DirectSalesCatalogItem, DirectSalesOrderType } from '@/types/directSales'
import { toast } from 'react-hot-toast'

interface DirectSalesCatalogModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DirectSalesCatalogModal({ isOpen, onClose }: DirectSalesCatalogModalProps) {
  const [activeType, setActiveType] = useState<DirectSalesOrderType>('studio_expose')
  const [catalog, setCatalog] = useState<DirectSalesCatalogItem[]>(() => getDirectSalesCatalog())

  // Add / Edit Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingService, setEditingService] = useState<DirectSalesCatalogItem | null>(null)

  if (!isOpen) return null

  const refreshCatalog = () => {
    setCatalog(getDirectSalesCatalog())
  }

  const filteredItems = catalog.filter((i) => i.order_type === activeType)

  const handleToggleActive = (item: DirectSalesCatalogItem) => {
    toggleCatalogItemStatus(item.id, !item.is_active)
    refreshCatalog()
    toast.success(`${item.item_name} is now ${!item.is_active ? 'active' : 'disabled'}.`)
  }

  const handleDuplicate = (item: DirectSalesCatalogItem) => {
    const dup = duplicateCatalogItem(item.id)
    if (dup) {
      toast.success(`Duplicated "${item.item_name}" as "${dup.item_name}"!`)
      refreshCatalog()
    }
  }

  const handleDelete = (item: DirectSalesCatalogItem) => {
    if (window.confirm(`Are you sure you want to delete service "${item.item_name}"?`)) {
      const res = deleteCatalogItem(item.id)
      if (res.isUsedInInvoice) {
        toast.error(`"${item.item_name}" has been used in existing invoices and cannot be deleted. You can deactivate it instead.`, { duration: 5000 })
        return
      }
      if (res.success) {
        refreshCatalog()
        toast.success(`Deleted "${item.item_name}".`)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <Tag size={20} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#111827]">Direct Sales Catalog Management</h2>
              <p className="text-xs text-gray-500">Configure prices, units, GST rates, and active services</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Vertical Selector & Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Order Type Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveType('studio_expose')}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                  activeType === 'studio_expose'
                    ? 'bg-[#5B3FD9] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Camera size={14} /> Studio Expose ({catalog.filter((c) => c.order_type === 'studio_expose').length})
              </button>

              <button
                type="button"
                onClick={() => setActiveType('podcast')}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                  activeType === 'podcast'
                    ? 'bg-[#5B3FD9] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Mic size={14} /> Podcast Studio ({catalog.filter((c) => c.order_type === 'podcast').length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingService(null)
                setIsAddOpen(true)
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Plus size={14} /> Add New Catalog Service
            </button>
          </div>

          {/* Catalog Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                  <th className="px-4 py-2.5">Service Name & Description</th>
                  <th className="px-4 py-2.5">Unit</th>
                  <th className="px-4 py-2.5 text-right">Default Price</th>
                  <th className="px-4 py-2.5 text-center">GST %</th>
                  <th className="px-4 py-2.5 text-center">Tax Type</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400 italic">
                      No services found under {activeType === 'podcast' ? 'Podcast' : 'Studio Expose'}. Click "+ Add New Catalog Service" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-extrabold text-[#111827]">{item.item_name}</p>
                        {item.description && <p className="text-[11px] text-gray-400 mt-0.5">{item.description}</p>}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-700">{item.unit || 'Per Service'}</td>
                      <td className="px-4 py-3 text-right font-mono font-extrabold text-[#111827]">
                        ₹{item.unit_price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-gray-600">{item.default_gst_percent}%</td>
                      <td className="px-4 py-3 text-center font-bold text-purple-700">
                        {item.is_gst_included ? 'Inclusive' : 'Exclusive'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] cursor-pointer ${
                            item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {item.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingService(item)
                            setIsAddOpen(true)
                          }}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(item)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                          title="Duplicate Service"
                        >
                          <Copy size={12} /> Duplicate
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="px-2 py-1 text-xs font-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Service Dialog */}
      <AddServiceDialog
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false)
          setEditingService(null)
        }}
        initialService={editingService}
        defaultCategory={activeType}
        onServiceSaved={() => refreshCatalog()}
      />
    </div>
  )
}
