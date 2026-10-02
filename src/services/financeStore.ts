import { broadcastPaymentSync } from '@/hooks/useRealtimeSync'
import { pushEntityToCloud } from '@/services/cloudSyncService'
import { canUserPerformDelete } from '@/services/permissionService'
import { logAIPermissionAudit } from '@/services/aiPermissionService'
import { getLocalWorkOrders, saveLocalWorkOrders } from '@/services/supabase/workOrders'
import { filterOutLegacyDemoItems } from '@/utils/legacyDemoPurge'
import type {
  PaymentRecord,
  TeamPayout,
  ProjectExpense,
  CompanyExpense,
  InvoiceRecord,
  WorkOrderFinanceGroup,
  PaymentMode,
  PayoutStatus,
  ProjectExpenseCategory,
  CompanyExpenseCategory,
} from '@/types/finances'

const PAYMENTS_KEY = 'trufocus_crm_payments_v1'
const PAYOUTS_KEY = 'trufocus_crm_team_payouts_v1'
const PROJECT_EXPENSES_KEY = 'trufocus_crm_project_expenses_v1'
const COMPANY_EXPENSES_KEY = 'trufocus_crm_company_expenses_v1'
const INVOICES_KEY = 'trufocus_crm_invoices_v1'

// ─── Default Sample Data ──────────────────────────────────────────────────────

const DEFAULT_PAYMENTS: PaymentRecord[] = []
const DEFAULT_PAYOUTS: TeamPayout[] = []
const DEFAULT_PROJECT_EXPENSES: ProjectExpense[] = []
const DEFAULT_COMPANY_EXPENSES: CompanyExpense[] = []

// ─── Getters & Setters ────────────────────────────────────────────────────────

export function getPayments(): PaymentRecord[] {
  let list: PaymentRecord[] = []
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY)
    if (raw) list = JSON.parse(raw)
    else list = DEFAULT_PAYMENTS
  } catch (e) {
    console.error(e)
    list = DEFAULT_PAYMENTS
  }

  const rawLen = list.length
  list = filterOutLegacyDemoItems(list)
  if (list.length !== rawLen) {
    try {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(list))
    } catch (e) {
      console.error(e)
    }
  }

  const activeWOs = getLocalWorkOrders().filter((w) => !w.deleted_at && w.status !== 'deleted')
  const activeIds = new Set(activeWOs.map((w) => w.id))
  const activeWOnums = new Set(activeWOs.map((w) => w.work_order_number))

  // Track existing payment IDs and transaction refs to avoid duplicates
  const existingIds = new Set(list.map((p) => p.id))
  const existingRefs = new Set(list.map((p) => p.transaction_ref).filter(Boolean))

  let newlyHydrated = false

  activeWOs.forEach((wo) => {
    // 1. Check if Work Order has ledger entries and hydrate them
    const ledger = wo.payment?.ledger || []
    if (ledger.length > 0) {
      ledger.forEach((l, idx) => {
        const itemID = l.id || `pay-${wo.id}-${idx}`
        const itemRef = l.transaction_ref || `RCT-${wo.work_order_number}-${idx + 1}`
        if (!existingIds.has(itemID) && !existingRefs.has(itemRef)) {
          const newRec: PaymentRecord = {
            id: itemID,
            receipt_number: itemRef.startsWith('RCT') || itemRef.startsWith('RCPT') ? itemRef : `RCT-${wo.work_order_number}-${idx + 1}`,
            work_order_id: wo.id,
            work_order_number: wo.work_order_number,
            customer_name: wo.customer_name,
            amount: Number(l.amount) || 0,
            payment_date: l.payment_date || wo.created_at || new Date().toISOString().split('T')[0],
            payment_mode: (l.payment_mode as any) || 'upi',
            transaction_ref: l.transaction_ref || itemRef,
            received_by: l.received_by || 'Studio Accounts',
            remarks: l.notes || 'Payment Received',
            status: 'completed',
            created_at: l.created_at || l.payment_date || new Date().toISOString(),
          }
          list.push(newRec)
          existingIds.add(itemID)
          existingRefs.add(itemRef)
          newlyHydrated = true
        }
      })
    }

    // 2. Reconcile total received amount on Work Order vs total in payments list
    const recAmt = typeof wo.payment?.amount_received === 'number' ? wo.payment.amount_received : (wo.amount_received || 0)
    const woExistingPaymentsSum = list
      .filter((p) => (p.work_order_id === wo.id || p.work_order_number === wo.work_order_number) && p.status === 'completed')
      .reduce((sum, item) => sum + (item.amount || 0), 0)

    if (recAmt > woExistingPaymentsSum) {
      const diffAmount = recAmt - woExistingPaymentsSum
      const synthId = `pay-adv-${wo.id}`
      const synthRef = `RCT-${wo.work_order_number}-ADV`

      if (!existingIds.has(synthId) && !existingRefs.has(synthRef)) {
        const newRec: PaymentRecord = {
          id: synthId,
          receipt_number: synthRef,
          work_order_id: wo.id,
          work_order_number: wo.work_order_number,
          customer_name: wo.customer_name,
          amount: diffAmount,
          payment_date: wo.booking_date || wo.created_at || new Date().toISOString().split('T')[0],
          payment_mode: 'upi',
          transaction_ref: synthRef,
          received_by: 'Studio Accounts',
          remarks: 'Advance Booking Payment',
          status: 'completed',
          created_at: wo.created_at || new Date().toISOString(),
        }
        list.push(newRec)
        existingIds.add(synthId)
        existingRefs.add(synthRef)
        newlyHydrated = true
      }
    }
  })

  if (newlyHydrated) {
    try {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(list))
    } catch (e) {
      console.error(e)
    }
  }

  return list.filter((p) => activeIds.has(p.work_order_id) || activeWOnums.has(p.work_order_number))
}

export function savePayments(payments: PaymentRecord[]): void {
  try {
    const cleanPayments = filterOutLegacyDemoItems(payments)
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(cleanPayments))
    pushEntityToCloud('finance_payments', 'main', cleanPayments)
    broadcastPaymentSync()
  } catch (e) {
    console.error(e)
  }
}

export function getTeamPayouts(): TeamPayout[] {
  let list: TeamPayout[] = []
  try {
    const raw = localStorage.getItem(PAYOUTS_KEY)
    if (raw) list = JSON.parse(raw)
    else list = DEFAULT_PAYOUTS
  } catch (e) {
    console.error(e)
    list = DEFAULT_PAYOUTS
  }

  list = filterOutLegacyDemoItems(list)
  const activeWOs = getLocalWorkOrders().filter((w) => !w.deleted_at && w.status !== 'deleted')
  const activeIds = new Set(activeWOs.map((w) => w.id))
  const activeWOnums = new Set(activeWOs.map((w) => w.work_order_number))

  return list.filter((p) => activeIds.has(p.work_order_id) || activeWOnums.has(p.work_order_number))
}

export function saveTeamPayouts(payouts: TeamPayout[]): void {
  try {
    const clean = filterOutLegacyDemoItems(payouts)
    localStorage.setItem(PAYOUTS_KEY, JSON.stringify(clean))
    broadcastPaymentSync()
  } catch (e) {
    console.error(e)
  }
}

export function getProjectExpenses(): ProjectExpense[] {
  let list: ProjectExpense[] = []
  try {
    const raw = localStorage.getItem(PROJECT_EXPENSES_KEY)
    if (raw) list = JSON.parse(raw)
    else list = DEFAULT_PROJECT_EXPENSES
  } catch (e) {
    console.error(e)
    list = DEFAULT_PROJECT_EXPENSES
  }

  list = filterOutLegacyDemoItems(list)
  const activeWOs = getLocalWorkOrders().filter((w) => !w.deleted_at && w.status !== 'deleted')
  const activeIds = new Set(activeWOs.map((w) => w.id))
  const activeWOnums = new Set(activeWOs.map((w) => w.work_order_number))

  return list.filter((e) => activeIds.has(e.work_order_id) || activeWOnums.has(e.work_order_number))
}

export function saveProjectExpenses(expenses: ProjectExpense[]): void {
  try {
    const clean = filterOutLegacyDemoItems(expenses)
    localStorage.setItem(PROJECT_EXPENSES_KEY, JSON.stringify(clean))
    broadcastPaymentSync()
  } catch (e) {
    console.error(e)
  }
}

export function getCompanyExpenses(): CompanyExpense[] {
  try {
    const raw = localStorage.getItem(COMPANY_EXPENSES_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error(e)
  }
  localStorage.setItem(COMPANY_EXPENSES_KEY, JSON.stringify(DEFAULT_COMPANY_EXPENSES))
  return DEFAULT_COMPANY_EXPENSES
}

export function saveCompanyExpenses(expenses: CompanyExpense[]): void {
  try {
    localStorage.setItem(COMPANY_EXPENSES_KEY, JSON.stringify(expenses))
    broadcastPaymentSync()
  } catch (e) {
    console.error(e)
  }
}

export function getInvoices(): InvoiceRecord[] {
  let list: InvoiceRecord[] = []
  try {
    const raw = localStorage.getItem(INVOICES_KEY)
    if (raw) list = JSON.parse(raw)
  } catch (e) {
    console.error(e)
  }

  list = filterOutLegacyDemoItems(list)
  const activeWOs = getLocalWorkOrders().filter((w) => !w.deleted_at && w.status !== 'deleted')
  const activeIds = new Set(activeWOs.map((w) => w.id))
  const activeWOnums = new Set(activeWOs.map((w) => w.work_order_number))

  return list.filter((i) => activeIds.has(i.work_order_id) || activeWOnums.has(i.work_order_number))
}

export function saveInvoices(invoices: InvoiceRecord[]): void {
  try {
    const clean = filterOutLegacyDemoItems(invoices)
    localStorage.setItem(INVOICES_KEY, JSON.stringify(clean))
    broadcastPaymentSync()
  } catch (e) {
    console.error(e)
  }
}

// ─── Work Order Finance Groups Calculation ───────────────────────────────────

export function getWorkOrderFinanceGroups(): WorkOrderFinanceGroup[] {
  const workOrders = getLocalWorkOrders().filter((wo) => !wo.deleted_at && wo.status !== 'deleted')
  const allPayments = getPayments()
  const allPayouts = getTeamPayouts()
  const allProjectExpenses = getProjectExpenses()

  return workOrders.map((wo) => {
    // SINGLE SOURCE OF TRUTH: Only read from canonical allPayments ledger
    const woPayments = allPayments.filter(
      (p) => (p.work_order_id === wo.id || p.work_order_number === wo.work_order_number) && p.status === 'completed'
    )

    const woPayouts = allPayouts.filter((p) => p.work_order_id === wo.id || p.work_order_number === wo.work_order_number)
    const woExpenses = allProjectExpenses.filter((e) => e.work_order_id === wo.id || e.work_order_number === wo.work_order_number)

    const packageAmount = typeof wo.payment?.package_amount === 'number' ? wo.payment.package_amount : (typeof wo.package_total === 'number' ? wo.package_total : 0)
    const gstAmount = wo.payment?.gst_amount || 0
    const discountAmount = wo.payment?.discount_amount || 0
    const netAmount = wo.payment?.net_amount || (packageAmount + gstAmount - discountAmount)

    const amountReceived = woPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const balanceAmount = Math.max(0, netAmount - amountReceived)
    const paymentPercentage = netAmount > 0 ? Math.min(100, Math.round((amountReceived / netAmount) * 100)) : 0

    const sortedPayments = [...woPayments].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
    const lastPaymentDate = sortedPayments.length > 0 ? sortedPayments[0].payment_date : null

    const totalPayouts = woPayouts.reduce((sum, p) => sum + p.amount, 0)
    const totalExpenses = woExpenses.reduce((sum, e) => sum + e.amount, 0)

    const grossProfit = netAmount - totalPayouts
    const netProfit = netAmount - (totalPayouts + totalExpenses)
    const profitMarginPercent = netAmount > 0 ? Math.round((netProfit / netAmount) * 100) : 0

    return {
      work_order_id: wo.id,
      work_order_number: wo.work_order_number,
      customer_name: wo.customer_name,
      mobile: wo.mobile,
      event_type: wo.event_type,
      booking_date: wo.booking_date,
      package_name: 'Photography Package',
      package_amount: packageAmount,
      gst_amount: gstAmount,
      discount_amount: discountAmount,
      net_amount: netAmount,
      amount_received: amountReceived,
      balance_amount: balanceAmount,
      payment_percentage: paymentPercentage,
      last_payment_date: lastPaymentDate,
      payments: woPayments,
      payouts: woPayouts,
      expenses: woExpenses,
      total_payouts: totalPayouts,
      total_expenses: totalExpenses,
      gross_profit: grossProfit,
      net_profit: netProfit,
      profit_margin_percent: profitMarginPercent,
    }
  })
}

// ─── Financial Audit Trail Log ───────────────────────────────────────────────

const FINANCIAL_AUDIT_KEY = 'trufocus_crm_financial_audit_v1'

export interface FinancialAuditLog {
  id: string
  action: string
  target_id: string
  work_order_number?: string
  performed_by: string
  details: string
  timestamp: string
}

export function getFinancialAuditLogs(): FinancialAuditLog[] {
  try {
    const raw = localStorage.getItem(FINANCIAL_AUDIT_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error(e)
  }
  return []
}

export function logFinancialAudit(
  action: string,
  target_id: string,
  details: string,
  work_order_number?: string,
  performed_by = 'Studio Accounts'
): void {
  const logs = getFinancialAuditLogs()
  const newEntry: FinancialAuditLog = {
    id: `fa-${Date.now()}`,
    action,
    target_id,
    work_order_number,
    performed_by,
    details,
    timestamp: new Date().toISOString(),
  }
  try {
    localStorage.setItem(FINANCIAL_AUDIT_KEY, JSON.stringify([newEntry, ...logs]))
  } catch (e) {
    console.error(e)
  }
}

// ─── Work Order Central Sync & Full Audit Reconciliation ─────────────────────

export function reconcileAllWorkOrdersAndPayments(): void {
  const workOrders = getLocalWorkOrders().filter((w) => !w.deleted_at && w.status !== 'deleted')
  const allPayments = getPayments()

  let updated = false
  const updatedWorkOrders = workOrders.map((wo) => {
    const woPayments = allPayments.filter(
      (p) => (p.work_order_id === wo.id || p.work_order_number === wo.work_order_number) && p.status === 'completed'
    )

    const packageAmount = typeof wo.payment?.package_amount === 'number'
      ? wo.payment.package_amount
      : (typeof wo.package_total === 'number' ? wo.package_total : 0)
    const gstAmount = wo.payment?.gst_amount || 0
    const discountAmount = wo.payment?.discount_amount || 0
    const netAmount = wo.payment?.net_amount || (packageAmount + gstAmount - discountAmount)

    const newReceived = woPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const newBalance = Math.max(0, netAmount - newReceived)

    let newPaymentStatus: 'pending' | 'partially_paid' | 'advance_received' | 'fully_paid' = 'pending'
    if (newReceived >= netAmount && netAmount > 0) {
      newPaymentStatus = 'fully_paid'
    } else if (newReceived > 0) {
      newPaymentStatus = newReceived >= (netAmount * 0.25) ? 'advance_received' : 'partially_paid'
    }

    const derivedLedger = woPayments.map((p) => ({
      id: p.id,
      work_order_id: wo.id,
      payment_date: p.payment_date,
      amount: p.amount,
      payment_mode: p.payment_mode,
      transaction_ref: p.transaction_ref || p.receipt_number,
      received_by: p.received_by,
      notes: p.remarks || '',
      created_at: p.created_at,
    }))

    if (
      wo.payment?.amount_received !== newReceived ||
      wo.payment?.balance_amount !== newBalance ||
      wo.payment_status !== newPaymentStatus
    ) {
      updated = true
    }

    return {
      ...wo,
      amount_received: newReceived,
      payment_status: newPaymentStatus,
      payment: {
        ...wo.payment,
        package_amount: packageAmount,
        amount_received: newReceived,
        balance_amount: newBalance,
        gst_amount: gstAmount,
        discount_amount: discountAmount,
        net_amount: netAmount,
        payment_status: newPaymentStatus,
        ledger: derivedLedger,
      },
    }
  })

  if (updated) {
    saveLocalWorkOrders(updatedWorkOrders)
  }
}

export function updateWorkOrderPaymentTotals(_workOrderId?: string): void {
  reconcileAllWorkOrdersAndPayments()
}

// ─── Actions & Modals ────────────────────────────────────────────────────────

export function recordCustomerPayment(data: {
  work_order_id: string
  work_order_number: string
  customer_name: string
  amount: number
  payment_date: string
  payment_mode: PaymentMode
  transaction_ref?: string
  received_by: string
  remarks?: string
}): PaymentRecord {
  const currentPayments = getPayments()
  const nextSeq = currentPayments.length + 1
  const receiptNumber = `RCT-2026-${String(nextSeq).padStart(4, '0')}`

  const newPayment: PaymentRecord = {
    id: `pay-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    receipt_number: receiptNumber,
    work_order_id: data.work_order_id,
    work_order_number: data.work_order_number,
    customer_name: data.customer_name,
    amount: data.amount,
    payment_date: data.payment_date,
    payment_mode: data.payment_mode,
    transaction_ref: data.transaction_ref,
    received_by: data.received_by,
    remarks: data.remarks,
    status: 'completed',
    created_at: new Date().toISOString(),
  }

  savePayments([newPayment, ...currentPayments])
  logFinancialAudit('Customer Receipt Added', newPayment.id, `Recorded payment of ₹${data.amount.toLocaleString()} via ${data.payment_mode}`, data.work_order_number)

  // Sync central Work Order totals and ledger with single source of truth
  updateWorkOrderPaymentTotals(data.work_order_id)

  return newPayment
}

export function updatePaymentRecord(
  id: string,
  updates: Partial<PaymentRecord>,
  updatedBy = 'Studio Accounts'
): PaymentRecord | null {
  const currentPayments = getPayments()
  const index = currentPayments.findIndex((p) => p.id === id)
  if (index === -1) return null

  const target = currentPayments[index]
  const prevDate = target.payment_date
  const updated: PaymentRecord = {
    ...target,
    ...updates,
    updated_at: new Date().toISOString(),
  }

  currentPayments[index] = updated
  savePayments(currentPayments)

  const dateChangedMsg = updates.payment_date && updates.payment_date !== prevDate
    ? ` [Payment Date changed: ${prevDate} → ${updates.payment_date}]`
    : ''

  logFinancialAudit(
    'Customer Receipt Edited',
    id,
    `Updated receipt ${updated.receipt_number || id}:${dateChangedMsg} Amount ₹${updated.amount.toLocaleString()}, Mode: ${updated.payment_mode}, Ref: ${updated.transaction_ref || 'N/A'}`,
    target.work_order_number,
    updatedBy
  )

  updateWorkOrderPaymentTotals(target.work_order_id)
  broadcastPaymentSync()
  return updated
}

export function deletePaymentRecord(id: string, deletedBy = 'Studio Accounts'): boolean {
  if (!canUserPerformDelete('finances')) {
    logAIPermissionAudit({
      user_id: 'usr-security',
      user_name: deletedBy,
      role: 'Restricted',
      module: 'finances',
      requested_action: 'delete',
      prompt_text: `Attempted delete customer receipt ${id}`,
      allowed: false,
      reason: "Permission Denied: Only Owner and Administrator can delete finance records.",
    })
    return false
  }

  const currentPayments = getPayments()
  const target = currentPayments.find((p) => p.id === id)
  if (!target) return false

  const filtered = currentPayments.filter((p) => p.id !== id)
  savePayments(filtered)

  logFinancialAudit(
    'Customer Receipt Deleted',
    id,
    `Deleted receipt ${target.receipt_number || id} for ₹${target.amount.toLocaleString()}`,
    target.work_order_number,
    deletedBy
  )

  updateWorkOrderPaymentTotals(target.work_order_id)
  broadcastPaymentSync()
  return true
}

export function deleteProjectExpense(id: string, deletedBy = 'Studio Accounts'): boolean {
  if (!canUserPerformDelete('finances')) {
    logAIPermissionAudit({
      user_id: 'usr-security',
      user_name: deletedBy,
      role: 'Restricted',
      module: 'finances',
      requested_action: 'delete',
      prompt_text: `Attempted delete project expense ${id}`,
      allowed: false,
      reason: "Permission Denied: Only Owner and Administrator can delete finance records.",
    })
    return false
  }

  const current = getProjectExpenses()
  const filtered = current.filter((e) => e.id !== id)
  saveProjectExpenses(filtered)
  broadcastPaymentSync()
  return true
}

export function deleteCompanyExpense(id: string, deletedBy = 'Studio Accounts'): boolean {
  if (!canUserPerformDelete('finances')) {
    logAIPermissionAudit({
      user_id: 'usr-security',
      user_name: deletedBy,
      role: 'Restricted',
      module: 'finances',
      requested_action: 'delete',
      prompt_text: `Attempted delete company expense ${id}`,
      allowed: false,
      reason: "Permission Denied: Only Owner and Administrator can delete finance records.",
    })
    return false
  }

  const current = getCompanyExpenses()
  const filtered = current.filter((e) => e.id !== id)
  saveCompanyExpenses(filtered)
  broadcastPaymentSync()
  return true
}

export function recordTeamPayout(data: {
  work_order_id: string
  work_order_number: string
  service_id: string
  service_name: string
  employee_id: string
  employee_name: string
  amount: number
  payment_status: PayoutStatus
  payment_date?: string
  payment_mode?: PaymentMode
  transaction_ref?: string
  remarks?: string
}): TeamPayout {
  const currentPayouts = getTeamPayouts()
  const newPayout: TeamPayout = {
    id: `po-${Date.now()}`,
    work_order_id: data.work_order_id,
    work_order_number: data.work_order_number,
    service_id: data.service_id,
    service_name: data.service_name,
    employee_id: data.employee_id,
    employee_name: data.employee_name,
    amount: data.amount,
    payment_status: data.payment_status,
    payment_date: data.payment_date || new Date().toISOString().split('T')[0],
    payment_mode: data.payment_mode || 'upi',
    transaction_ref: data.transaction_ref,
    remarks: data.remarks,
    created_at: new Date().toISOString(),
  }

  saveTeamPayouts([newPayout, ...currentPayouts])
  return newPayout
}

export function addProjectExpense(data: {
  work_order_id: string
  work_order_number: string
  category: ProjectExpenseCategory
  description: string
  amount: number
  expense_date: string
  paid_to: string
  payment_mode: PaymentMode
  remarks?: string
}): ProjectExpense {
  const currentExpenses = getProjectExpenses()
  const newExpense: ProjectExpense = {
    id: `pe-${Date.now()}`,
    work_order_id: data.work_order_id,
    work_order_number: data.work_order_number,
    category: data.category,
    description: data.description,
    amount: data.amount,
    expense_date: data.expense_date,
    paid_to: data.paid_to,
    payment_mode: data.payment_mode,
    remarks: data.remarks,
    created_at: new Date().toISOString(),
  }

  saveProjectExpenses([newExpense, ...currentExpenses])
  return newExpense
}

export function addCompanyExpense(data: {
  category: CompanyExpenseCategory
  vendor: string
  amount: number
  expense_date: string
  gst_amount?: number
  remarks?: string
}): CompanyExpense {
  const currentExpenses = getCompanyExpenses()
  const newExpense: CompanyExpense = {
    id: `ce-${Date.now()}`,
    category: data.category,
    vendor: data.vendor,
    amount: data.amount,
    expense_date: data.expense_date,
    gst_amount: data.gst_amount,
    remarks: data.remarks,
    created_at: new Date().toISOString(),
  }

  saveCompanyExpenses([newExpense, ...currentExpenses])
  return newExpense
}

export function generateInvoice(data: {
  work_order_id: string
  work_order_number: string
  customer_name: string
  customer_mobile: string
  subtotal_amount: number
  gst_rate?: number
  discount_amount?: number
}): InvoiceRecord {
  const currentInvoices = getInvoices()
  const nextSeq = currentInvoices.length + 1
  const invoiceNumber = `INV-2026-${String(nextSeq).padStart(4, '0')}`

  const subtotal = data.subtotal_amount
  const gstRate = data.gst_rate ?? 18
  const gstAmount = Math.round(subtotal * (gstRate / 100))
  const discount = data.discount_amount ?? 0
  const total = subtotal + gstAmount - discount

  const newInvoice: InvoiceRecord = {
    id: `inv-${Date.now()}`,
    invoice_number: invoiceNumber,
    work_order_id: data.work_order_id,
    work_order_number: data.work_order_number,
    customer_name: data.customer_name,
    customer_mobile: data.customer_mobile,
    invoice_date: new Date().toISOString().split('T')[0],
    subtotal_amount: subtotal,
    gst_rate: gstRate,
    gst_amount: gstAmount,
    discount_amount: discount,
    total_amount: total,
    status: 'paid',
    created_at: new Date().toISOString(),
  }

  saveInvoices([newInvoice, ...currentInvoices])
  return newInvoice
}
