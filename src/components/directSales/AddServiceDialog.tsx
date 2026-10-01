import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { saveCatalogItem } from '@/services/directSalesStore'
import type { DirectSalesCatalogItem, DirectSalesOrderType } from '@/types/directSales'
import { toast } from 'react-hot-toast'

interface AddServiceDialogProps {
  isOpen: boolean
  onClose: () => void
  initialService?: Partial<DirectSalesCatalogItem> | null
  onServiceSaved?: (service: DirectSalesCatalogItem) => void
  defaultCategory?: DirectSalesOrderType
}

export function AddServiceDialog({
  isOpen,
  onClose,
  initialService,
  onServiceSaved,
  defaultCategory = 'studio_expose',
}: AddServiceDialogProps) {
  const [serviceName, setServiceName] = useState(initialService?.item_name || '')
  const [orderType, setOrderType] = useState<DirectSalesOrderType>(
    initialService?.order_type || defaultCategory
  )
  const [description, setDescription] = useState(initialService?.description || '')
  const [unit, setUnit] = useState(initialService?.unit || 'Per Hour')
  const [unitPrice, setUnitPrice] = useState<number>(initialService?.unit_price || 1000)
  const [gstPercent, setGstPercent] = useState<number>(initialService?.default_gst_percent ?? 18)
  const [isGstIncluded, setIsGstIncluded] = useState<boolean>(
    initialService?.is_gst_included ?? true
  )
  const [isActive, setIsActive] = useState<boolean>(initialService?.is_active ?? true)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!serviceName.trim()) {
      toast.error('Please enter service name.')
      return
    }

    if (unitPrice < 0) {
      toast.error('Please enter a valid price.')
      return
    }

    const saved = saveCatalogItem({
      id: initialService?.id,
      item_name: serviceName.trim(),
      order_type: orderType,
      category_name: orderType === 'podcast' ? 'Podcast Services' : 'Studio Expose Services',
      description: description.trim() || undefined,
      unit: unit.trim() || 'Per Service',
      unit_price: unitPrice,
      default_gst_percent: gstPercent,
      is_gst_included: isGstIncluded,
      is_active: isActive,
    })

    toast.success(`Saved service "${saved.item_name}" to catalog!`)
    if (onServiceSaved) onServiceSaved(saved)
    onClose()
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-mono font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2.5 py-1 rounded-md text-xs">
              SERVICE CATALOG CONFIGURATOR
            </span>
            <h1 className="ui-page-title text-[32px] font-extrabold text-[#111827]">
              {initialService?.id ? 'Edit Service Catalog Item' : 'Add New Reusable Service'}
            </h1>
            <p className="ui-small-label text-[13px] text-gray-500 mt-1">Configure pricing, GST application, and unit details for Studio Expose & Podcast services.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="ui-button-text text-[15px] px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-2 cursor-pointer font-bold"
            >
              Cancel & Return
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="ui-button-text text-[15px] px-6 py-2.5 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 cursor-pointer font-extrabold"
            >
              <Check size={18} /> Save Service to Catalog
            </button>
          </div>
        </div>
      </div>

      {/* Form Body Container */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          {/* Service Name */}
          <div>
            <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">Service Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Studio Rental (Hourly) or Video Editing"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          {/* Category Switcher */}
          <div>
            <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">Service Category / Vertical *</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as DirectSalesOrderType)}
              className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
            >
              <option value="studio_expose">Studio Expose (Rentals, Portraits, Prints, Frames)</option>
              <option value="podcast">Podcast Studio (Recording, Multi-Cam, Shorts, Edits)</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">Service Description</label>
            <textarea
              rows={3}
              placeholder="Detailed service scope or specs..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 bg-white font-medium text-gray-800 focus:outline-none focus:border-[#5B3FD9]"
            />
          </div>

          {/* Unit & Default Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">Unit / Billing Basis</label>
              <input
                type="text"
                placeholder="e.g. Per Hour, Per Event, Set of 16"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">Default Unit Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-white font-mono font-extrabold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>
          </div>

          {/* GST % & Inclusive / Exclusive Toggle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div>
              <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">Default GST Rate (%)</label>
              <select
                value={gstPercent}
                onChange={(e) => setGstPercent(parseInt(e.target.value) || 0)}
                className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              >
                <option value={0}>0% (Tax Exempt)</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST (Standard)</option>
                <option value={28}>28% GST</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1.5 ui-table-header">GST Tax Type</label>
              <select
                value={isGstIncluded ? 'inclusive' : 'exclusive'}
                onChange={(e) => setIsGstIncluded(e.target.value === 'inclusive')}
                className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
              >
                <option value="inclusive">GST Included in Price</option>
                <option value="exclusive">GST Added Extra (Exclusive)</option>
              </select>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between pt-2">
            <span className="font-bold text-gray-700 ui-table-header">Catalog Service Status</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-5 accent-[#5B3FD9]"
              />
              <span className={`font-bold text-sm ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                {isActive ? 'Active (Selectable in POS)' : 'Inactive (Disabled)'}
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-6 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="ui-button-text min-h-[44px] px-5 py-2.5 text-[15px] font-extrabold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ui-button-text min-h-[44px] px-6 py-2.5 text-[15px] font-extrabold rounded-xl bg-[#5B3FD9] text-white flex items-center gap-2 shadow-md shadow-[#5B3FD9]/20 cursor-pointer"
            >
              <Check size={18} /> Save Service to Catalog
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
