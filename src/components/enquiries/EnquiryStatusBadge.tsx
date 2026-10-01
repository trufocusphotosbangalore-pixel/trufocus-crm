import { cn } from '@/utils/cn'
import { ENQUIRY_STATUS_LABELS, STATUS_COLORS } from '@/types/enquiries'
import type { EnquiryStatus } from '@/types/enquiries'

interface EnquiryStatusBadgeProps {
  status: EnquiryStatus
  size?: 'sm' | 'md'
  showDot?: boolean
}

export function EnquiryStatusBadge({
  status,
  size = 'sm',
  showDot = true,
}: EnquiryStatusBadgeProps) {
  const colors = STATUS_COLORS[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        colors.bg,
        colors.text
      )}
    >
      {showDot && (
        <span className={cn('size-1.5 rounded-full shrink-0', colors.dot)} />
      )}
      {ENQUIRY_STATUS_LABELS[status]}
    </span>
  )
}
