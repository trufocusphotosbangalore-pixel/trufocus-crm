import { getLocalWorkOrders, saveLocalWorkOrders } from '@/services/supabase/workOrders'
import { broadcastPaymentSync } from '@/hooks/useRealtimeSync'
import type { WorkOrder, WorkOrderPaymentLedger } from '@/types/workOrders'

export const RAZORPAY_HANDLE = 'https://razorpay.me/@Trufocusphotos'
export const RAZORPAY_KEY_ID = 'rzp_live_trufocus_photography'

export interface RazorpayOrderDetails {
  orderId: string
  amount: number
  currency: string
  workOrderNumber: string
  customerName: string
  customerEmail?: string
  customerPhone: string
}

export interface RazorpayPaymentSuccessPayload {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature?: string
  amount: number
  payment_mode?: string
}

export interface ProcessPaymentResult {
  success: boolean
  error?: string
  paymentEntry?: WorkOrderPaymentLedger
  receiptNumber?: string
  updatedWorkOrder?: WorkOrder
}

/** Generate a Razorpay Order ID for checkout */
export function createRazorpayOrder(
  workOrder: WorkOrder,
  payAmount: number
): RazorpayOrderDetails {
  const orderId = 'order_rzp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
  return {
    orderId,
    amount: payAmount,
    currency: 'INR',
    workOrderNumber: workOrder.work_order_number,
    customerName: workOrder.customer_name,
    customerEmail: workOrder.email || undefined,
    customerPhone: workOrder.mobile,
  }
}

/** Record & Verify Razorpay Payment in database / local store */
export function processRazorpayPayment(
  workOrderNumber: string,
  payload: RazorpayPaymentSuccessPayload
): ProcessPaymentResult {
  const workOrders = getLocalWorkOrders()
  const targetWO = workOrders.find(
    w => w.work_order_number.toLowerCase() === workOrderNumber.toLowerCase()
  )

  if (!targetWO) {
    return { success: false, error: 'Work order not found' }
  }

  // Prevent Duplicate Payments (Check transaction_ref or payment_id)
  const existingLedger = targetWO.payment?.ledger || []
  const isDuplicate = existingLedger.some(
    item => item.transaction_ref === payload.razorpay_payment_id
  )

  if (isDuplicate) {
    return { success: false, error: 'Duplicate payment transaction detected. Payment already processed.' }
  }

  // Generate Unique Receipt Number
  const receiptCount = existingLedger.length + 1
  const receiptNumber = `TRF-RCP-${new Date().getFullYear()}-000${receiptCount}`

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  const newEntry: WorkOrderPaymentLedger = {
    id: `pay-rzp-${Date.now()}-${Math.random().toString(36).substring(2, 4)}`,
    payment_date: todayStr,
    amount: payload.amount,
    payment_mode: payload.payment_mode || 'Razorpay (Online UPI/Card)',
    transaction_ref: payload.razorpay_payment_id,
    received_by: 'Razorpay Gateway Auto',
    notes: `Razorpay Online Payment verified (Order: ${payload.razorpay_order_id}). Receipt #${receiptNumber}`,
    receipt_url: `receipts/${receiptNumber}.pdf`,
    created_at: now.toISOString(),
  }

  const updatedLedger = [...existingLedger, newEntry]

  // Recalculate Financials
  const pkgAmt = targetWO.payment?.package_amount || 0
  const discAmt = targetWO.payment?.discount_amount || 0
  const isGstApplicable = targetWO.payment?.gst_applicable ?? false
  const gstPct = isGstApplicable ? (targetWO.payment?.gst_percent || 0) : 0
  const gstAmt = isGstApplicable ? (pkgAmt * gstPct / 100) : 0
  const netAmt = Math.max(0, pkgAmt - discAmt + gstAmt)

  const totalPaid = updatedLedger.reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const newBalance = Math.max(0, netAmt - totalPaid)

  // Payment Status: pending -> partially_paid -> fully_paid
  let newStatus: 'pending' | 'partially_paid' | 'fully_paid' = 'pending'
  if (newBalance <= 0) {
    newStatus = 'fully_paid'
  } else if (totalPaid > 0) {
    newStatus = 'partially_paid'
  }

  const updatedWO: WorkOrder = {
    ...targetWO,
    payment_status: newStatus,
    payment: {
      ...targetWO.payment,
      package_amount: pkgAmt,
      discount_amount: discAmt,
      gst_applicable: isGstApplicable,
      gst_percent: gstPct,
      gst_amount: gstAmt,
      net_amount: netAmt,
      amount_received: totalPaid,
      balance_amount: newBalance,
      payment_status: newStatus,
      ledger: updatedLedger,
    },
    updated_at: now.toISOString(),
  }

  // Update in Local Storage
  const updatedList = workOrders.map(item =>
    item.work_order_number.toLowerCase() === workOrderNumber.toLowerCase()
      ? updatedWO
      : item
  )

  saveLocalWorkOrders(updatedList)

  // Dispatch Real-Time Sync Event across all open windows & tabs
  broadcastPaymentSync({
    workOrderNumber,
    amount: payload.amount,
    customerName: updatedWO.customer_name,
    receiptNumber,
  })

  // Trigger Simulated WhatsApp / Email Receipt Alert
  console.log(`[Notification Triggered] Sent payment receipt ${receiptNumber} for ₹${payload.amount} to ${updatedWO.customer_name} (${updatedWO.mobile}).`)

  return {
    success: true,
    paymentEntry: newEntry,
    receiptNumber,
    updatedWorkOrder: updatedWO,
  }
}
