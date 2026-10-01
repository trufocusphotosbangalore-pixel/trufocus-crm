import { useState, useMemo } from 'react'
import { X, Search, Plus, Tag, Pencil, Copy, Trash2, Power, Check } from 'lucide-react'
import {
  getDirectSalesCatalog,
  duplicateCatalogItem,
  deleteCatalogItem,
  toggleCatalogItemStatus,
} from '@/services/directSalesStore'
import { AddServiceDialog } from '@/components/directSales/AddServiceDialog'
import type { DirectSalesCatalogItem, DirectSalesOrderType, DirectSalesLineItem } from '@/types/directSales'
import { toast } from 'react-hot-toast'

interface DirectSalesServicePickerModalProps {
  isOpen: boolean
  onClose: () => void
  orderType: DirectSalesOrderType
  isGstIncluded: boolean
  onServiceSelect: (lineItem: DirectSalesLineItem) => void
}

export function DirectSalesServicePickerModal({
  isOpen,
  onClose,
  orderType,
  isGstIncluded,
  onServiceSelect,
}: DirectSalesServicePickerModalProps) {
  const [search, setSearch] = useState('')
  const [catalogState, setCatalogState] = useState<DirectSalesCatalogItem[]>(() => getDirectSalesCatalog())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<DirectSalesCatalogItem | null>(null)

  const refreshCatalog = () => {
    setCatalogState(getDirectSalesCatalog())
  }

  const activeServices = useMemo(() => {
    return catalogState.filter((item) => {
      if (item.order_type !== orderType) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        item.item_name.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.category_name || '').toLowerCase().includes(q)
      )
    })
  }, [catalogState, orderType, search])

  if (!isOpen) return null

  const handleSelectCatalogItem = (item: DirectSalesCatalogItem) => {
    if (!item.is_active) {
      toast.error('This service is currently disabled. Please activate it first.')
      return
    }

    const q = 1
    const price = item.unit_price
    const gstRate = item.default_gst_percent
    const isInc = item.is_gst_included ?? isGstIncluded

    const lineSubtotal = Math.max(0, q * price)
    let lineGst = 0
    let lineTotal = lineSubtotal

    if (isInc) {
      lineGst = Math.round(lineSubtotal - lineSubtotal / (1 + gstRate / 100))
      lineTotal = lineSubtotal
    } else {
      lineGst = Math.round(lineSubtotal * (gstRate / 100))
      lineTotal = lineSubtotal + lineGst
    }

    const lineItem: DirectSalesLineItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      catalog_item_id: item.id,
      item_name: item.item_name,
      category_name: item.category_name,
      quantity: q,
      unit_price: price,
      discount_amount: 0,
      gst_percent: gstRate,
      is_gst_included: isInc,
      subtotal: lineSubtotal,
      gst_amount: lineGst,
      total_amount: lineTotal,
    }

    onServiceSelect(lineItem)
    onClose()
  }

  const handleDuplicate = (item: DirectSalesCatalogItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const dup = duplicateCatalogItem(item.id)
    if (dup) {
      toast.success(`Duplicated "${item.item_name}" as "${dup.item_name}"!`)
      refreshCatalog()
    }
  }

  const handleToggleStatus = (item: DirectSalesCatalogItem, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleCatalogItemStatus(item.id, !item.is_active)
    toast.success(`"${item.item_name}" is now ${!item.is_active ? 'active' : 'disabled'}.`)
    refreshCatalog()
  }

  const handleDelete = (item: DirectSalesCatalogItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const res = deleteCatalogItem(item.id)
    if (res.isUsedInInvoice) {
      toast.error(
        `"${item.item_name}" is used in existing invoices and cannot be deleted. Deactivate it instead.`,
        { duration: 4000 }
      )
      return
    }

    if (res.success) {
      toast.success(`Deleted service "${item.item_name}".`)
      refreshCatalog()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <Tag size={18} />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-[#111827]">
                Select Service for {orderType === 'podcast' ? 'Podcast' : 'Studio Expose'} Bill
              </h3>
              <p className="text-xs text-gray-500">Search, edit, duplicate, or add a reusable catalog service</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 bg-gray-50/60 border-b border-gray-200 shrink-0 flex items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search Existing Services in Catalog..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-300 bg-white font-medium text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              autoFocus
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingService(null)
              setIsAddDialogOpen(true)
            }}
            className="px-3.5 h-9 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus size={14} /> + Add New Service
          </button>
        </div>

        {/* Scrollable Services List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2 text-xs bg-white">
          {activeServices.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-gray-400 italic">
                {search
                  ? `No services found matching "${search}".`
                  : `No catalog services exist for ${orderType === 'podcast' ? 'Podcast' : 'Studio Expose'} yet.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingService(null)
                  setIsAddDialogOpen(true)
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-50 text-[#5B3FD9] border border-purple-200 inline-flex items-center gap-1.5 hover:bg-purple-100 transition-colors"
              >
                <Plus size={14} /> + Add New Service to Catalog
              </button>
            </div>
          ) : (
            activeServices.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectCatalogItem(item)}
                className={`p-3.5 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 cursor-pointer group ${
                  item.is_active
                    ? 'border-gray-200 hover:border-[#5B3FD9] hover:bg-purple-50/50'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[#111827] group-hover:text-[#5B3FD9]">
                      {item.item_name}
                    </span>
                    {item.unit && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold text-[10px]">
                        {item.unit}
                      </span>
                    )}
                    {!item.is_active && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-bold text-[10px]">
                        Disabled
                      </span>
                    )}
                  </div>
                  {item.description && <p className="text-[11px] text-gray-500 mt-0.5">{item.description}</p>}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right font-sans">
                    <span className="font-mono font-extrabold text-sm text-[#111827] block">
                      ₹{item.unit_price.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-purple-700 font-bold">
                      {item.default_gst_percent}% GST ({item.is_gst_included ? 'Inclusive' : 'Exclusive'})
                    </span>
                  </div>

                  {/* Card Inline Action Bar */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
                    <button
                      type="button"
                      title="Edit Service"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingService(item)
                        setIsAddDialogOpen(true)
                      }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-[#5B3FD9] hover:bg-purple-50 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      type="button"
                      title="Duplicate Service"
                      onClick={(e) => handleDuplicate(item, e)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Copy size={13} />
                    </button>

                    <button
                      type="button"
                      title={item.is_active ? 'Deactivate Service' : 'Activate Service'}
                      onClick={(e) => handleToggleStatus(item, e)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        item.is_active
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-gray-400 hover:text-emerald-600 hover:bg-gray-100'
                      }`}
                    >
                      <Power size={13} />
                    </button>

                    <button
                      type="button"
                      title="Delete Service"
                      onClick={(e) => handleDelete(item, e)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>

                    <button
                      type="button"
                      title="Select and Add to Invoice"
                      onClick={() => handleSelectCatalogItem(item)}
                      className="px-2.5 py-1 rounded-lg bg-[#5B3FD9] text-white font-bold text-xs flex items-center gap-1 shadow-2xs hover:bg-[#4C34C3] transition-colors"
                    >
                      <Check size={12} /> Select
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add / Edit Service Dialog */}
      <AddServiceDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false)
          setEditingService(null)
        }}
        initialService={editingService}
        defaultCategory={orderType}
        onServiceSaved={() => refreshCatalog()}
      />
    </div>
  )
}
