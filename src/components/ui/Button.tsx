import React from 'react'
import { cn } from '@/utils/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-[var(--color-primary)] text-white',
    'hover:bg-[var(--color-primary-hover)]',
    'shadow-sm',
  ].join(' '),
  secondary: [
    'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]',
    'border border-[var(--color-border-default)]',
    'hover:bg-[var(--color-bg-card)] hover:border-[var(--color-border-strong)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--color-text-secondary)]',
    'hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]',
  ].join(' '),
  danger: [
    'bg-[var(--color-error)] text-white',
    'hover:bg-red-600',
  ].join(' '),
  outline: [
    'bg-transparent text-[var(--color-primary)]',
    'border border-[var(--color-primary)]',
    'hover:bg-[var(--color-primary-light)]',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base
          'inline-flex items-center justify-center',
          'rounded-[var(--radius-md)] font-medium',
          'transition-all duration-150 ease-out',
          'cursor-pointer select-none',
          'focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2',
          // Disabled
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variant + Size
          variantStyles[variant],
          sizeStyles[size],
          // Full width
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner size={size} />
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// ─── Loading Spinner ──────────────────────────────────────────────────────────

function LoadingSpinner({ size }: { size: ButtonSize }) {
  const spinnerSize = size === 'sm' ? 'size-3' : size === 'lg' ? 'size-5' : 'size-4'
  return (
    <svg
      className={cn('animate-spin', spinnerSize)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
