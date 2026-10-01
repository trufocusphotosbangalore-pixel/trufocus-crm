import { cn } from '@/utils/cn'
import { getInitials } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  online?: boolean
}

const sizeStyles = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-11 text-base',
  xl: 'size-14 text-lg',
}

const dotSizeStyles = {
  xs: 'size-1.5 bottom-0 right-0',
  sm: 'size-2 bottom-0 right-0',
  md: 'size-2.5 bottom-0.5 right-0.5',
  lg: 'size-3 bottom-0.5 right-0.5',
  xl: 'size-3.5 bottom-1 right-1',
}

export function Avatar({ src, name, size = 'md', className, online }: AvatarProps) {
  const initials = name ? getInitials(name) : '?'

  return (
    <div className={cn('relative shrink-0', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-semibold overflow-hidden',
          'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
          sizeStyles[size]
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name ?? 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {online !== undefined && (
        <span
          className={cn(
            'absolute rounded-full border-2 border-[var(--color-bg-base)]',
            online ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-muted)]',
            dotSizeStyles[size]
          )}
        />
      )}
    </div>
  )
}
