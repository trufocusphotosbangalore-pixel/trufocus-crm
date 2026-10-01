import { useState, useMemo } from 'react'
import { Plus, Search, Tag, Pencil, Copy, Trash2, Camera, Mic } from 'lucide-react'
import {
  getDirectSalesCatalog,
  duplicateCatalogItem,
  deleteCatalogItem,
  toggleCatalogItemStatus,
} from '@/services/directSalesStore'
import { AddServiceDialog } from '@/components/directSales/AddServiceDialog'
import type { DirectSalesCatalogItem, DirectSalesOrderType } from '@/types/directSales'
import { toast } from 'react-hot-toast'

export function ServiceCatalogTab() {
  const [catalog, setCatalog] = useState<DirectSalesCatalogItem[]>(() => getDirectSalesCatalog())
  const [activeTab, setActiveTab] = useState<DirectSalesOrderType>('studio_expose')
  const [search, setSearch] = useState('')

  // Add / Edit Dialog state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingService, setEditingService] = useState<DirectSalesCatalogItem | null>(null)

  const refreshCatalog = () => {
    setCatalog(getDirectSalesCatalog())
  }

  const filteredServices = useMemo(() => {
    return catalog.filter((item) => {
      if (item.order_type !== activeTab) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        item.item_name.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.unit || '').toLowerCase().includes(q)
      )
    })
  }, [catalog, activeTab, search])

  const handleDuplicate = (item: DirectSalesCatalogItem) => {
    const dup = duplicateCatalogItem(item.id)
    if (dup) {
      toast.success(`Duplicated "${item.item_name}" as "${dup.item_name}"!`)
      refreshCatalog()
    }
  }

  const handleDelete = (item: DirectSalesCatalogItem) => {
    if (window.confirm(`Are you sure you want to delete service "${item.item_name}" from the catalog?`)) {
      const res = deleteCatalogItem(item.id)
      if (res.isUsedInInvoice) {
        toast.error(`"${item.item_name}" has been used in existing invoices and cannot be deleted. You can deactivate it instead.`, { duration: 5000 })
        return
      }
      if (res.success) {
        toast.success(`Deleted "${item.item_name}".`)
        refreshCatalog()
      }
    }
  }

  const handleToggleActive = (item: DirectSalesCatalogItem) => {
    toggleCatalogItemStatus(item.id, !item.is_active)
    toast.success(`Service "${item.item_name}" is now ${!item.is_active ? 'active' : 'disabled'}.`)
    refreshCatalog()
  }

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
            <Tag size={22} />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-[#111827]">Direct Sales Service Catalog</h2>
            <p className="text-xs text-gray-500">Configure reusable services, default prices, units, and GST rates</p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingService(null)
            setIsAddOpen(true)
          }}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-md shadow-[#5B3FD9]/20 transition-all cursor-pointer"
        >
          <Plus size={16} /> + Add New Service
        </button>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Order Type Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('studio_expose')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'studio_expose'
                ? 'bg-[#5B3FD9] text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Camera size={14} /> Studio Expose Services ({catalog.filter((c) => c.order_type === 'studio_expose').length})
          </button>

          <button
            onClick={() => setActiveTab('podcast')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'podcast'
                ? 'bg-[#5B3FD9] text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Mic size={14} /> Podcast Studio Services ({catalog.filter((c) => c.order_type === 'podcast').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search catalog services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
          />
        </div>
      </div>

      {/* Services Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                <th className="px-4 py-3">Service Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Billing Unit</th>
                <th className="px-4 py-3 text-right">Default Price</th>
                <th className="px-4 py-3 text-center">GST %</th>
                <th className="px-4 py-3 text-center">Tax Type</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 italic">
                    No catalog services found under {activeTab === 'podcast' ? 'Podcast' : 'Studio Expose'}. Click "+ Add New Service" to create a reusable service.
                  </td>
                </tr>
              ) : (
                filteredServices.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-extrabold text-[#111827]">{item.item_name}</p>
                    </td>

                    <td className="px-4 py-3.5 text-gray-500 max-w-[220px] truncate">
                      {item.description || '—'}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-gray-700">
                      {item.unit || 'Per Service'}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-extrabold text-[#111827]">
                      ₹{item.unit_price.toLocaleString()}
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono font-bold text-gray-600">
                      {item.default_gst_percent}%
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        item.is_gst_included ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.is_gst_included ? 'Inclusive' : 'Exclusive'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] cursor-pointer ${
                          item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {item.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
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
                        title="Delete Service"
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

      {/* Add / Edit Service Dialog */}
      <AddServiceDialog
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false)
          setEditingService(null)
        }}
        initialService={editingService}
        defaultCategory={activeTab}
        onServiceSaved={() => refreshCatalog()}
      />
    </div>
  )
}
