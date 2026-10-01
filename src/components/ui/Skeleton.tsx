import { cn } from '@/utils/cn'

interface SkeletonProps {
  className?: string
  rounded?: boolean
}

/** Animated loading skeleton placeholder */
export function Skeleton({ className, rounded = false }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--color-bg-elevated)]',
        rounded ? 'rounded-full' : 'rounded-[var(--radius-md)]',
        className
      )}
    />
  )
}

// ─── Compound Skeletons ───────────────────────────────────────────────────────

/** A full card skeleton with title + body lines */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-5 rounded-[var(--radius-lg)] bg-[var(--color-bg-card)]',
        'border border-[var(--color-border-subtle)]',
        className
      )}
    >
      <Skeleton className="h-4 w-1/3 mb-3" />
      <Skeleton className="h-8 w-1/2 mb-4" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  )
}

/** A row skeleton for table rows */
export function RowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex gap-4 p-4 border-b border-[var(--color-border-subtle)]">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4 flex-1', i === 0 && 'max-w-[200px]')}
        />
      ))}
    </div>
  )
}
