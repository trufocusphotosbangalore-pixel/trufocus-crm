import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface ActionMenuItem {
  icon?: React.ComponentType<{ size?: number; className?: string }>
  label: string
  onClick: (e: React.MouseEvent) => void
  danger?: boolean
  disabled?: boolean
  className?: string
}

export interface ActionMenuProps {
  items: ActionMenuItem[]
  trigger?: React.ReactNode
  triggerClassName?: string
  menuWidth?: number
  align?: 'left' | 'right' | 'auto'
}

export function ActionMenu({
  items,
  trigger,
  triggerClassName,
  menuWidth = 220,
  align = 'auto',
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuCoords, setMenuCoords] = useState<{
    top?: number
    bottom?: number
    left?: number
    right?: number
  }>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    const coords: { top?: number; bottom?: number; left?: number; right?: number } = {}

    // Vertical placement logic (Auto: open upward if space below < 260px)
    const spaceBelow = viewportHeight - rect.bottom
    if (spaceBelow < 260 && rect.top > 260) {
      coords.bottom = viewportHeight - rect.top + 6
    } else {
      coords.top = rect.bottom + 6
    }

    // Horizontal placement logic
    if (align === 'right' || (align === 'auto' && rect.left + menuWidth > viewportWidth - 16)) {
      coords.right = Math.max(16, viewportWidth - rect.right)
    } else {
      coords.left = Math.max(16, rect.left)
    }

    setMenuCoords(coords)
  }, [menuWidth, align])

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOpen) {
      updatePosition()
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Click outside, ESC key, scroll, & window resize listeners
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        handleClose()
      }
    }

    const handleScrollOrResize = () => {
      updatePosition()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [isOpen, handleClose, updatePosition])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        title="More Actions"
        className={cn(
          'size-7 rounded-md flex items-center justify-center transition-colors cursor-pointer text-gray-500 hover:text-[#111827] hover:bg-gray-100',
          isOpen && 'bg-gray-100 text-[#111827]',
          triggerClassName
        )}
      >
        {trigger || <MoreHorizontal size={14} />}
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: menuCoords.top !== undefined ? `${menuCoords.top}px` : undefined,
              bottom: menuCoords.bottom !== undefined ? `${menuCoords.bottom}px` : undefined,
              left: menuCoords.left !== undefined ? `${menuCoords.left}px` : undefined,
              right: menuCoords.right !== undefined ? `${menuCoords.right}px` : undefined,
              width: `${menuWidth}px`,
              zIndex: 9999,
            }}
            className="font-sans text-xs bg-white rounded-xl border border-gray-200 shadow-2xl py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {items.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={index}
                  type="button"
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClose()
                    if (!item.disabled) item.onClick(e)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left cursor-pointer font-medium',
                    item.danger
                      ? 'text-red-600 hover:bg-red-50 font-bold'
                      : 'text-gray-700 hover:bg-gray-50',
                    item.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
                    item.className
                  )}
                >
                  {Icon && <Icon size={14} className={cn('shrink-0', item.danger ? 'text-red-600' : 'text-gray-400')} />}
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </>
  )
}
