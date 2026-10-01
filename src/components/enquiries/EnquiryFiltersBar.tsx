import { useRef } from 'react'
import {
  Search, Filter, Download, Upload, X, ChevronDown, RotateCcw, SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import {
  ENQUIRY_STATUS_LABELS,
  ENQUIRY_SOURCE_LABELS,
  EVENT_TYPE_LABELS,
} from '@/types/enquiries'
import type {
  EnquiryFilters, EnquiryStatus, EnquirySource, EventType,
} from '@/types/enquiries'
import * as enquiryService from '@/services/supabase/enquiries'
import type { Enquiry } from '@/types/enquiries'

// ─── Simple Select ────────────────────────────────────────────────────────────

interface SelectProps {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
}

function FilterSelect({ value, onChange, options, placeholder, className }: SelectProps) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-9 w-full rounded-[var(--radius-md)] text-sm appearance-none',
          'bg-[var(--color-bg-card)] text-[var(--color-text-primary)]',
          'border border-[var(--color-border-default)] pl-3 pr-8',
          'focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]',
          'transition-colors duration-150 cursor-pointer',
          !value && 'text-[var(--color-text-muted)]'
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
      />
    </div>
  )
}

// ─── Date Range Dropdown ──────────────────────────────────────────────────────

const DATE_OPTIONS = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
]

// ─── Main Component ───────────────────────────────────────────────────────────

interface EnquiryFiltersBarProps {
  filters: EnquiryFilters
  onFiltersChange: (partial: Partial<EnquiryFilters>) => void
  onReset: () => void
  onNewEnquiry: () => void
  onImport: (file: File) => void
  allEnquiries: Enquiry[]
  totalCount: number
  onOpenColumnSettings?: () => void
}

export function EnquiryFiltersBar({
  filters,
  onFiltersChange,
  onReset,
  onNewEnquiry,
  onImport,
  allEnquiries,
  totalCount,
  onOpenColumnSettings,
}: EnquiryFiltersBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasActiveFilters =
    filters.search ||
    filters.status !== 'all' ||
    filters.source !== 'all' ||
    filters.event_type !== 'all' ||
    filters.date_range !== 'all'

  const handleExport = () => {
    const csv = enquiryService.exportToCSV(allEnquiries)
    const date = new Date().toISOString().split('T')[0]
    enquiryService.downloadCSV(csv, `trufocus-enquiries-${date}.csv`)
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onImport(file)
    e.target.value = ''
  }

  const statusOptions = Object.entries(ENQUIRY_STATUS_LABELS).map(([value, label]) => ({
    value, label,
  }))

  const sourceOptions = Object.entries(ENQUIRY_SOURCE_LABELS).map(([value, label]) => ({
    value, label,
  }))

  const eventTypeOptions = Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({
    value, label,
  }))

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Filters + Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="search"
            placeholder="Search name, mobile, event, location..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className={cn(
              'w-full h-9 pl-9 pr-4 text-sm rounded-[var(--radius-md)]',
              'bg-[var(--color-bg-card)] text-[var(--color-text-primary)]',
              'border border-[var(--color-border-default)]',
              'placeholder:text-[var(--color-text-muted)]',
              'focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]',
              'transition-colors duration-150'
            )}
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status */}
        <FilterSelect
          value={filters.status === 'all' ? '' : filters.status}
          onChange={(v) => onFiltersChange({ status: (v || 'all') as EnquiryStatus | 'all' })}
          options={statusOptions}
          placeholder="All Status"
          className="w-44"
        />

        {/* Source */}
        <FilterSelect
          value={filters.source === 'all' ? '' : filters.source}
          onChange={(v) => onFiltersChange({ source: (v || 'all') as EnquirySource | 'all' })}
          options={sourceOptions}
          placeholder="All Sources"
          className="w-40"
        />

        {/* Event Type */}
        <FilterSelect
          value={filters.event_type === 'all' ? '' : filters.event_type}
          onChange={(v) => onFiltersChange({ event_type: (v || 'all') as EventType | 'all' })}
          options={eventTypeOptions}
          placeholder="All Events"
          className="w-40"
        />

        {/* Date Range */}
        <FilterSelect
          value={filters.date_range}
          onChange={(v) => onFiltersChange({ date_range: v as EnquiryFilters['date_range'] })}
          options={DATE_OPTIONS}
          className="w-36"
        />

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className={cn(
              'h-9 px-3 flex items-center gap-1.5 rounded-[var(--radius-md)] text-sm',
              'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
              'border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)]',
              'transition-colors duration-150'
            )}
            title="Reset filters"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Columns Settings Button */}
        {onOpenColumnSettings && (
          <button
            onClick={onOpenColumnSettings}
            className={cn(
              'h-9 px-3 flex items-center gap-1.5 rounded-[var(--radius-md)] text-xs font-bold',
              'text-[#5B3FD9] border border-[#5B3FD9]/30 bg-[#5B3FD9]/5 hover:bg-[#5B3FD9]/15',
              'transition-colors duration-150 shrink-0'
            )}
            title="Configure Table Columns"
          >
            <SlidersHorizontal size={14} />
            <span>Columns</span>
          </button>
        )}

        {/* Import */}
        <button
          onClick={handleImportClick}
          className={cn(
            'h-9 px-3 flex items-center gap-2 rounded-[var(--radius-md)] text-sm',
            'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            'border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]',
            'bg-[var(--color-bg-card)] transition-colors duration-150'
          )}
          title="Import CSV"
        >
          <Upload size={14} />
          <span className="hidden sm:inline">Import</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={totalCount === 0}
          className={cn(
            'h-9 px-3 flex items-center gap-2 rounded-[var(--radius-md)] text-sm',
            'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            'border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]',
            'bg-[var(--color-bg-card)] transition-colors duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
          title="Export to CSV"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* New Enquiry */}
        <Button
          onClick={onNewEnquiry}
          leftIcon={<Filter size={14} />}
          size="md"
          id="new-enquiry-btn"
          className="shrink-0"
        >
          + New Enquiry
        </Button>
      </div>

      {/* Custom Date Range */}
      {filters.date_range === 'custom' && (
        <div className="flex gap-2 items-center">
          <span className="text-sm text-[var(--color-text-muted)]">From</span>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => onFiltersChange({ date_from: e.target.value })}
            className={cn(
              'h-9 px-3 rounded-[var(--radius-md)] text-sm',
              'bg-[var(--color-bg-card)] text-[var(--color-text-primary)]',
              'border border-[var(--color-border-default)]',
              'focus:outline-none focus:border-[var(--color-primary)]'
            )}
          />
          <span className="text-sm text-[var(--color-text-muted)]">To</span>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => onFiltersChange({ date_to: e.target.value })}
            className={cn(
              'h-9 px-3 rounded-[var(--radius-md)] text-sm',
              'bg-[var(--color-bg-card)] text-[var(--color-text-primary)]',
              'border border-[var(--color-border-default)]',
              'focus:outline-none focus:border-[var(--color-primary)]'
            )}
          />
        </div>
      )}

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-[var(--color-text-muted)]">Active filters:</span>
          {filters.status !== 'all' && (
            <FilterPill
              label={`Status: ${ENQUIRY_STATUS_LABELS[filters.status as EnquiryStatus]}`}
              onRemove={() => onFiltersChange({ status: 'all' })}
            />
          )}
          {filters.source !== 'all' && (
            <FilterPill
              label={`Source: ${ENQUIRY_SOURCE_LABELS[filters.source as EnquirySource]}`}
              onRemove={() => onFiltersChange({ source: 'all' })}
            />
          )}
          {filters.event_type !== 'all' && (
            <FilterPill
              label={`Event: ${EVENT_TYPE_LABELS[filters.event_type as EventType]}`}
              onRemove={() => onFiltersChange({ event_type: 'all' })}
            />
          )}
          {filters.date_range !== 'all' && (
            <FilterPill
              label={`Date: ${DATE_OPTIONS.find((d) => d.value === filters.date_range)?.label}`}
              onRemove={() => onFiltersChange({ date_range: 'all' })}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────

function FilterPill({ label, onRemove }: { label?: string; onRemove: () => void }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs',
        'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
      )}
    >
      {label}
      <button
        onClick={onRemove}
        className="hover:text-white transition-colors"
      >
        <X size={11} />
      </button>
    </span>
  )
}
