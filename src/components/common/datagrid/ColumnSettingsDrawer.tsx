import {
  X, RotateCcw, SlidersHorizontal, Check, ArrowUp, ArrowDown, Sparkles,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import type { ColumnDef, ColumnPin, TableLayoutState } from './types'
import { toast } from 'react-hot-toast'

interface ColumnSettingsDrawerProps {
  isOpen: boolean
  columns: ColumnDef[]
  layout: TableLayoutState
  onClose: () => void
  onToggleVisibility: (colId: string) => void
  onPinColumn: (colId: string, pin: ColumnPin) => void
  onMoveColumn: (fromIndex: number, toIndex: number) => void
  onResetLayout: () => void
  onAutoFitAll: () => void
}

export function ColumnSettingsDrawer({
  isOpen,
  columns,
  layout,
  onClose,
  onToggleVisibility,
  onPinColumn,
  onMoveColumn,
  onResetLayout,
  onAutoFitAll,
}: ColumnSettingsDrawerProps) {
  if (!isOpen) return null

  const handleReset = () => {
    onResetLayout()
    toast.success('Table layout restored to defaults.')
  }

  const handleAutoFit = () => {
    onAutoFitAll()
    toast.success('Column widths auto-fitted to screen.')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white border-l border-[#E5E7EB] shadow-2xl h-full flex flex-col justify-between p-6 font-sans">

        {/* Drawer Header */}
        <div className="space-y-3 border-b border-[#E5E7EB] pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-[#5B3FD9]/10 flex items-center justify-center text-[#5B3FD9]">
                <SlidersHorizontal size={18} />
              </div>
              <h3 className="text-sm font-bold text-[#111827]">Table Columns & Layout</h3>
            </div>
            <button onClick={onClose} className="size-7 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-[#6B7280]">
            Customize column visibility, order, width, and pin settings for your personal workspace view.
          </p>
        </div>

        {/* Column List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Available Columns</span>

          {layout.columnOrder.map((colId, idx) => {
            const colDef = columns.find((c) => c.id === colId)
            if (!colDef) return null
            const isVisible = !layout.hiddenColumns.includes(colId)
            const currentPin = layout.pinnedColumns[colId] || 'none'
            const currentWidth = layout.columnWidths[colId] || colDef.defaultWidth

            return (
              <div
                key={colId}
                className={cn(
                  'p-3 rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs transition-colors',
                  isVisible ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 opacity-60'
                )}
              >
                {/* Visibility Toggle + Label */}
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => onToggleVisibility(colId)}
                    className="size-4 text-[#5B3FD9] rounded border-gray-300 focus:ring-[#5B3FD9]"
                  />
                  <div>
                    <p className="font-bold text-[#111827]">{colDef.label}</p>
                    <p className="text-[10px] font-mono text-gray-400">{currentWidth}px</p>
                  </div>
                </div>

                {/* Pinning & Order Controls */}
                <div className="flex items-center gap-1">
                  {/* Pin Buttons */}
                  <button
                    onClick={() => onPinColumn(colId, currentPin === 'left' ? 'none' : 'left')}
                    title="Pin Left"
                    className={cn(
                      'px-1.5 py-1 text-[10px] font-bold rounded border',
                      currentPin === 'left' ? 'bg-[#5B3FD9] text-white border-[#5B3FD9]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    Left
                  </button>
                  <button
                    onClick={() => onPinColumn(colId, currentPin === 'right' ? 'none' : 'right')}
                    title="Pin Right"
                    className={cn(
                      'px-1.5 py-1 text-[10px] font-bold rounded border',
                      currentPin === 'right' ? 'bg-[#5B3FD9] text-white border-[#5B3FD9]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    Right
                  </button>

                  {/* Move Up/Down Order */}
                  <button
                    onClick={() => idx > 0 && onMoveColumn(idx, idx - 1)}
                    disabled={idx === 0}
                    title="Move Up"
                    className="size-6 rounded border bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center disabled:opacity-30"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={() => idx < layout.columnOrder.length - 1 && onMoveColumn(idx, idx + 1)}
                    disabled={idx === layout.columnOrder.length - 1}
                    title="Move Down"
                    className="size-6 rounded border bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center disabled:opacity-30"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Drawer Actions */}
        <div className="border-t border-[#E5E7EB] pt-4 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={handleAutoFit}
              className="flex-1 py-2 text-xs font-bold rounded-xl border border-[#E5E7EB] bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center justify-center gap-1.5"
            >
              <Sparkles size={13} /> Auto Fit Widths
            </button>
            <button
              onClick={handleReset}
              className="flex-1 py-2 text-xs font-bold rounded-xl border border-[#E5E7EB] bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={13} /> Reset Layout
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] shadow-sm flex items-center justify-center gap-1.5"
          >
            <Check size={14} /> Apply Layout Settings
          </button>
        </div>

      </div>
    </div>
  )
}
