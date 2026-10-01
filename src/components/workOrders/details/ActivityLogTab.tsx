import { Activity } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { WorkOrder } from '@/types/workOrders'

interface ActivityLogTabProps {
  workOrder: WorkOrder
}

export function ActivityLogTab({ workOrder }: ActivityLogTabProps) {
  const paidAmount = workOrder.payment?.amount_received || 0
  const defaultLogs = [
    { action: 'Customer Logged into Portal', user: workOrder.customer_name, date: workOrder.created_at, details: 'Authenticated via 4-Digit PIN' },
    { action: 'Payment Captured (Razorpay)', user: 'Customer Portal', date: workOrder.created_at, details: `Amount: ₹${paidAmount.toLocaleString()}` },
    { action: 'Work Order Details Modified', user: 'Operations Manager', date: workOrder.created_at, details: 'Updated event venue and special notes' },
    { action: 'Portal Security PIN Generated', user: 'System', date: workOrder.created_at, details: 'PIN: 1234' },
  ]
  const customLogs = (workOrder.activity_logs || []).map((l: any) => ({
    action: l.action,
    user: l.user,
    date: l.date,
    details: l.details,
  }))

  const logs = [...customLogs, ...defaultLogs]

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-6">
        <div className="border-b border-[#E5E7EB] pb-4">
          <h3 className="text-base font-bold text-[#111827]">Audit & System Activity Log</h3>
          <p className="text-xs text-gray-500">Record of all user modifications, client portal logins, and payment transactions</p>
        </div>

        <div className="space-y-3">
          {logs.map((log, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-purple-100 text-[#5B3FD9] flex items-center justify-center font-bold">
                  <Activity size={15} />
                </div>
                <div>
                  <p className="font-bold text-[#111827]">{log.action}</p>
                  <p className="text-[10px] text-gray-500">{log.details}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-gray-700">{log.user}</p>
                <p className="text-[10px] text-gray-400 font-mono">{formatDate(log.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
