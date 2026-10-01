import { useState, useMemo } from 'react'
import {
  Search, HardDrive, RotateCcw, CheckCircle2, Clock, AlertCircle, Layers,
} from 'lucide-react'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { getWorkOrderDataGroups } from '@/services/dataStorageStore'
import { wipeAllCRMDataToClean } from '@/services/supabase/workOrders'
import { WorkOrderDataCard } from '@/components/dataStorage/WorkOrderDataCard'
import type { WorkOrderDataGroup } from '@/types/dataStorage'

export default function DataManagementPage() {
  const [groups, setGroups] = useState<WorkOrderDataGroup[]>(() => getWorkOrderDataGroups())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'issue'>('all')

  // Real-time synchronization
  useRealtimeSync(() => {
    setGroups(getWorkOrderDataGroups())
  })

  const refreshData = () => {
    setGroups(getWorkOrderDataGroups())
  }

  // Summary stats
  const totalWorkOrders = groups.length
  const totalCrewRecords = groups.reduce((sum, g) => sum + g.total_records, 0)
  const totalCompletedRecords = groups.reduce((sum, g) => sum + g.completed_records, 0)
  const totalPendingRecords = Math.max(0, totalCrewRecords - totalCompletedRecords)
  const totalIssuesFound = groups.filter((g) => g.has_issue).length

  // Search & Filtered Groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const query = search.toLowerCase()

      // Search across WO Number, Customer Name, Mobile, Event Type, Crew Member name, Storage Device
      const matchesSearch =
        !search ||
        (g.work_order_number || '').toLowerCase().includes(query) ||
        (g.customer_name || '').toLowerCase().includes(query) ||
        (g.mobile || '').toLowerCase().includes(query) ||
        (g.event_type || '').toLowerCase().includes(query) ||
        g.events.some((evt) =>
          evt.records.some(
            (r) =>
              (r.employee_name || '').toLowerCase().includes(query) ||
              (r.storage_device || '').toLowerCase().includes(query) ||
              (r.memory_card || '').toLowerCase().includes(query) ||
              (r.folder_path || '').toLowerCase().includes(query)
          )
        )

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && g.completed_records === g.total_records) ||
        (statusFilter === 'pending' && g.completed_records < g.total_records) ||
        (statusFilter === 'issue' && g.has_issue)

      return matchesSearch && matchesStatus
    })
  }, [groups, search, statusFilter])

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <HardDrive size={20} />
            </span>
            <h1 className="text-xl font-extrabold text-[#111827]">Raw Data Management</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Studio internal log to track hard disks, SSDs, memory cards, and backup locations for every crew member
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (window.confirm('Wipe all local sample data and start 100% clean?')) {
                wipeAllCRMDataToClean()
                setGroups([])
              }
            }}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 flex items-center gap-1.5 transition-colors"
          >
            🧹 Clear All Local Data
          </button>
          <button
            onClick={refreshData}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw size={13} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-sans">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center font-bold">
            <Layers size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Work Orders</span>
            <span className="text-lg font-extrabold text-[#111827] font-mono">{totalWorkOrders}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <HardDrive size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Crew Storage Records</span>
            <span className="text-lg font-extrabold text-[#111827] font-mono">{totalCrewRecords}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Backups Verified</span>
            <span className="text-lg font-extrabold text-emerald-600 font-mono">{totalCompletedRecords}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Backups Pending</span>
            <span className="text-lg font-extrabold text-amber-600 font-mono">{totalPendingRecords}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex items-center gap-3">
          <div className="size-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertCircle size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Issues / Missing Clips</span>
            <span className="text-lg font-extrabold text-red-600 font-mono">{totalIssuesFound}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by WO No, customer name, mobile, crew member, SSD, card..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-400 text-[10px] uppercase">Status Filter</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-bold focus:outline-none focus:border-[#5B3FD9]"
          >
            <option value="all">All Active Work Orders</option>
            <option value="completed">All Backups Completed</option>
            <option value="pending">Backup Incomplete / Pending</option>
            <option value="issue">Issues Found</option>
          </select>
        </div>

        {/* Reset Filters */}
        {(search || statusFilter !== 'all') && (
          <button
            onClick={handleResetFilters}
            className="px-3 h-9 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center gap-1"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {/* Collapsible Work Order Data Cards List */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center text-xs text-gray-500 font-sans">
            No Work Orders found matching your raw data search criteria.
          </div>
        ) : (
          filteredGroups.map((group) => (
            <WorkOrderDataCard key={group.work_order_id} group={group} onSaved={refreshData} />
          ))
        )}
      </div>
    </div>
  )
}
