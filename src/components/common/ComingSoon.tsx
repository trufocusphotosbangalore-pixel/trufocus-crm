import React from 'react'
import { cn } from '@/utils/cn'

interface ComingSoonProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  description: string
  module: string
}

/**
 * Placeholder component shown for modules not yet implemented.
 * Replace this component when the module is built out.
 */
export function ComingSoon({ icon: Icon, title, description, module }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className={cn(
          'size-16 rounded-[var(--radius-xl)] mx-auto mb-5 flex items-center justify-center',
          'bg-[var(--color-primary-light)]'
        )}>
          <Icon size={28} className="text-[var(--color-primary)]" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{title}</h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">{description}</p>
        <span className={cn(
          'inline-block px-3 py-1 rounded-full text-xs font-medium',
          'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
        )}>
          {module} — Coming soon
        </span>
      </div>
    </div>
  )
}
