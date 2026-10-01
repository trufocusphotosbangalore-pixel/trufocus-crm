export type ColumnPin = 'left' | 'right' | 'none'

export interface ColumnDef {
  id: string
  label: string
  defaultWidth: number
  minWidth?: number
  maxWidth?: number
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  pin?: ColumnPin
  defaultVisible?: boolean
}

export interface TableLayoutState {
  columnWidths: Record<string, number>
  columnOrder: string[]
  hiddenColumns: string[]
  pinnedColumns: Record<string, ColumnPin>
}
