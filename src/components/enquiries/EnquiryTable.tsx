import { MessageSquarePlus, FileText, Sparkles } from 'lucide-react'
import { cn } from '@/utils/cn'
import { EnquiryStatusBadge } from './EnquiryStatusBadge'
import { EnquiryRowActions } from './EnquiryRowActions'
import { RowSkeleton } from '@/components/ui/Skeleton'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ENQUIRY_SOURCE_LABELS, EVENT_TYPE_LABELS } from '@/types/enquiries'
import type { Enquiry } from '@/types/enquiries'
import type { SortConfig } from '@/types/common'

// Data Grid Engine
import { useTableLayout } from '@/components/common/datagrid/useTableLayout'
import { ResizableHeaderCell } from '@/components/common/datagrid/ResizableHeaderCell'
import { ColumnSettingsDrawer } from '@/components/common/datagrid/ColumnSettingsDrawer'
import type { ColumnDef } from '@/components/common/datagrid/types'

const ENQUIRY_GRID_COLUMNS: ColumnDef[] = [
  { id: 'created_at',     label: 'RECEIVED',    defaultWidth: 95,  minWidth: 70,  sortable: true },
  { id: 'enquiry_number', label: '#',           defaultWidth: 90,  minWidth: 60,  sortable: false },
  { id: 'customer_name',  label: 'CUSTOMER',    defaultWidth: 200, minWidth: 120, sortable: true },
  { id: 'mobile',         label: 'MOBILE',      defaultWidth: 130, minWidth: 100, sortable: false },
  { id: 'event_type',     label: 'EVENT',       defaultWidth: 120, minWidth: 90,  sortable: false },
  { id: 'event_date',     label: 'EVENT DATE',  defaultWidth: 110, minWidth: 80,  sortable: true },
  { id: 'budget',         label: 'BUDGET',      defaultWidth: 110, minWidth: 80,  sortable: false, align: 'right' },
  { id: 'quotation',      label: 'QUOTATION',   defaultWidth: 150, minWidth: 110, sortable: false, align: 'center' },
  { id: 'status',         label: 'STATUS',      defaultWidth: 130, minWidth: 90,  sortable: true },
  { id: 'actions',        label: 'ACTIONS',     defaultWidth: 100, minWidth: 80,  sortable: false, align: 'center' },
]

function EmptyState({
  hasFilters,
  onNew,
  onCreateQuotation,
}: {
  hasFilters: boolean
  onNew: () => void
  onCreateQuotation?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="size-16 rounded-[var(--radius-xl)] bg-[var(--color-primary-light)] flex items-center justify-center mb-5">
        <MessageSquarePlus size={28} className="text-[var(--color-primary)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
        {hasFilters ? 'No enquiries found' : 'No enquiries yet'}
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] max-w-xs mb-5">
        {hasFilters
          ? 'No enquiries match your current filters. Try adjusting or resetting them.'
          : 'Start capturing customer enquiries and track them through to conversion.'}
      </p>
      {!hasFilters && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={onNew}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium',
              'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
              'transition-colors duration-150 cursor-pointer'
            )}
          >
            <MessageSquarePlus size={14} />
            + New Enquiry
          </button>
          {onCreateQuotation && (
            <button
              onClick={onCreateQuotation}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#5B3FD9]/10 text-[#5B3FD9] border border-[#5B3FD9]/30 hover:bg-[#5B3FD9] hover:text-white transition-all cursor-pointer"
            >
              <FileText size={14} />
              + Create Event Quotation
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPage,
  onPageSize,
}: {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPage: (p: number) => void
  onPageSize: (s: number) => void
}) {
  const start = Math.min((page - 1) * pageSize + 1, total)
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--color-text-muted)]">Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className={cn(
            'h-8 px-2 rounded-[var(--radius-md)] text-sm',
            'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]',
            'border border-[var(--color-border-default)]',
            'focus:outline-none focus:border-[var(--color-primary)]'
          )}
        >
          {[10, 25, 50, 100].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <span className="text-sm text-[var(--color-text-muted)]">
        {total === 0 ? '0' : `${start}–${end}`} of {total}
      </span>

      <div className="flex items-center gap-1">
        {[
          { label: '«', fn: () => onPage(1), disabled: page === 1, title: 'First page' },
          { label: '‹', fn: () => onPage(page - 1), disabled: page === 1, title: 'Previous page' },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.fn}
            disabled={btn.disabled}
            title={btn.title}
            className={cn(
              'size-8 rounded-[var(--radius-md)] text-sm flex items-center justify-center',
              'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]',
              'disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
            )}
          >
            {btn.label}
          </button>
        ))}

        <span className="px-3 text-sm text-[var(--color-text-primary)] font-medium">
          {page} / {totalPages || 1}
        </span>

        {[
          { label: '›', fn: () => onPage(page + 1), disabled: page >= totalPages, title: 'Next page' },
          { label: '»', fn: () => onPage(totalPages), disabled: page >= totalPages, title: 'Last page' },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.fn}
            disabled={btn.disabled}
            title={btn.title}
            className={cn(
              'size-8 rounded-[var(--radius-md)] text-sm flex items-center justify-center',
              'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]',
              'disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
            )}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export interface EnquiryTableProps {
  enquiries: Enquiry[]
  isLoading: boolean
  sort: SortConfig
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasFilters: boolean
  showColumnDrawer?: boolean
  onCloseColumnDrawer?: () => void
  onSort: (sort: SortConfig) => void
  onPage: (p: number) => void
  onPageSize: (s: number) => void
  onView: (e: Enquiry) => void
  onEdit: (e: Enquiry) => void
  onDelete: (id: string) => void
  onNew: () => void
  onStatusChange?: (id: string, newStatus: Enquiry['status']) => void
  onConvertToWorkOrder?: (e: Enquiry) => void
  onCreateQuotation?: (e: Enquiry) => void
}

export function EnquiryTable({
  enquiries,
  isLoading,
  sort,
  page,
  pageSize,
  total,
  totalPages,
  hasFilters,
  showColumnDrawer,
  onCloseColumnDrawer,
  onSort,
  onPage,
  onPageSize,
  onView,
  onEdit,
  onDelete,
  onNew,
  onStatusChange,
  onConvertToWorkOrder,
  onCreateQuotation,
}: EnquiryTableProps) {
  const {
    layout,
    activeColumns,
    setColumnWidth,
    toggleColumnVisibility,
    setColumnPin,
    moveColumn,
    resetLayout,
    autoFitAll,
  } = useTableLayout('enquiries', ENQUIRY_GRID_COLUMNS)

  const handleSort = (key: string) => {
    if (sort.field === key) {
      onSort({ field: key, direction: sort.direction === 'asc' ? 'desc' : 'asc' })
    } else {
      onSort({ field: key, direction: 'asc' })
    }
  }

  const renderCellContent = (colId: string, enquiry: Enquiry) => {
    switch (colId) {
      case 'created_at':
        return (
          <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">
            {new Date(enquiry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        )
      case 'enquiry_number':
        return (
          <span className="text-[11px] font-mono text-[#5B3FD9] bg-[#5B3FD9]/10 px-1.5 py-0.5 rounded font-bold">
            {enquiry.enquiry_number}
          </span>
        )
      case 'customer_name':
        return (
          <div>
            <div className="font-bold text-xs text-[#111827] truncate max-w-[200px]" title={enquiry.customer_name}>
              {enquiry.customer_name}
            </div>
            {enquiry.email ? (
              <div className="text-[10px] text-gray-400 truncate max-w-[200px] mt-0.5 font-medium" title={enquiry.email}>
                {enquiry.email}
              </div>
            ) : (
              <div className="text-[10px] text-gray-300 italic">No email</div>
            )}
          </div>
        )
      case 'mobile':
        return (
          <a href={`tel:${enquiry.mobile}`} className="text-xs text-gray-700 font-mono font-medium hover:text-[#5B3FD9]">
            {enquiry.mobile}
          </a>
        )
      case 'event_type':
        return (
          <span className="text-xs font-semibold text-[#111827] whitespace-nowrap">
            {EVENT_TYPE_LABELS[enquiry.event_type] ?? enquiry.event_type}
          </span>
        )
      case 'event_date':
        return (
          <span className="text-xs text-gray-600 font-medium">
            {enquiry.event_date ? formatDate(enquiry.event_date) : '—'}
          </span>
        )
      case 'location':
        return (
          <span className="text-xs text-gray-600 truncate max-w-[130px] inline-block font-medium" title={enquiry.location || ''}>
            {enquiry.location || '—'}
          </span>
        )
      case 'source':
        return (
          <span className="text-[11px] text-gray-600 font-medium whitespace-nowrap">
            {ENQUIRY_SOURCE_LABELS[enquiry.source] ?? enquiry.source}
          </span>
        )
      case 'budget':
        return (
          <span className="text-xs font-mono font-bold text-[#111827]">
            {enquiry.budget != null ? formatCurrency(enquiry.budget, 'INR') : '—'}
          </span>
        )
      case 'quotation':
        return (
          <button
            onClick={() => onCreateQuotation ? onCreateQuotation(enquiry) : onView(enquiry)}
            className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-[#5B3FD9]/10 text-[#5B3FD9] hover:bg-[#5B3FD9] hover:text-white transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 mx-auto"
            title="Create or View Event Quotation"
          >
            <FileText size={12} />
            <span>{enquiry.status === 'quotation_sent' || enquiry.status === 'customer_reviewing' || enquiry.status === 'booked' ? 'View Quote' : '+ Create Quote'}</span>
          </button>
        )
      case 'assigned_to':
        return enquiry.assigned_to_name ? (
          <span className="text-xs font-semibold text-[#111827]">{enquiry.assigned_to_name}</span>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 font-medium">Unassigned</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[9px] font-bold">
              New Lead
            </span>
          </div>
        )
      case 'status':
        return onStatusChange ? (
          <select
            value={enquiry.status}
            onChange={(e) => onStatusChange(enquiry.id, e.target.value as any)}
            className={cn(
              'text-[11px] font-bold px-2 py-1 rounded-full border cursor-pointer focus:outline-none transition-all shadow-2xs',
              enquiry.status === 'booked' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
              enquiry.status === 'new' ? 'bg-purple-50 text-purple-700 border-purple-300' :
              enquiry.status === 'contacted' ? 'bg-blue-50 text-blue-700 border-blue-300' :
              enquiry.status === 'quotation_sent' ? 'bg-amber-50 text-amber-700 border-amber-300' :
              enquiry.status === 'customer_reviewing' ? 'bg-orange-50 text-orange-700 border-orange-300' :
              enquiry.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-300' :
              'bg-gray-100 text-gray-700 border-gray-300'
            )}
          >
            <option value="new">New</option>
            <option value="quotation_sent">Proposal Sent</option>
            <option value="customer_reviewing">Revise Proposal</option>
            <option value="contacted">Following Up</option>
            <option value="booked">Booked</option>
            <option value="rejected">Rejected</option>
          </select>
        ) : (
          <EnquiryStatusBadge status={enquiry.status} />
        )
      case 'actions':
        return (
          <div className="flex items-center justify-center">
            <EnquiryRowActions
              enquiry={enquiry}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onConvertToWorkOrder={onConvertToWorkOrder}
              onCreateQuotation={onCreateQuotation}
            />
          </div>
        )
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

        {!isLoading && enquiries.map((enquiry) => (
          <div
            key={enquiry.id}
            onClick={() => onView(enquiry)}
            className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-3 cursor-pointer hover:border-[#5B3FD9] transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-[#5B3FD9] bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                  #{enquiry.enquiry_number}
                </span>
                <h4 className="text-xs font-extrabold text-[#111827] truncate max-w-[160px]">
                  {enquiry.customer_name}
                </h4>
              </div>
              <EnquiryStatusBadge status={enquiry.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 font-medium pt-1 border-t border-gray-100">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-mono block">Mobile</span>
                <span className="font-bold text-[#111827] truncate block">{enquiry.mobile}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-mono block">Event</span>
                <span className="font-bold text-[#111827] truncate block">{EVENT_TYPE_LABELS[enquiry.event_type as keyof typeof EVENT_TYPE_LABELS] || enquiry.event_type}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs font-extrabold text-[#5B3FD9]">{formatCurrency(enquiry.budget || 0)}</span>
              <div onClick={(e) => e.stopPropagation()}>
                <EnquiryRowActions
                  enquiry={enquiry}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onConvertToWorkOrder={onConvertToWorkOrder}
                  onCreateQuotation={onCreateQuotation}
                />
              </div>
            </div>
          </div>
        ))}

        {!isLoading && enquiries.length === 0 && (
          <EmptyState
            hasFilters={hasFilters}
            onNew={onNew}
            onCreateQuotation={onCreateQuotation ? () => onCreateQuotation({} as any) : undefined}
          />
        )}
      </div>

      {/* ─── Desktop Table View (≥ md) ─── */}
      <div className="hidden md:block overflow-x-auto lg:overflow-x-visible flex-1">
        <table className="w-full text-left border-collapse table-auto lg:table-fixed">
          {/* Sticky Resizable Header */}
          <thead className="sticky top-0 z-10 bg-[#FAFAFC] border-b border-[#E5E7EB]">
            <tr>
              {activeColumns.map((col) => (
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

          <tbody className="divide-y divide-[#E5E7EB] bg-white">
            {/* Loading Skeletons */}
            {isLoading && (
              Array.from({ length: pageSize < 10 ? pageSize : 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[#E5E7EB]">
                  <td colSpan={activeColumns.length} className="px-0 py-0">
                    <RowSkeleton cols={activeColumns.length} />
                  </td>
                </tr>
              ))
            )}

            {/* Table Rows */}
            {!isLoading && enquiries.map((enquiry) => (
              <tr
                key={enquiry.id}
                className="hover:bg-gray-50/80 transition-colors duration-100 group cursor-default text-xs"
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
                      {renderCellContent(col.id, enquiry)}
                    </td>
                  )
                })}
              </tr>
            ))}

            {/* Empty state */}
            {!isLoading && enquiries.length === 0 && (
              <tr>
                <td colSpan={activeColumns.length}>
                  <EmptyState
            hasFilters={hasFilters}
            onNew={onNew}
            onCreateQuotation={onCreateQuotation ? () => onCreateQuotation({} as any) : undefined}
          />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && total > 0 && (
        <div className="border-t border-[#E5E7EB] px-4">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPage={onPage}
            onPageSize={onPageSize}
          />
        </div>
      )}

      {/* Column Settings Drawer */}
      {showColumnDrawer && onCloseColumnDrawer && (
        <ColumnSettingsDrawer
          isOpen={showColumnDrawer}
          columns={ENQUIRY_GRID_COLUMNS}
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
