import { supabase } from '@/services/supabase/client'
import { broadcastPaymentSync } from '@/hooks/useRealtimeSync'
import { recordCustomerPayment, logFinancialAudit } from '@/services/financeStore'
import { canUserPerformDelete } from '@/services/permissionService'
import { logAIPermissionAudit } from '@/services/aiPermissionService'
import type {
  DirectSalesInvoice,
  DirectSalesCatalogItem,
  DirectSalesOrderType,
  DirectSalesPaymentMode,
  DirectSalesPaymentStatus,
  DirectSalesSplitPayment,
  DirectSalesLineItem,
} from '@/types/directSales'

const DIRECT_SALES_INVOICES_KEY = 'trufocus_crm_direct_sales_invoices_v1'
const DIRECT_SALES_CATALOG_KEY = 'trufocus_crm_direct_sales_catalog_v1'

// ─── Default Pre-populated Catalog ────────────────────────────────────────────

export const DEFAULT_DIRECT_SALES_CATALOG: DirectSalesCatalogItem[] = []

// ─── Catalog Getters & Setters ────────────────────────────────────────────────

export function getDirectSalesCatalog(): DirectSalesCatalogItem[] {
  try {
    const raw = localStorage.getItem(DIRECT_SALES_CATALOG_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error(e)
  }
  return []
}

export function saveDirectSalesCatalog(catalog: DirectSalesCatalogItem[]): void {
  try {
    localStorage.setItem(DIRECT_SALES_CATALOG_KEY, JSON.stringify(catalog))
    supabase.from('direct_sales_catalog').upsert({ id: 'main', data: catalog, updated_at: new Date().toISOString() }).then(() => {})
  } catch (e) {
    console.error(e)
  }
}

export function saveCatalogItem(item: Partial<DirectSalesCatalogItem>): DirectSalesCatalogItem {
  const current = getDirectSalesCatalog()
  let updatedItem: DirectSalesCatalogItem
  const now = new Date().toISOString()

  if (item.id) {
    const idx = current.findIndex((i) => i.id === item.id)
    if (idx !== -1) {
      updatedItem = { ...current[idx], ...item, updated_at: now }
      current[idx] = updatedItem
    } else {
      updatedItem = {
        id: item.id,
        order_type: item.order_type || 'studio_expose',
        category_name: item.category_name || (item.order_type === 'podcast' ? 'Podcast' : 'Studio Expose'),
        item_name: item.item_name || 'New Service',
        unit: item.unit || 'Per Service',
        unit_price: item.unit_price || 1000,
        default_gst_percent: item.default_gst_percent ?? 18,
        is_gst_included: item.is_gst_included ?? true,
        description: item.description || '',
        is_active: item.is_active ?? true,
        created_at: now,
        updated_at: now,
      }
      current.push(updatedItem)
    }
  } else {
    updatedItem = {
      id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order_type: item.order_type || 'studio_expose',
      category_name: item.category_name || (item.order_type === 'podcast' ? 'Podcast' : 'Studio Expose'),
      item_name: item.item_name || 'New Service',
      unit: item.unit || 'Per Service',
      unit_price: item.unit_price || 1000,
      default_gst_percent: item.default_gst_percent ?? 18,
      is_gst_included: item.is_gst_included ?? true,
      description: item.description || '',
      is_active: item.is_active ?? true,
      created_at: now,
      updated_at: now,
    }
    current.push(updatedItem)
  }

  saveDirectSalesCatalog(current)
  return updatedItem
}

export function isServiceUsedInInvoices(serviceId: string, serviceName?: string): boolean {
  const invoices = getDirectSalesInvoices()
  return invoices.some((inv) =>
    inv.items.some(
      (item) =>
        (item.catalog_item_id && item.catalog_item_id === serviceId) ||
        (serviceName && item.item_name.toLowerCase().trim() === serviceName.toLowerCase().trim())
    )
  )
}

export function duplicateCatalogItem(serviceId: string): DirectSalesCatalogItem | null {
  const current = getDirectSalesCatalog()
  const target = current.find((i) => i.id === serviceId)
  if (!target) return null

  const now = new Date().toISOString()
  const duplicated: DirectSalesCatalogItem = {
    ...target,
    id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    item_name: `${target.item_name} (Copy)`,
    created_at: now,
    updated_at: now,
  }

  saveDirectSalesCatalog([duplicated, ...current])
  return duplicated
}

export function deleteCatalogItem(id: string): { success: boolean; isUsedInInvoice?: boolean } {
  const current = getDirectSalesCatalog()
  const target = current.find((item) => item.id === id)

  if (target && isServiceUsedInInvoices(target.id, target.item_name)) {
    return { success: false, isUsedInInvoice: true }
  }

  const filtered = current.filter((item) => item.id !== id)
  saveDirectSalesCatalog(filtered)
  return { success: true }
}

export function toggleCatalogItemStatus(id: string, isActive: boolean): boolean {
  const current = getDirectSalesCatalog()
  const idx = current.findIndex((item) => item.id === id)
  if (idx === -1) return false
  current[idx].is_active = isActive
  current[idx].updated_at = new Date().toISOString()
  saveDirectSalesCatalog(current)
  return true
}

// ─── Invoice Getters & Setters ────────────────────────────────────────────────

export function getDirectSalesInvoices(): DirectSalesInvoice[] {
  let list: DirectSalesInvoice[] = []
  try {
    const raw = localStorage.getItem(DIRECT_SALES_INVOICES_KEY)
    if (raw) list = JSON.parse(raw)
  } catch (e) {
    console.error(e)
  }

  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function saveDirectSalesInvoices(invoices: DirectSalesInvoice[]): void {
  try {
    localStorage.setItem(DIRECT_SALES_INVOICES_KEY, JSON.stringify(invoices))
    supabase.from('direct_sales_invoices').upsert({ id: 'main', data: invoices, updated_at: new Date().toISOString() }).then(() => {})
    broadcastPaymentSync()
  } catch (e) {
    console.error(e)
  }
}

// ─── POS Invoice Creation ─────────────────────────────────────────────────────

export function createDirectSalesInvoice(data: {
  order_type: DirectSalesOrderType
  customer_name: string
  mobile?: string
  email?: string
  gst_number?: string
  address?: string
  items: DirectSalesLineItem[]
  is_gst_included?: boolean
  payment_mode: DirectSalesPaymentMode
  amount_paid: number
  payment_splits?: DirectSalesSplitPayment[]
  notes?: string
  created_by?: string
}): DirectSalesInvoice {
  const currentInvoices = getDirectSalesInvoices()
  const nextSeq = currentInvoices.length + 101
  const invoiceNumber = `INV-DS-2026-${String(nextSeq).padStart(4, '0')}`

  const isGstInc = data.is_gst_included ?? true

  // Compute Invoice Totals
  let subtotalAmount = 0
  let totalDiscount = 0
  let totalGst = 0
  let grandTotal = 0

  const processedItems = data.items.map((item, idx) => {
    const q = item.quantity || 1
    const price = item.unit_price || 0
    const disc = item.discount_amount || 0
    const gstRate = item.gst_percent ?? 18

    const lineSubtotal = Math.max(0, q * price - disc)
    let lineGst = 0
    let lineTotal = lineSubtotal

    if (isGstInc) {
      lineGst = Math.round(lineSubtotal - (lineSubtotal / (1 + gstRate / 100)))
      lineTotal = lineSubtotal
    } else {
      lineGst = Math.round(lineSubtotal * (gstRate / 100))
      lineTotal = lineSubtotal + lineGst
    }

    subtotalAmount += lineSubtotal
    totalDiscount += disc
    totalGst += lineGst
    grandTotal += lineTotal

    return {
      ...item,
      id: item.id || `ds-item-${Date.now()}-${idx}`,
      quantity: q,
      unit_price: price,
      discount_amount: disc,
      gst_percent: gstRate,
      is_gst_included: isGstInc,
      subtotal: lineSubtotal,
      gst_amount: lineGst,
      total_amount: lineTotal,
    }
  })

  const amountPaid = Math.min(grandTotal, Math.max(0, data.amount_paid || 0))
  const balanceDue = Math.max(0, grandTotal - amountPaid)

  let paymentStatus: DirectSalesPaymentStatus = 'pending'
  if (amountPaid >= grandTotal && grandTotal > 0) {
    paymentStatus = 'paid'
  } else if (amountPaid > 0) {
    paymentStatus = 'partial'
  }

  const newInvoice: DirectSalesInvoice = {
    id: `ds-inv-${Date.now()}`,
    invoice_number: invoiceNumber,
    order_type: data.order_type,
    customer_name: data.customer_name,
    mobile: data.mobile,
    email: data.email,
    gst_number: data.gst_number,
    address: data.address,
    items: processedItems,
    subtotal_amount: subtotalAmount,
    discount_amount: totalDiscount,
    gst_amount: totalGst,
    is_gst_included: isGstInc,
    total_amount: grandTotal,
    amount_paid: amountPaid,
    balance_due: balanceDue,
    payment_status: paymentStatus,
    payment_mode: data.payment_mode,
    payment_splits: data.payment_splits,
    notes: data.notes,
    created_by: data.created_by || 'Studio POS Admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  saveDirectSalesInvoices([newInvoice, ...currentInvoices])

  // SINGLE SOURCE OF TRUTH: Automatically post payment receipt to canonical FinanceService
  if (amountPaid > 0) {
    recordCustomerPayment({
      work_order_id: newInvoice.id,
      work_order_number: newInvoice.invoice_number,
      customer_name: newInvoice.customer_name,
      amount: amountPaid,
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: (data.payment_mode === 'mixed' ? 'upi' : data.payment_mode) as any,
      transaction_ref: `POS-${newInvoice.invoice_number}`,
      received_by: newInvoice.created_by,
      remarks: `Direct Sales Invoice (${data.order_type === 'podcast' ? 'Podcast' : 'Studio Expose'})`,
    })
  }

  logFinancialAudit(
    'Direct Sales Invoice Created',
    newInvoice.id,
    `Created ${newInvoice.order_type} invoice ${newInvoice.invoice_number} for ${newInvoice.customer_name}. Total ₹${grandTotal.toLocaleString()}, Paid ₹${amountPaid.toLocaleString()}`,
    newInvoice.invoice_number,
    newInvoice.created_by
  )

  return newInvoice
}

export function recordDirectSalesPayment(invoiceId: string, amount: number, paymentMode: DirectSalesPaymentMode): boolean {
  const currentInvoices = getDirectSalesInvoices()
  const idx = currentInvoices.findIndex((inv) => inv.id === invoiceId)
  if (idx === -1) return false

  const inv = currentInvoices[idx]
  const newAmountPaid = inv.amount_paid + amount
  const newBalance = Math.max(0, inv.total_amount - newAmountPaid)
  const newStatus: DirectSalesPaymentStatus = newAmountPaid >= inv.total_amount ? 'paid' : 'partial'

  currentInvoices[idx] = {
    ...inv,
    amount_paid: newAmountPaid,
    balance_due: newBalance,
    payment_status: newStatus,
    updated_at: new Date().toISOString(),
  }

  saveDirectSalesInvoices(currentInvoices)

  recordCustomerPayment({
    work_order_id: inv.id,
    work_order_number: inv.invoice_number,
    customer_name: inv.customer_name,
    amount,
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: (paymentMode === 'mixed' ? 'upi' : paymentMode) as any,
    transaction_ref: `POS-PAY-${inv.invoice_number}`,
    received_by: 'Studio POS Admin',
    remarks: `Additional payment for Direct Sales ${inv.invoice_number}`,
  })

  return true
}

export function deleteDirectSalesInvoice(id: string, actor = 'Administrator'): boolean {
  if (!canUserPerformDelete('finances')) {
    logAIPermissionAudit({
      user_id: 'usr-security',
      user_name: actor,
      role: 'Restricted',
      module: 'finances',
      requested_action: 'delete',
      prompt_text: `Attempted delete direct sales invoice ${id}`,
      allowed: false,
      reason: 'Permission Denied: Only Owner/Admin can delete invoices.',
    })
    return false
  }

  const current = getDirectSalesInvoices()
  const filtered = current.filter((inv) => inv.id !== id)
  saveDirectSalesInvoices(filtered)
  return true
}
