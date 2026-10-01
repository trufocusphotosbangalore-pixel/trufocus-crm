import { useRef } from 'react'
import { Search, Download, Upload, X, ChevronDown, RotateCcw } from 'lucide-react'
import { cn } from '@/utils/cn'
import { PAYMENT_STATUS_LABELS } from '@/types/workOrders'
import { EVENT_TYPE_LABELS } from '@/types/enquiries'
import type { WorkOrderFilters, PaymentStatus } from '@/types/workOrders'
import type { EventType } from '@/types/enquiries'
import type { DashboardStatusCounts } from '@/utils/workOrderStatusEngine'

function FilterSelect({ value, onChange, options, placeholder, className }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string; className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <select value={value} onChange={e => onChange(e.target.value)}
        className={cn('h-9 w-full rounded-xl text-xs font-bold appearance-none cursor-pointer',
          'bg-white text-gray-900',
          'border border-gray-200 pl-3 pr-8 shadow-2xs',
          'focus:outline-none focus:border-[#5B3FD9] focus:ring-2 focus:ring-purple-100',
          !value && 'text-gray-400')}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}

function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-[#5B3FD9] border border-purple-200">
      {label}
      <button onClick={onRemove} className="hover:text-purple-900 cursor-pointer">
        <X size={12} />
      </button>
    </span>
  )
}

interface WorkOrderFiltersBarProps {
  filters: WorkOrderFilters
  onChange: (f: Partial<WorkOrderFilters>) => void
  onReset: () => void
  onImport: () => void
  onExport: () => void
  totalCount: number
  statusCounts?: DashboardStatusCounts
}

export function WorkOrderFiltersBar({ filters, onChange, onReset, onImport, onExport, totalCount, statusCounts }: WorkOrderFiltersBarProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const hasActive = filters.search || (filters.status && filters.status !== 'all') || filters.event_type !== 'all' || filters.payment_status !== 'all' || filters.date_range !== 'all'

  const counts = statusCounts || {
    all: totalCount,
    upcoming: 0,
    todays_shoot: 0,
    ongoing: 0,
    editing: 0,
    completed: 0,
    cancelled: 0,
  }

  const computedStatusOptions = [
    { value: 'all', label: `All Work Orders (${counts.all})` },
    { value: 'upcoming', label: `Upcoming (${counts.upcoming})` },
    { value: 'todays_shoot', label: `Today's Shoot (${counts.todays_shoot})` },
    { value: 'ongoing', label: `Ongoing (${counts.ongoing})` },
    { value: 'editing', label: `Editing (${counts.editing})` },
    { value: 'completed', label: `Completed (${counts.completed})` },
    { value: 'cancelled', label: `Cancelled (${counts.cancelled})` },
  ]

  const eventTypeOptions = Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))
  const paymentOptions = Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))
  const dateOptions = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
  ]

  const chips = [
    { key: 'all', label: 'All Work Orders', count: counts.all, color: 'bg-slate-100 text-gray-800 border-gray-200 hover:bg-slate-200' },
    { key: 'upcoming', label: 'Upcoming', count: counts.upcoming, color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' },
    { key: 'todays_shoot', label: "Today's Shoot", count: counts.todays_shoot, color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' },
    { key: 'ongoing', label: 'Ongoing', count: counts.ongoing, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    { key: 'editing', label: 'Editing', count: counts.editing, color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
    { key: 'completed', label: 'Completed', count: counts.completed, color: 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200' },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled, color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
  ]

  return (
    <div className="space-y-3">
      {/* ── Quick Filter Chips ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {chips.map((chip) => {
          const isActive = (filters.status || 'all') === chip.key
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChange({ status: chip.key as any })}
              className={cn(
                'px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0',
                chip.color,
                isActive ? 'ring-2 ring-[#5B3FD9] font-black shadow-xs' : 'opacity-80 hover:opacity-100'
              )}
            >
              <span>{chip.label}</span>
              <span className="px-1.5 py-0.2 bg-black/10 rounded-md text-[10px] font-extrabold">{chip.count}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search WO number, customer, mobile, event..."
            value={filters.search}
            onChange={e => onChange({ search: e.target.value })}
            className={cn('w-full h-9 pl-9 pr-4 text-xs font-medium rounded-xl',
              'bg-white text-gray-900 shadow-2xs',
              'border border-gray-200 placeholder:text-gray-400',
              'focus:outline-none focus:border-[#5B3FD9] focus:ring-2 focus:ring-purple-100')}
          />
          {filters.search && (
            <button onClick={() => onChange({ search: '' })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <X size={13} />
            </button>
          )}
        </div>

        <FilterSelect
          value={filters.status || 'all'}
          onChange={v => onChange({ status: (v || 'all') as any })}
          options={computedStatusOptions}
          placeholder="Status Filter"
          className="w-48"
        />
        <FilterSelect
          value={filters.event_type === 'all' ? '' : filters.event_type}
          onChange={v => onChange({ event_type: (v || 'all') as EventType | 'all' })}
          options={eventTypeOptions}
          placeholder="All Events"
          className="w-36"
        />
        <FilterSelect
          value={filters.payment_status === 'all' ? '' : filters.payment_status}
          onChange={v => onChange({ payment_status: (v || 'all') as PaymentStatus | 'all' })}
          options={paymentOptions}
          placeholder="Payment"
          className="w-36"
        />
        <FilterSelect
          value={filters.date_range}
          onChange={v => onChange({ date_range: v as WorkOrderFilters['date_range'] })}
          options={dateOptions}
          className="w-32"
        />

        {hasActive && (
          <button onClick={onReset} title="Reset Filters" className="h-9 px-3 flex items-center gap-1.5 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
            <RotateCcw size={13} /><span className="hidden sm:inline">Reset</span>
          </button>
        )}

        <div className="flex-1" />

        <button onClick={onImport} className="h-9 px-3 flex items-center gap-2 rounded-xl text-xs font-bold text-gray-700 hover:text-gray-900 border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
          <Upload size={13} /><span className="hidden sm:inline">Import</span>
        </button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={() => {}} />
        <button onClick={onExport} disabled={totalCount === 0} className="h-9 px-3 flex items-center gap-2 rounded-xl text-xs font-bold text-gray-700 hover:text-gray-900 border border-gray-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
          <Download size={13} /><span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Active filter pills */}
      {hasActive && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-gray-500 font-bold">Active Filters:</span>
          {filters.status && filters.status !== 'all' && (
            <Pill label={`Status: ${filters.status.replace('_', ' ').toUpperCase()}`} onRemove={() => onChange({ status: 'all' })} />
          )}
          {filters.event_type !== 'all' && <Pill label={`Event: ${EVENT_TYPE_LABELS[filters.event_type as EventType]}`} onRemove={() => onChange({ event_type: 'all' })} />}
          {filters.payment_status !== 'all' && <Pill label={`Payment: ${PAYMENT_STATUS_LABELS[filters.payment_status as PaymentStatus]}`} onRemove={() => onChange({ payment_status: 'all' })} />}
        </div>
      )}
    </div>
  )
}
