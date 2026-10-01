import { useState, useMemo, useEffect } from 'react'
import {
  Search, RotateCcw, Layers, Filter, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import {
  getPostProductionItems,
  updateDeliverableStatus,
} from '@/services/postProductionStore'
import { pullTableFromCloud, broadcastCloudSync } from '@/services/cloudSyncService'
import { DeliverableAssignmentService } from '@/services/deliverableAssignmentService'
import { getTeamMembers } from '@/services/teamStore'
import { getCrewSession } from '@/services/crewSessionService'
import { useAuth } from '@/hooks/useAuth'
import { PostProductionStats } from '@/components/postProduction/PostProductionStats'
import { PostProductionTable } from '@/components/postProduction/PostProductionTable'
import { DeliverableDetailsDrawer } from '@/components/postProduction/DeliverableDetailsDrawer'
import type { PostProductionItem, DeliverableStatus, DeliverablePriority } from '@/types/postProduction'
import { toast } from 'react-hot-toast'
import { DocumentManagerWidget } from '@/components/documents/DocumentManagerWidget'

export default function PostProductionPage() {
  const [items, setItems] = useState<PostProductionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<PostProductionItem | null>(null)
  const [activeHeaderTab, setActiveHeaderTab] = useState<'deliverables' | 'documents'>('deliverables')

  // Logged in user resolution for "My Tasks"
  const { user: crmUser } = useAuth()
  const crewUser = getCrewSession()
  const currentUser = crewUser || crmUser

  // Filter Tabs
  const [pillTab, setPillTab] = useState<'my_tasks' | 'all_tasks' | 'overdue' | 'due_today' | 'due_tomorrow' | 'unassigned'>('all_tasks')

  // Search & Filter Bar Controls
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DeliverableStatus | 'all'>('all')
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<DeliverablePriority | 'all'>('all')
  const [dueDateFilter, setDueDateFilter] = useState<'all' | 'overdue' | 'due_today' | 'due_tomorrow' | 'this_week' | 'next_week'>('all')
  const [workOrderFilter, setWorkOrderFilter] = useState<string>('all')

  const loadData = () => {
    try {
      setHasError(false)
      const data = getPostProductionItems()
      setItems(data)
    } catch (e) {
      console.error('Error loading post production data:', e)
      setHasError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Real-time synchronization
  useRealtimeSync(() => {
    loadData()
  })

  const refreshItems = async () => {
    setLoading(true)
    try {
      await pullTableFromCloud('post_production')
      await pullTableFromCloud('work_orders')
      broadcastCloudSync('post_production')
      loadData()
      toast.success('Post Production data refreshed from Supabase!')
    } catch (e) {
      console.error('Error refreshing post production cloud data:', e)
      loadData()
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (id: string, newStatus: DeliverableStatus) => {
    try {
      updateDeliverableStatus(id, newStatus)
      toast.success(`Status updated to ${newStatus.replace('_', ' ').toUpperCase()}`)
      loadData()
    } catch (e) {
      console.error('Error updating status:', e)
      toast.error('Failed to update status')
    }
  }

  const handleAssignmentChange = async (id: string, editorName: string) => {
    try {
      await DeliverableAssignmentService.assignEditor(id, '', editorName)
      if (editorName) {
        toast.success(`Assigned to ${editorName}! 🎉`)
      } else {
        toast.success('Assignment removed')
      }
      loadData()
    } catch (e) {
      console.error('Error changing assignment:', e)
      toast.error('Failed to update assignment')
    }
  }

  // Active Team Members for Staff filter dropdown
  const teamMembers = useMemo(() => getTeamMembers().filter((m) => m.status === 'active'), [])

  // Unique Work Order numbers for dropdown
  const uniqueWorkOrderNumbers = useMemo(() => {
    const set = new Set<string>()
    items.forEach((i) => {
      if (i.work_order_number) set.add(i.work_order_number)
    })
    return Array.from(set).sort()
  }, [items])

  // Filter Pill Tab Counts
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const tomorrowStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }, [])

  const userIdentifiers = useMemo(() => {
    const ids = new Set<string>()
    if (currentUser) {
      if (currentUser.id) ids.add(String(currentUser.id).toLowerCase())
      if ('employee_id' in currentUser && currentUser.employee_id) ids.add(String(currentUser.employee_id).toLowerCase())
      if ('employee_name' in currentUser && currentUser.employee_name) ids.add(String(currentUser.employee_name).toLowerCase())
      if ('full_name' in currentUser && (currentUser as any).full_name) ids.add(String((currentUser as any).full_name).toLowerCase())
      if ('email' in currentUser && currentUser.email) ids.add(String(currentUser.email).toLowerCase())
    }
    return ids
  }, [currentUser])

  const counts = useMemo(() => {
    const idList = Array.from(userIdentifiers)
    const my = items.filter((i) => {
      if (!i.assigned_editor_name && !i.assigned_editor_id) return false
      const edName = (i.assigned_editor_name || '').toLowerCase()
      const edId = (i.assigned_editor_id || '').toLowerCase()
      return idList.some((target) => (edId && edId === target) || (edName && (edName === target || edName.includes(target))))
    }).length

    const overdue = items.filter((i) => i.due_date && i.due_date < todayStr && i.status !== 'completed' && i.status !== 'delivered' && i.status !== 'done').length
    const dueToday = items.filter((i) => i.due_date === todayStr && i.status !== 'completed' && i.status !== 'delivered' && i.status !== 'done').length
    const dueTomorrow = items.filter((i) => i.due_date === tomorrowStr && i.status !== 'completed' && i.status !== 'delivered' && i.status !== 'done').length
    const unassigned = items.filter((i) => !i.assigned_editor_name && !i.assigned_editor_id).length

    return {
      my,
      all: items.length,
      overdue,
      dueToday,
      dueTomorrow,
      unassigned,
    }
  }, [items, userIdentifiers, todayStr, tomorrowStr])

  // Filter Items
  const filteredItems = useMemo(() => {
    const idList = Array.from(userIdentifiers)

    return items.filter((item) => {
      // Pill Tab filter
      if (pillTab === 'my_tasks') {
        const edName = (item.assigned_editor_name || '').toLowerCase()
        const edId = (item.assigned_editor_id || '').toLowerCase()
        const matchesMy = idList.some((target) => (edId && edId === target) || (edName && (edName === target || edName.includes(target))))
        if (!matchesMy) return false
      } else if (pillTab === 'overdue') {
        if (!item.due_date || item.due_date >= todayStr || item.status === 'completed' || item.status === 'delivered' || item.status === 'done') return false
      } else if (pillTab === 'due_today') {
        if (item.due_date !== todayStr) return false
      } else if (pillTab === 'due_tomorrow') {
        if (item.due_date !== tomorrowStr) return false
      } else if (pillTab === 'unassigned') {
        if (item.assigned_editor_name || item.assigned_editor_id) return false
      }

      // Search Filter
      const query = search.toLowerCase()
      const matchesSearch =
        !search ||
        item.work_order_number.toLowerCase().includes(query) ||
        item.customer_name.toLowerCase().includes(query) ||
        item.deliverable_name.toLowerCase().includes(query) ||
        (item.assigned_editor_name && item.assigned_editor_name.toLowerCase().includes(query)) ||
        (item.event_type && item.event_type.toLowerCase().includes(query))

      // Status Filter
      const matchesStatus =
        statusFilter === 'all' ||
        item.status === statusFilter ||
        (statusFilter === 'not_started' && (item.status === 'pending' || item.status === 'assigned')) ||
        (statusFilter === 'in_progress' && item.status === 'editing') ||
        (statusFilter === 'ready_for_review' && (item.status === 'review' || item.status === 'for_review')) ||
        (statusFilter === 'completed' && item.status === 'done')

      // Staff Filter
      const matchesStaff =
        staffFilter === 'all' ||
        (item.assigned_editor_name && item.assigned_editor_name.toLowerCase().includes(staffFilter.toLowerCase()))

      // Priority Filter
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter

      // Due Date Filter
      let matchesDueDate = true
      if (dueDateFilter === 'overdue') {
        matchesDueDate = !!(item.due_date && item.due_date < todayStr && item.status !== 'completed' && item.status !== 'delivered')
      } else if (dueDateFilter === 'due_today') {
        matchesDueDate = item.due_date === todayStr
      } else if (dueDateFilter === 'due_tomorrow') {
        matchesDueDate = item.due_date === tomorrowStr
      }

      // Work Order Filter
      const matchesWorkOrder = workOrderFilter === 'all' || item.work_order_number === workOrderFilter

      return matchesSearch && matchesStatus && matchesStaff && matchesPriority && matchesDueDate && matchesWorkOrder
    })
  }, [items, pillTab, search, statusFilter, staffFilter, priorityFilter, dueDateFilter, workOrderFilter, todayStr, tomorrowStr, userIdentifiers])

  const handleResetFilters = () => {
    setPillTab('all_tasks')
    setSearch('')
    setStatusFilter('all')
    setStaffFilter('all')
    setPriorityFilter('all')
    setDueDateFilter('all')
    setWorkOrderFilter('all')
  }

  const isFilterActive =
    search ||
    statusFilter !== 'all' ||
    staffFilter !== 'all' ||
    priorityFilter !== 'all' ||
    dueDateFilter !== 'all' ||
    workOrderFilter !== 'all'

  if (hasError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl border border-red-200 p-8 text-center space-y-4 shadow-sm">
          <div className="size-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100 shadow-xs">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">Unable to load Post Production data</h2>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            An unexpected error occurred while connecting to Supabase database. Please try reloading.
          </p>
          <button
            onClick={loadData}
            className="px-5 py-2.5 rounded-xl bg-[#5B3FD9] text-white font-extrabold text-xs inline-flex items-center gap-2 hover:bg-[#4C34C3] cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* ─── Top Header ─── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#5B3FD9]/10 text-[#5B3FD9]">
              <Layers size={20} />
            </span>
            <h1 className="text-xl font-extrabold text-[#111827]">POST PRODUCTION MANAGEMENT</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Track every photography & videography deliverable task independently across all Work Orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setActiveHeaderTab('deliverables')}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer',
                activeHeaderTab === 'deliverables' ? 'bg-[#5B3FD9] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200/60'
              )}
            >
              Deliverables Tasks
            </button>
            <button
              onClick={() => setActiveHeaderTab('documents')}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer',
                activeHeaderTab === 'documents' ? 'bg-[#5B3FD9] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200/60'
              )}
            >
              RAW Media & Attachments
            </button>
          </div>

          <button
            onClick={refreshItems}
            disabled={loading}
            className="px-4 py-2 text-xs font-extrabold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw size={13} className={loading ? 'animate-spin' : ''} /> {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {activeHeaderTab === 'documents' ? (
        <DocumentManagerWidget
          module="post_production"
          title="Post-Production RAW Media, Music & Project Files"
          subtitle="Manage RAW shoot footage links, Lightroom catalog presets, background music tracks, and edited video files."
        />
      ) : (
        <>
          {/* ─── KPI Stats Cards ─── */}
          <PostProductionStats items={items} />

          {/* ─── Filter Tabs Row (Pills) ─── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setPillTab('my_tasks')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shrink-0',
                pillTab === 'my_tasks'
                  ? 'bg-[#5B3FD9] text-white shadow-md shadow-[#5B3FD9]/30'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              )}
            >
              My Tasks <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-mono">{counts.my}</span>
            </button>

            <button
              onClick={() => setPillTab('all_tasks')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shrink-0',
                pillTab === 'all_tasks'
                  ? 'bg-[#5B3FD9] text-white shadow-md shadow-[#5B3FD9]/30'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              )}
            >
              All Tasks <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 font-mono text-gray-600">{counts.all}</span>
            </button>

            <button
              onClick={() => setPillTab('overdue')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shrink-0',
                pillTab === 'overdue'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              )}
            >
              Overdue <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-200/60 font-mono">{counts.overdue}</span>
            </button>

            <button
              onClick={() => setPillTab('due_today')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shrink-0',
                pillTab === 'due_today'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              )}
            >
              Due Today <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-200/60 font-mono">{counts.dueToday}</span>
            </button>

            <button
              onClick={() => setPillTab('due_tomorrow')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shrink-0',
                pillTab === 'due_tomorrow'
                  ? 'bg-yellow-600 text-white shadow-md shadow-yellow-600/30'
                  : 'bg-yellow-50 text-yellow-800 border border-yellow-200 hover:bg-yellow-100'
              )}
            >
              Due Tomorrow <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-yellow-200/60 font-mono">{counts.dueTomorrow}</span>
            </button>

            <button
              onClick={() => setPillTab('unassigned')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shrink-0',
                pillTab === 'unassigned'
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              )}
            >
              Unassigned <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 font-mono text-gray-600">{counts.unassigned}</span>
            </button>
          </div>

          {/* ─── Search + Dropdown Filters Bar ─── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Tasks Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-[#5B3FD9]"
              />
            </div>

            {/* Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-extrabold focus:outline-none focus:border-[#5B3FD9] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="ready_for_review">Internal Review</option>
              <option value="client_approval">Client Approval</option>
              <option value="completed">Completed</option>
              <option value="delivered">Delivered</option>
            </select>

            {/* Staff Filter Dropdown */}
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-extrabold focus:outline-none focus:border-[#5B3FD9] cursor-pointer"
            >
              <option value="all">All Staff</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.full_name}>
                  {m.full_name}
                </option>
              ))}
            </select>

            {/* Priority Filter Dropdown */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-extrabold focus:outline-none focus:border-[#5B3FD9] cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            {/* Due Date Filter Dropdown */}
            <select
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value as any)}
              className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-extrabold focus:outline-none focus:border-[#5B3FD9] cursor-pointer"
            >
              <option value="all">All Due Dates</option>
              <option value="overdue">Overdue</option>
              <option value="due_today">Due Today</option>
              <option value="due_tomorrow">Due Tomorrow</option>
            </select>

            {/* Work Order Filter Dropdown */}
            <select
              value={workOrderFilter}
              onChange={(e) => setWorkOrderFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-extrabold focus:outline-none focus:border-[#5B3FD9] cursor-pointer"
            >
              <option value="all">All Work Orders</option>
              {uniqueWorkOrderNumbers.map((woNum) => (
                <option key={woNum} value={woNum}>
                  {woNum}
                </option>
              ))}
            </select>

            {/* Reset Filters Button */}
            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="px-3.5 h-9 text-xs font-extrabold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Filter size={13} /> Reset Filters
              </button>
            )}
          </div>

          {/* ─── Deliverable Production Task Table ─── */}
          <PostProductionTable
            items={filteredItems}
            onStatusChange={handleStatusChange}
            onAssignmentChange={handleAssignmentChange}
            onOpenDrawer={(item) => setSelectedDrawerItem(item)}
          />
        </>
      )}

      {/* ─── Slide-Over Task Details Drawer ─── */}
      {selectedDrawerItem && (
        <DeliverableDetailsDrawer
          isOpen={!!selectedDrawerItem}
          onClose={() => setSelectedDrawerItem(null)}
          item={selectedDrawerItem}
          onUpdate={loadData}
        />
      )}
    </div>
  )
}
