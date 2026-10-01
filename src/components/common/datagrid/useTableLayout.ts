import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ColumnDef, TableLayoutState, ColumnPin } from './types'

export function useTableLayout(tableId: string, columns: ColumnDef[]) {
  const storageKey = `trufocus_table_layout_${tableId}_v1`

  const getDefaultState = useCallback((): TableLayoutState => {
    const widths: Record<string, number> = {}
    const order: string[] = []
    const hidden: string[] = []
    const pins: Record<string, ColumnPin> = {}

    columns.forEach((col) => {
      widths[col.id] = col.defaultWidth
      order.push(col.id)
      if (col.defaultVisible === false) hidden.push(col.id)
      pins[col.id] = col.pin || 'none'
    })

    return {
      columnWidths: widths,
      columnOrder: order,
      hiddenColumns: hidden,
      pinnedColumns: pins,
    }
  }, [columns])

  const [layout, setLayout] = useState<TableLayoutState>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        const mergedWidths = { ...parsed.columnWidths }
        const mergedPins = { ...parsed.pinnedColumns }
        columns.forEach((col) => {
          if (mergedWidths[col.id] === undefined) mergedWidths[col.id] = col.defaultWidth
          if (mergedPins[col.id] === undefined) mergedPins[col.id] = col.pin || 'none'
        })
        return {
          columnWidths: mergedWidths,
          columnOrder: parsed.columnOrder?.length ? parsed.columnOrder : columns.map((c) => c.id),
          hiddenColumns: parsed.hiddenColumns || [],
          pinnedColumns: mergedPins,
        }
      }
    } catch (e) {
      console.error('Error reading table layout', e)
    }
    return getDefaultState()
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(layout))
    } catch (e) {
      console.error('Error saving table layout', e)
    }
  }, [layout, storageKey])

  const setColumnWidth = useCallback((colId: string, width: number) => {
    setLayout((prev) => {
      const colDef = columns.find((c) => c.id === colId)
      const min = colDef?.minWidth ?? 60
      const max = colDef?.maxWidth ?? 600
      const clamped = Math.max(min, Math.min(max, width))
      return {
        ...prev,
        columnWidths: { ...prev.columnWidths, [colId]: clamped },
      }
    })
  }, [columns])

  const toggleColumnVisibility = useCallback((colId: string) => {
    setLayout((prev) => {
      const isHidden = prev.hiddenColumns.includes(colId)
      const newHidden = isHidden
        ? prev.hiddenColumns.filter((id) => id !== colId)
        : [...prev.hiddenColumns, colId]
      return { ...prev, hiddenColumns: newHidden }
    })
  }, [])

  const setColumnPin = useCallback((colId: string, pin: ColumnPin) => {
    setLayout((prev) => ({
      ...prev,
      pinnedColumns: { ...prev.pinnedColumns, [colId]: pin },
    }))
  }, [])

  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    setLayout((prev) => {
      const newOrder = [...prev.columnOrder]
      const [removed] = newOrder.splice(fromIndex, 1)
      newOrder.splice(toIndex, 0, removed)
      return { ...prev, columnOrder: newOrder }
    })
  }, [])

  const resetLayout = useCallback(() => {
    const defaultState = getDefaultState()
    setLayout(defaultState)
  }, [getDefaultState])

  const autoFitAll = useCallback(() => {
    setLayout((prev) => {
      const newWidths: Record<string, number> = {}
      columns.forEach((col) => {
        newWidths[col.id] = col.defaultWidth
      })
      return { ...prev, columnWidths: newWidths }
    })
  }, [columns])

  const activeColumns = useMemo(() => {
    const visibleCols = columns.filter((col) => !layout.hiddenColumns.includes(col.id))

    visibleCols.sort((a, b) => {
      const indexA = layout.columnOrder.indexOf(a.id)
      const indexB = layout.columnOrder.indexOf(b.id)
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
    })

    const leftPinned = visibleCols.filter((col) => layout.pinnedColumns[col.id] === 'left')
    const unpinned = visibleCols.filter(
      (col) => !layout.pinnedColumns[col.id] || layout.pinnedColumns[col.id] === 'none'
    )
    const rightPinned = visibleCols.filter((col) => layout.pinnedColumns[col.id] === 'right')

    return [...leftPinned, ...unpinned, ...rightPinned]
  }, [columns, layout.hiddenColumns, layout.columnOrder, layout.pinnedColumns])

  return {
    layout,
    activeColumns,
    setColumnWidth,
    toggleColumnVisibility,
    setColumnPin,
    moveColumn,
    resetLayout,
    autoFitAll,
  }
}
