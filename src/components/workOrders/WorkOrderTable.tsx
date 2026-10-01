import { ClipboardList } from 'lucide-react'
import { cn } from '@/utils/cn'
import { WOStatusBadge, PaymentStatusBadge, ContractStatusBadge, ProgressBar } from './WorkOrderBadges'
import { getWorkOrderComputedStatus } from '@/utils/workOrderStatusEngine'
import { WorkOrderRowActions } from './WorkOrderRowActions'
import { RowSkeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils'
import { EVENT_TYPE_LABELS } from '@/types/enquiries'
import type { WorkOrder } from '@/types/workOrders'
import type { SortConfig } from '@/types/common'

// Data Grid Engine
import { useTableLayout } from '@/components/common/datagrid/useTableLayout'
import { ResizableHeaderCell } from '@/components/common/datagrid/ResizableHeaderCell'
import { ColumnSettingsDrawer } from '@/components/common/datagrid/ColumnSettingsDrawer'
import type { ColumnDef } from '@/components/common/datagrid/types'

const WORK_ORDER_GRID_COLUMNS: ColumnDef[] = [
  { id: 'work_order_number', label: 'WO No.',      defaultWidth: 100, minWidth: 70,  sortable: false },
  { id: 'project_name',      label: 'Project',      defaultWidth: 180, minWidth: 110, sortable: true },
  { id: 'customer_name',     label: 'Customer',     defaultWidth: 160, minWidth: 100, sortable: true },
  { id: 'event_type',        label: 'Event',        defaultWidth: 120, minWidth: 80,  sortable: false },
  { id: 'city',              label: 'City',         defaultWidth: 110, minWidth: 70,  sortable: false },
  { id: 'team',              label: 'Team',         defaultWidth: 110, minWidth: 70,  sortable: false },
  { id: 'status',            label: 'Status',       defaultWidth: 140, minWidth: 90,  sortable: true },
  { id: 'progress_percent',  label: 'Progress',     defaultWidth: 130, minWidth: 80,  sortable: false },
  { id: 'payment_status',    label: 'Payment',      defaultWidth: 130, minWidth: 80,  sortable: false },
  { id: 'contract_status',   label: 'Contract',     defaultWidth: 110, minWidth: 70,  sortable: false },
  { id: 'actions',           label: 'Actions',      defaultWidth: 110, minWidth: 80,  sortable: false, align: 'center' },
]

function EmptyState({ hasFilters, onNew }: { hasFilters: boolean; onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="size-16 rounded-[var(--radius-xl)] bg-[var(--color-primary-light)] flex items-center justify-center mb-5">
        <ClipboardList size={28} className="text-[var(--color-primary)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
        {hasFilters ? 'No work orders found' : 'No work orders yet'}
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] max-w-xs mb-5">
        {hasFilters ? 'Try adjusting or resetting your filters.' : 'Convert confirmed enquiries into work orders to get started.'}
      </p>
      {!hasFilters && (
        <button onClick={onNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors">
          <ClipboardList size={14} />+ New Work Order
        </button>
      )}
    </div>
  )
}

function Pagination({ page, pageSize, total, totalPages, onPage, onPageSize }: {
  page: number; pageSize: number; total: number; totalPages: number
  onPage: (p: number) => void; onPageSize: (s: number) => void
}) {
  const start = Math.min((page - 1) * pageSize + 1, total)
  const end = Math.min(page * pageSize, total)
  return (
    <div className="flex items-center justify-between px-1 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--color-text-muted)]">Rows:</span>
        <select value={pageSize} onChange={e => onPageSize(Number(e.target.value))}
          className="h-8 px-2 rounded-[var(--radius-md)] text-sm bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] focus:outline-none focus:border-[var(--color-primary)]">
          {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <span className="text-sm text-[var(--color-text-muted)]">{total === 0 ? '0' : `${start}–${end}`} of {total}</span>
      <div className="flex items-center gap-1">
        {[{ label: '«', fn: () => onPage(1) }, { label: '‹', fn: () => onPage(page - 1) }].map((b, i) => (
          <button key={i} onClick={b.fn} disabled={page === 1}
            className="size-8 rounded-[var(--radius-md)] text-sm flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-30 disabled:cursor-not-allowed">
            {b.label}
          </button>
        ))}
        <span className="px-3 text-sm text-[var(--color-text-primary)] font-medium">{page} / {totalPages || 1}</span>
        {[{ label: '›', fn: () => onPage(page + 1) }, { label: '»', fn: () => onPage(totalPages) }].map((b, i) => (
          <button key={i} onClick={b.fn} disabled={page >= totalPages}
            className="size-8 rounded-[var(--radius-md)] text-sm flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-30 disabled:cursor-not-allowed">
            {b.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export interface WorkOrderTableProps {
  workOrders: WorkOrder[]
  isLoading: boolean
  sort: SortConfig
  page: number; pageSize: number; total: number; totalPages: number
  hasFilters: boolean
  showColumnDrawer?: boolean
  onCloseColumnDrawer?: () => void
  onSort: (s: SortConfig) => void
  onPage: (p: number) => void; onPageSize: (s: number) => void
  onView: (w: WorkOrder) => void; onEdit: (w: WorkOrder) => void
  onDelete: (id: string) => void; onNew: () => void
  onSharePortal?: (w: WorkOrder) => void
}

export function WorkOrderTable({
  workOrders, isLoading, sort, page, pageSize, total, totalPages, hasFilters,
  showColumnDrawer, onCloseColumnDrawer,
  onSort, onPage, onPageSize, onView, onEdit, onDelete, onNew, onSharePortal,
}: WorkOrderTableProps) {
  const {
    layout,
    activeColumns,
    setColumnWidth,
    toggleColumnVisibility,
    setColumnPin,
    moveColumn,
    resetLayout,
    autoFitAll,
  } = useTableLayout('work_orders', WORK_ORDER_GRID_COLUMNS)

  const handleSort = (key: string) =>
    onSort({ field: key, direction: sort.field === key && sort.direction === 'asc' ? 'desc' : 'asc' })

  const renderCellContent = (colId: string, wo: WorkOrder) => {
    switch (colId) {
      case 'work_order_number':
        return (
          <a
            href={`/work-orders/${wo.id}`}
            title="View Work Order details"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                e.preventDefault()
                onView(wo)
              }
            }}
            className="text-xs font-mono font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 hover:bg-[#5B3FD9]/20 hover:text-[#4C34C3] hover:underline px-2 py-0.5 rounded cursor-pointer transition-colors inline-block"
          >
            {wo.work_order_number}
          </a>
        )
      case 'project_name':
        return (
          <div>
            <a
              href={`/work-orders/${wo.id}`}
              title="View Work Order details"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                  e.preventDefault()
                  onView(wo)
                }
              }}
              className="font-bold text-xs text-[#111827] hover:text-[#5B3FD9] hover:underline truncate max-w-[160px] block cursor-pointer"
            >
              {wo.project_name}
            </a>
            {wo.booking_date && <div className="text-[10px] text-gray-400 mt-0.5 font-medium">Booked: {formatDate(wo.booking_date)}</div>}
          </div>
        )
      case 'customer_name':
        return (
          <div>
            <div className="text-xs font-bold text-[#111827] truncate max-w-[140px]">{wo.customer_name}</div>
            <div className="text-[10px] text-gray-400 font-mono">{wo.mobile}</div>
          </div>
        )
      case 'event_type':
        return (
          <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
            {EVENT_TYPE_LABELS[wo.event_type as keyof typeof EVENT_TYPE_LABELS] ?? wo.event_type}
          </span>
        )
      case 'city':
        return <span className="text-xs text-gray-600 font-medium">{wo.city ?? '—'}</span>
      case 'team': {
        const assignedMembers = (wo.events || []).flatMap(e => (e.services || []).flatMap(s => s.assigned_team || []))
        if (assignedMembers.length === 0) return <span className="text-xs text-gray-400 italic">Unassigned</span>
        return (
          <div className="flex -space-x-2">
            {assignedMembers.slice(0, 3).map((m, i) => (
              <div key={i} title={m.employee_name}
                className="size-6 rounded-full bg-[#5B3FD9]/10 border border-white flex items-center justify-center text-[10px] font-bold text-[#5B3FD9]">
                {m.employee_name[0].toUpperCase()}
              </div>
            ))}
            {assignedMembers.length > 3 && (
              <div className="size-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[10px] text-gray-500 font-bold">
                +{assignedMembers.length - 3}
              </div>
            )}
          </div>
        )
      }
      case 'status':
        return <WOStatusBadge status={getWorkOrderComputedStatus(wo)} />
      case 'progress_percent':
        return <ProgressBar value={wo.progress_percent} />
      case 'payment_status':
        return <PaymentStatusBadge status={wo.payment_status} />
      case 'contract_status':
        return <ContractStatusBadge status={wo.contract_status} />
      case 'actions':
        return <WorkOrderRowActions wo={wo} onView={onView} onEdit={onEdit} onDelete={onDelete} onSharePortal={onSharePortal} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* ─── Mobile Card List View (< md) ─── */}
      <div className="md:hidden space-y-3 p-1">
        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}

        {!isLoading && workOrders.map((wo) => (
          <div
            key={wo.id}
            onClick={() => onView(wo)}
            className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-3 cursor-pointer hover:border-[#5B3FD9] transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-[#5B3FD9] bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                  #{wo.work_order_number}
                </span>
                <h4 className="text-xs font-extrabold text-[#111827] truncate max-w-[160px]">
                  {wo.project_name}
                </h4>
              </div>
              <WOStatusBadge status={getWorkOrderComputedStatus(wo)} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 font-medium pt-1 border-t border-gray-100">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-mono block">Customer</span>
                <span className="font-bold text-[#111827] truncate block">{wo.customer_name}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-mono block">Event</span>
                <span className="font-bold text-[#111827] truncate block">{EVENT_TYPE_LABELS[wo.event_type as keyof typeof EVENT_TYPE_LABELS] || wo.event_type}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <PaymentStatusBadge status={wo.payment_status} />
              <div className="w-28">
                <ProgressBar value={wo.progress_percent} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <WorkOrderRowActions wo={wo} onView={onView} onEdit={onEdit} onDelete={onDelete} onSharePortal={onSharePortal} />
            </div>
          </div>
        ))}

        {!isLoading && workOrders.length === 0 && (
          <EmptyState hasFilters={hasFilters} onNew={onNew} />
        )}
      </div>

      {/* ─── Desktop Table View (≥ md) ─── */}
      <div className="hidden md:block overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse table-auto lg:table-fixed">
          <thead className="sticky top-0 z-10 bg-[#FAFAFC] border-b border-[#E5E7EB]">
            <tr>
              {activeColumns.map(col => (
                <ResizableHeaderCell
                  key={col.id}
                  column={col}
                  width={layout.columnWidths[col.id] || col.defaultWidth}
                  pin={layout.pinnedColumns[col.id] || 'none'}
                  sort={sort}
                  onSort={handleSort}
                  onResize={setColumnWidth}
                  onHide={toggleColumnVisibility}
                  onPin={setColumnPin}
                  onResetWidth={(id) => setColumnWidth(id, col.defaultWidth)}
                />
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E5E7EB]">
            {isLoading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-[#E5E7EB]">
                <td colSpan={activeColumns.length}><RowSkeleton cols={activeColumns.length} /></td>
              </tr>
            ))}
            {!isLoading && workOrders.map(wo => (
              <tr
                key={wo.id}
                onDoubleClick={() => onView(wo)}
                title="Double-click to view Work Order"
                className="border-b border-[#E5E7EB] bg-white hover:bg-gray-50/80 transition-colors duration-100 group text-xs cursor-default"
              >
                {activeColumns.map((col) => {
                  const isPinned = layout.pinnedColumns[col.id]
                  return (
                    <td
                      key={col.id}
                      style={{ width: `${layout.columnWidths[col.id] || col.defaultWidth}px` }}
                      className={cn(
                        'px-2.5 py-2.5',
                        isPinned === 'left' && 'sticky left-0 bg-white z-10 shadow-r',
                        isPinned === 'right' && 'sticky right-0 bg-white z-10 shadow-l',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center'
                      )}
                    >
                      {renderCellContent(col.id, wo)}
                    </td>
                  )
                })}
              </tr>
            ))}
            {!isLoading && workOrders.length === 0 && (
              <tr><td colSpan={activeColumns.length}><EmptyState hasFilters={hasFilters} onNew={onNew} /></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && total > 0 && (
        <div className="border-t border-[var(--color-border-subtle)] px-2">
          <Pagination page={page} pageSize={pageSize} total={total} totalPages={totalPages} onPage={onPage} onPageSize={onPageSize} />
        </div>
      )}

      {/* Column Settings Drawer */}
      {showColumnDrawer && onCloseColumnDrawer && (
        <ColumnSettingsDrawer
          isOpen={showColumnDrawer}
          columns={WORK_ORDER_GRID_COLUMNS}
          layout={layout}
          onClose={onCloseColumnDrawer}
          onToggleVisibility={toggleColumnVisibility}
          onPinColumn={setColumnPin}
          onMoveColumn={moveColumn}
          onResetLayout={resetLayout}
          onAutoFitAll={autoFitAll}
        />
      )}
    </div>
  )
}
