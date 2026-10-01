export type DirectSalesOrderType = 'studio_expose' | 'podcast'

export type DirectSalesPaymentMode = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'mixed'

export type DirectSalesPaymentStatus = 'paid' | 'partial' | 'pending'

export interface DirectSalesCatalogItem {
  id: string
  order_type: DirectSalesOrderType
  category_name: string
  item_name: string
  unit?: string
  unit_price: number
  default_gst_percent: number
  is_gst_included?: boolean
  description?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface DirectSalesLineItem {
  id: string
  catalog_item_id?: string
  item_name: string
  category_name: string
  quantity: number
  unit_price: number
  discount_amount: number
  gst_percent: number
  is_gst_included: boolean
  subtotal: number
  gst_amount: number
  total_amount: number
}

export interface DirectSalesSplitPayment {
  payment_mode: 'cash' | 'upi' | 'card' | 'bank_transfer'
  amount: number
  reference_no?: string
}

export interface DirectSalesInvoice {
  id: string
  invoice_number: string
  order_type: DirectSalesOrderType
  customer_name: string
  mobile?: string
  email?: string
  gst_number?: string
  address?: string
  items: DirectSalesLineItem[]
  subtotal_amount: number
  discount_amount: number
  gst_amount: number
  is_gst_included: boolean
  total_amount: number
  amount_paid: number
  balance_due: number
  payment_status: DirectSalesPaymentStatus
  payment_mode: DirectSalesPaymentMode
  payment_splits?: DirectSalesSplitPayment[]
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface DirectSalesFilter {
  orderType?: DirectSalesOrderType | 'all'
  paymentStatus?: DirectSalesPaymentStatus | 'all'
  startDate?: string
  endDate?: string
  searchQuery?: string
}
