import { useEffect, useRef } from 'react'
import {
  ArrowUp, ArrowDown, EyeOff, Pin, RotateCcw,
} from 'lucide-react'
import type { ColumnPin } from './types'

interface ColumnContextMenuProps {
  x: number
  y: number
  columnId: string
  columnLabel: string
  isSortable?: boolean
  currentPin: ColumnPin
  onClose: () => void
  onSort?: (direction: 'asc' | 'desc') => void
  onHide: () => void
  onPin: (pin: ColumnPin) => void
  onResetWidth: () => void
}

export function ColumnContextMenu({
  x,
  y,
  columnLabel,
  isSortable,
  currentPin,
  onClose,
  onSort,
  onHide,
  onPin,
  onResetWidth,
}: ColumnContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      style={{ left: Math.min(x, window.innerWidth - 220), top: y }}
      className="fixed z-50 w-52 bg-white rounded-xl border border-[#E5E7EB] shadow-2xl overflow-hidden py-1 text-xs font-sans animate-in fade-in duration-100"
    >
      <div className="px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] text-gray-400 border-b border-gray-100">
        Column: {columnLabel}
      </div>

      {isSortable && onSort && (
        <>
          <button
            onClick={() => { onSort('asc'); onClose() }}
            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium"
          >
            <ArrowUp size={13} className="text-[#5B3FD9]" /> Sort Ascending (A → Z)
          </button>
          <button
            onClick={() => { onSort('desc'); onClose() }}
            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium"
          >
            <ArrowDown size={13} className="text-[#5B3FD9]" /> Sort Descending (Z → A)
          </button>
          <div className="my-1 border-t border-gray-100" />
        </>
      )}

      <button
        onClick={() => { onHide(); onClose() }}
        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600 font-medium"
      >
        <EyeOff size={13} /> Hide Column
      </button>

      <div className="my-1 border-t border-gray-100" />

      <button
        onClick={() => { onPin(currentPin === 'left' ? 'none' : 'left'); onClose() }}
        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium"
      >
        <Pin size={13} className={currentPin === 'left' ? 'text-[#5B3FD9] fill-[#5B3FD9]' : ''} />
        {currentPin === 'left' ? 'Unpin Left' : 'Pin to Left'}
      </button>

      <button
        onClick={() => { onPin(currentPin === 'right' ? 'none' : 'right'); onClose() }}
        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium"
      >
        <Pin size={13} className={currentPin === 'right' ? 'text-[#5B3FD9] fill-[#5B3FD9]' : ''} />
        {currentPin === 'right' ? 'Unpin Right' : 'Pin to Right'}
      </button>

      <div className="my-1 border-t border-gray-100" />

      <button
        onClick={() => { onResetWidth(); onClose() }}
        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-600 font-medium"
      >
        <RotateCcw size={13} /> Reset Column Width
      </button>
    </div>
  )
}
