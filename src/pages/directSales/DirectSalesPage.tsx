import { useState, useMemo } from 'react'
import {
  ShoppingBag, Plus, Search, RotateCcw, FileText,
  Camera, Mic, IndianRupee, CheckCircle2, AlertCircle, Tag, Eye, Trash2, CreditCard,
} from 'lucide-react'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import {
  getDirectSalesInvoices,
  deleteDirectSalesInvoice,
  recordDirectSalesPayment,
} from '@/services/directSalesStore'
import { DirectSalesPOSModal } from '@/components/directSales/DirectSalesPOSModal'
import { DirectSalesInvoiceModal } from '@/components/directSales/DirectSalesInvoiceModal'
import { DirectSalesCatalogModal } from '@/components/directSales/DirectSalesCatalogModal'
import { DirectSalesReportsModal } from '@/components/directSales/DirectSalesReportsModal'
import type { DirectSalesInvoice, DirectSalesOrderType, DirectSalesPaymentStatus } from '@/types/directSales'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'

export default function DirectSalesPage() {
  const [invoices, setInvoices] = useState<DirectSalesInvoice[]>(() => getDirectSalesInvoices())

  // Modal Open States
  const [isPosOpen, setIsPosOpen] = useState(false)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [isReportsOpen, setIsReportsOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<DirectSalesInvoice | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [orderTypeFilter, setOrderTypeFilter] = useState<DirectSalesOrderType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<DirectSalesPaymentStatus | 'all'>('all')

  // Real-time synchronization
  useRealtimeSync(() => {
    setInvoices(getDirectSalesInvoices())
  })

  const refreshInvoices = () => {
    setInvoices(getDirectSalesInvoices())
  }

  // Summary Metrics
  const stats = useMemo(() => {
    const totalInvoices = invoices.length
    const totalBilled = invoices.reduce((sum, i) => sum + i.total_amount, 0)
    const totalRevenue = invoices.reduce((sum, i) => sum + i.amount_paid, 0)
    const totalOutstanding = invoices.reduce((sum, i) => sum + i.balance_due, 0)
    const totalGst = invoices.reduce((sum, i) => sum + i.gst_amount, 0)

    const exposeRevenue = invoices
      .filter((i) => i.order_type === 'studio_expose')
      .reduce((sum, i) => sum + i.amount_paid, 0)

    const podcastRevenue = invoices
      .filter((i) => i.order_type === 'podcast')
      .reduce((sum, i) => sum + i.amount_paid, 0)

    return {
      totalInvoices,
      totalBilled,
      totalRevenue,
      totalOutstanding,
      totalGst,
      exposeRevenue,
      podcastRevenue,
    }
  }, [invoices])

  // Filtered List
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !search ||
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.customer_name.toLowerCase().includes(q) ||
        (inv.mobile || '').includes(q) ||
        inv.items.some((item) => item.item_name.toLowerCase().includes(q))

      const matchesType = orderTypeFilter === 'all' || inv.order_type === orderTypeFilter
      const matchesStatus = statusFilter === 'all' || inv.payment_status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [invoices, search, orderTypeFilter, statusFilter])

  const handleDelete = (id: string, invNo: string) => {
    if (window.confirm(`Are you sure you want to delete Direct Sales Invoice ${invNo}?`)) {
      const success = deleteDirectSalesInvoice(id)
      if (success) {
        toast.success(`Deleted invoice ${invNo}.`)
        refreshInvoices()
      } else {
        toast.error('Unable to delete invoice.')
      }
    }
  }

  const handleRecordPaymentPrompt = (inv: DirectSalesInvoice) => {
    const rawAmt = window.prompt(`Record Payment for ${inv.invoice_number} (${inv.customer_name})\nBalance Due: ₹${inv.balance_due.toLocaleString()}`, String(inv.balance_due))
    if (!rawAmt) return
    const amt = parseFloat(rawAmt)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Invalid payment amount.')
      return
    }
    const success = recordDirectSalesPayment(inv.id, amt, 'upi')
    if (success) {
      toast.success(`Recorded ₹${amt.toLocaleString()} payment for ${inv.invoice_number}!`)
      refreshInvoices()
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <ShoppingBag size={22} />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-[#111827]">Direct Sales POS Module</h1>
              <p className="text-xs text-gray-500">
                Standalone billing for walk-in Studio Expose & Podcast customers
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCatalogOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Tag size={14} /> Service Catalog
          </button>
          <button
            onClick={() => setIsReportsOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#5B3FD9] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText size={14} /> POS Reports & Ledger
          </button>
          <button
            onClick={() => setIsPosOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center gap-1.5 shadow-md shadow-[#5B3FD9]/20 transition-all cursor-pointer"
          >
            <Plus size={16} /> + New Direct Sales Invoice
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center font-bold">
            <IndianRupee size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">POS Revenue</span>
            <span className="text-lg font-extrabold text-[#111827] font-mono">₹{stats.totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-purple-50 text-[#5B3FD9] flex items-center justify-center font-bold">
            <Camera size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Studio Expose Revenue</span>
            <span className="text-lg font-extrabold text-[#5B3FD9] font-mono">₹{stats.exposeRevenue.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Mic size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Podcast Revenue</span>
            <span className="text-lg font-extrabold text-blue-600 font-mono">₹{stats.podcastRevenue.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">GST Tax Collected</span>
            <span className="text-lg font-extrabold text-emerald-600 font-mono">₹{stats.totalGst.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertCircle size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Outstanding Due</span>
            <span className="text-lg font-extrabold text-red-600 font-mono">₹{stats.totalOutstanding.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoice number, customer name, mobile, item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
          />
        </div>

        {/* Order Type Filter */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-400 text-[10px] uppercase">Vertical</span>
          <select
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value as any)}
            className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-bold focus:outline-none focus:border-[#5B3FD9]"
          >
            <option value="all">All Verticals (Expose & Podcast)</option>
            <option value="studio_expose">Studio Expose Only</option>
            <option value="podcast">Podcast Studio Only</option>
          </select>
        </div>

        {/* Payment Status Filter */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-400 text-[10px] uppercase">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-bold focus:outline-none focus:border-[#5B3FD9]"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Fully Paid</option>
            <option value="partial">Partially Paid</option>
            <option value="pending">Pending Payment</option>
          </select>
        </div>

        {/* Reset */}
        {(search || orderTypeFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={() => {
              setSearch('')
              setOrderTypeFilter('all')
              setStatusFilter('all')
            }}
            className="px-3 h-9 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center gap-1"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {/* Invoices Data Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Order Type</th>
                <th className="px-4 py-3">Customer Details</th>
                <th className="px-4 py-3">Items Billed</th>
                <th className="px-4 py-3 text-right">Grand Total</th>
                <th className="px-4 py-3 text-right">Amount Paid</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-gray-400 italic">
                    No Direct Sales Invoices found matching your search. Click "+ New Direct Sales Invoice" to bill a walk-in customer.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="font-mono font-extrabold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2 py-0.5 rounded text-xs hover:underline cursor-pointer"
                      >
                        {inv.invoice_number}
                      </button>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-gray-500 whitespace-nowrap">
                      {formatDate(inv.created_at)}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                        inv.order_type === 'podcast'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {inv.order_type === 'podcast' ? <Mic size={11} /> : <Camera size={11} />}
                        {inv.order_type === 'podcast' ? 'Podcast' : 'Studio Expose'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-bold text-[#111827]">{inv.customer_name}</p>
                      {inv.mobile && <p className="text-[11px] text-gray-500">{inv.mobile}</p>}
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-bold text-gray-800">{inv.items.length} Service Items</p>
                      <p className="text-[11px] text-gray-400 truncate max-w-[180px]">
                        {inv.items.map((i) => i.item_name).join(', ')}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-extrabold text-[#111827]">
                      ₹{inv.total_amount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                      ₹{inv.amount_paid.toLocaleString()}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-bold text-red-600">
                      ₹{inv.balance_due.toLocaleString()}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase ${
                        inv.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : inv.payment_status === 'partial'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {inv.payment_status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 inline-flex items-center gap-1 cursor-pointer"
                        title="View / Print Invoice"
                      >
                        <Eye size={12} /> Invoice
                      </button>

                      {inv.balance_due > 0 && (
                        <button
                          onClick={() => handleRecordPaymentPrompt(inv)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 cursor-pointer"
                          title="Record Additional Payment"
                        >
                          <CreditCard size={12} /> Pay
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(inv.id, inv.invoice_number)}
                        className="px-2 py-1 text-xs font-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center justify-center cursor-pointer"
                        title="Delete Invoice"
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

      {/* POS Billing Modal */}
      <DirectSalesPOSModal
        isOpen={isPosOpen}
        onClose={() => setIsPosOpen(false)}
        onInvoiceCreated={(newInv) => {
          refreshInvoices()
          setSelectedInvoice(newInv)
        }}
      />

      {/* Invoice Viewer Modal */}
      <DirectSalesInvoiceModal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />

      {/* Catalog Management Modal */}
      <DirectSalesCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
      />

      {/* Reports Engine Modal */}
      <DirectSalesReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
      />
    </div>
  )
}
