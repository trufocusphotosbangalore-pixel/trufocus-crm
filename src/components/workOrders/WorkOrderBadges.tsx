import { cn } from '@/utils/cn'
import {
  WO_STATUS_LABELS, WO_STATUS_COLORS,
  PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS,
} from '@/types/workOrders'
import type { WorkOrderStatus, PaymentStatus, ContractStatus } from '@/types/workOrders'

import { getComputedStatusBadgeProps, type ComputedScheduleStatus } from '@/utils/workOrderStatusEngine'

export function WOStatusBadge({ status }: { status: string }) {
  const c = WO_STATUS_COLORS[status as WorkOrderStatus]
  if (c) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap', c.bg, c.text)}>
        <span className={cn('size-1.5 rounded-full shrink-0', c.dot)} />
        {WO_STATUS_LABELS[status as WorkOrderStatus] || status}
      </span>
    )
  }

  const props = getComputedStatusBadgeProps(status as ComputedScheduleStatus)
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap border', props.bgClass, props.textClass, props.borderClass)}>
      <span className={cn('size-1.5 rounded-full shrink-0', props.dotClass)} />
      {props.label}
    </span>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const c = PAYMENT_STATUS_COLORS[status]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap', c.bg, c.text)}>
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  )
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const c = CONTRACT_STATUS_COLORS[status]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap', c.bg, c.text)}>
      {CONTRACT_STATUS_LABELS[status]}
    </span>
  )
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  const color = pct === 100 ? 'bg-green-400' : pct >= 60 ? 'bg-[var(--color-primary)]' : pct >= 30 ? 'bg-amber-400' : 'bg-[var(--color-text-muted)]'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-300', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-[var(--color-text-muted)] tabular-nums w-8 text-right">{pct}%</span>
    </div>
  )
}
