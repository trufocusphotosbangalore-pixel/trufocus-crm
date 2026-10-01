import React, { useState, useRef } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Pin } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ColumnContextMenu } from './ColumnContextMenu'
import type { ColumnDef, ColumnPin } from './types'
import type { SortConfig } from '@/types/common'

interface ResizableHeaderCellProps {
  column: ColumnDef
  width: number
  pin: ColumnPin
  sort?: SortConfig
  onSort?: (field: string) => void
  onResize: (colId: string, width: number) => void
  onHide: (colId: string) => void
  onPin: (colId: string, pin: ColumnPin) => void
  onResetWidth: (colId: string) => void
}

export function ResizableHeaderCell({
  column,
  width,
  pin,
  sort,
  onSort,
  onResize,
  onHide,
  onPin,
  onResetWidth,
}: ResizableHeaderCellProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = width

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current
      const newWidth = startWidthRef.current + deltaX
      onResize(column.id, newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const isSorted = sort?.field === column.id

  return (
    <th
      style={{ width: `${width}px`, minWidth: `${column.minWidth || 60}px` }}
      onContextMenu={handleContextMenu}
      className={cn(
        'relative px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#6B7280]',
        'border-b border-[#E5E7EB] select-none group',
        pin === 'left' && 'sticky left-0 z-20 bg-[#FAFAFC] shadow-r',
        pin === 'right' && 'sticky right-0 z-20 bg-[#FAFAFC] shadow-l',
        column.align === 'right' && 'text-right',
        column.align === 'center' && 'text-center',
        column.sortable && 'cursor-pointer hover:text-[#111827]',
        isSorted && 'text-[#5B3FD9]'
      )}
      onClick={() => column.sortable && onSort && onSort(column.id)}
    >
      <div className="flex items-center justify-between gap-1 overflow-hidden">
        <span className="truncate flex items-center gap-1">
          {pin !== 'none' && <Pin size={10} className="text-[#5B3FD9] fill-[#5B3FD9] shrink-0" />}
          {column.label}
        </span>

        {column.sortable && (
          <span className="shrink-0">
            {isSorted ? (
              sort.direction === 'asc' ? <ChevronUp size={13} className="text-[#5B3FD9]" /> : <ChevronDown size={13} className="text-[#5B3FD9]" />
            ) : (
              <ChevronsUpDown size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        )}
      </div>

      <div
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'absolute top-0 right-0 w-2 h-full cursor-col-resize z-30 flex items-center justify-center hover:bg-[#5B3FD9]/30 transition-colors',
          isResizing && 'bg-[#5B3FD9] opacity-100'
        )}
      >
        <div className="w-[1.5px] h-4 bg-gray-300 group-hover:bg-[#5B3FD9]" />
      </div>

      {contextMenu && (
        <ColumnContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          columnId={column.id}
          columnLabel={column.label}
          isSortable={column.sortable}
          currentPin={pin}
          onClose={() => setContextMenu(null)}
          onSort={() => onSort && onSort(column.id)}
          onHide={() => onHide(column.id)}
          onPin={(p) => onPin(column.id, p)}
          onResetWidth={() => onResetWidth(column.id)}
        />
      )}
    </th>
  )
}
