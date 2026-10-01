export type TransactionType = 'receipt' | 'payment'

export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'cheque'

export type PayoutStatus = 'pending' | 'paid'

export type OutboundExpenseCategory =
  | 'Freelancer Payment'
  | 'Photographer Payment'
  | 'Videographer Payment'
  | 'Photo Editor Payment'
  | 'Video Editor Payment'
  | 'Album Designer Payment'
  | 'Drone Operator Payment'
  | 'Travel'
  | 'Fuel'
  | 'Food'
  | 'Accommodation'
  | 'Printing'
  | 'Equipment Rental'
  | 'Courier'
  | 'Other'

export type ProjectExpenseCategory =
  | OutboundExpenseCategory
  | 'Parking'
  | 'Petrol'
  | 'Props'
  | 'Album Cost'
  | 'Frame Cost'
  | 'Miscellaneous'

export type CompanyExpenseCategory =
  | 'Office Rent'
  | 'Electricity'
  | 'Internet'
  | 'Software'
  | 'Camera Purchase'
  | 'Lens Purchase'
  | 'Marketing'
  | 'Salary'
  | 'Maintenance'
  | 'Travel'
  | 'Miscellaneous'

export interface UnifiedTransaction {
  id: string
  work_order_id: string
  work_order_number: string
  transaction_type: TransactionType
  category: string
  amount: number
  payment_mode: PaymentMode
  transaction_reference?: string
  paid_to?: string
  received_from?: string
  remarks?: string
  attachment_url?: string
  created_by?: string
  created_at: string
}

export interface PaymentRecord {
  id: string
  receipt_number: string // e.g. RCT-2026-0001
  work_order_id: string
  work_order_number: string
  customer_name: string
  amount: number
  payment_date: string
  payment_mode: PaymentMode
  transaction_ref?: string
  received_by: string
  remarks?: string
  receipt_url?: string
  status: 'completed' | 'pending' | 'cancelled'
  created_at: string
  updated_at?: string
}

export interface TeamPayout {
  id: string
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
  created_at: string
}

export interface ProjectExpense {
  id: string
  work_order_id: string
  work_order_number: string
  category: OutboundExpenseCategory | ProjectExpenseCategory
  description: string
  amount: number
  expense_date: string
  paid_to: string
  payment_mode: PaymentMode
  bill_url?: string
  remarks?: string
  created_at: string
}

export interface CompanyExpense {
  id: string
  category: CompanyExpenseCategory
  vendor: string
  amount: number
  expense_date: string
  gst_amount?: number
  bill_url?: string
  remarks?: string
  created_at: string
}

export interface InvoiceRecord {
  id: string
  invoice_number: string // e.g. INV-2026-0001
  work_order_id: string
  work_order_number: string
  customer_name: string
  customer_mobile: string
  customer_address?: string
  invoice_date: string
  subtotal_amount: number
  gst_rate: number // 18%
  gst_amount: number
  discount_amount: number
  total_amount: number
  status: 'paid' | 'unpaid' | 'partially_paid'
  created_at: string
}

export interface WorkOrderFinanceGroup {
  work_order_id: string
  work_order_number: string
  customer_name: string
  mobile: string
  event_type: string
  booking_date: string | null
  package_name: string
  package_amount: number
  gst_amount: number
  discount_amount: number
  net_amount: number
  amount_received: number
  balance_amount: number
  payment_percentage: number
  last_payment_date: string | null
  payments: PaymentRecord[]
  payouts: TeamPayout[]
  expenses: ProjectExpense[]
  total_payouts: number
  total_expenses: number
  gross_profit: number
  net_profit: number
  profit_margin_percent: number
}

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  cheque: 'Cheque',
}

export const OUTBOUND_EXPENSE_CATEGORIES: OutboundExpenseCategory[] = [
  'Freelancer Payment',
  'Photographer Payment',
  'Videographer Payment',
  'Photo Editor Payment',
  'Video Editor Payment',
  'Album Designer Payment',
  'Drone Operator Payment',
  'Travel',
  'Fuel',
  'Food',
  'Accommodation',
  'Printing',
  'Equipment Rental',
  'Courier',
  'Other',
]

export const PROJECT_EXPENSE_CATEGORIES: ProjectExpenseCategory[] = [
  'Travel',
  'Food',
  'Accommodation',
  'Parking',
  'Petrol',
  'Equipment Rental',
  'Props',
  'Printing',
  'Album Cost',
  'Frame Cost',
  'Courier',
  'Miscellaneous',
]

export const COMPANY_EXPENSE_CATEGORIES: CompanyExpenseCategory[] = [
  'Office Rent',
  'Electricity',
  'Internet',
  'Software',
  'Camera Purchase',
  'Lens Purchase',
  'Marketing',
  'Salary',
  'Maintenance',
  'Travel',
  'Miscellaneous',
]
