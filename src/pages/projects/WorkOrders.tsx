import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ClipboardList, BarChart2, CalendarDays, Clock,
  CreditCard, BookImage, CheckCircle2, TrendingUp,
  Archive, RotateCcw, Search, Eye, Share2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useWorkOrders } from '@/hooks/useWorkOrders'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { WorkOrderFiltersBar } from '@/components/workOrders/WorkOrderFiltersBar'
import { WorkOrderTable } from '@/components/workOrders/WorkOrderTable'
import { WorkOrderWizard } from '@/components/workOrders/WorkOrderWizard'
import { WorkOrderViewDrawer } from '@/components/workOrders/WorkOrderViewDrawer'
import { useTeamPermissions } from '@/hooks/useTeamPermissions'
import { ComingSoon } from '@/components/common/ComingSoon'
import * as woService from '@/services/supabase/workOrders'
import type { WorkOrder, WorkOrderWizardData } from '@/types/workOrders'
import { workOrderToWizardData, wizardDataToWorkOrderUpdates } from '@/types/workOrders'
import { SharePortalModal } from '@/components/workOrders/SharePortalModal'
import { WorkOrderStatusService } from '@/utils/workOrderStatusEngine'

// ─── Tab Config ───────────────────────────────────────────────────────────────

type TabId = 'work-orders' | 'archived' | 'analytics' | 'calendar'

const TABS = [
  { id: 'work-orders' as TabId, label: 'Work Orders',  icon: ClipboardList,  functional: true },
  { id: 'archived'    as TabId, label: 'Archived',     icon: Archive,        functional: true },
  { id: 'analytics'   as TabId, label: 'Analytics',    icon: BarChart2,      functional: false },
  { id: 'calendar'    as TabId, label: 'Calendar',     icon: CalendarDays,   functional: false },
]

// ─── Panel State ──────────────────────────────────────────────────────────────

type DrawerState =
  | { open: false }
  | { open: true; mode: 'view'; workOrder: WorkOrder }
  | { open: true; mode: 'wizard'; workOrder?: WorkOrder; initialData?: WorkOrderWizardData }

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, loading, onClick, isActive,
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
  loading?: boolean
  onClick?: () => void
  isActive?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-gray-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs',
        isActive ? 'ring-2 ring-[#5B3FD9] border-[#5B3FD9]' : 'hover:border-gray-300'
      )}
    >
      <div className={cn('size-9 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        {loading ? (
          <div className="h-5 w-10 bg-gray-100 rounded animate-pulse mb-1" />
        ) : (
          <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
        )}
        <p className="text-xs font-bold text-gray-500 mt-1 truncate">{label}</p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkOrders() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { hasPermission } = useTeamPermissions()
  const toast = useToast()
  const {
    result, isLoading, filters, sort, page, pageSize,
    setFilters, resetFilters, setSort, setPage, setPageSize,
    createWorkOrder, updateWorkOrder, deleteWorkOrder, refresh,
  } = useWorkOrders()

  const [activeTab, setActiveTab] = useState<TabId>('work-orders')
  const [drawer, setDrawer] = useState<DrawerState>({ open: false })
  const [shareWorkOrder, setShareWorkOrder] = useState<WorkOrder | null>(null)

  // ─── Auto-open Work Order or apply URL status filter ──────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const woId = params.get('wo')
    const statusParam = params.get('status')
    if (woId) {
      navigate(`/work-orders/${woId}`)
    } else if (statusParam) {
      setFilters({ status: statusParam as any })
    }
  }, [navigate, setFilters])

  // ─── Handle Prefill from Enquiry conversion ────────────────────────────────
  useEffect(() => {
    const state = location.state as { prefillEnquiry?: any } | null
    if (state?.prefillEnquiry) {
      const enq = state.prefillEnquiry
      const prefilledWizardData: WorkOrderWizardData = {
        project_name: `${enq.customer_name} - ${enq.event_type || 'Photography'}`,
        customer_name: enq.customer_name || '',
        mobile: enq.mobile || '',
        whatsapp_number: enq.mobile || '',
        alternate_mobile: enq.alternate_mobile || '',
        email: enq.email || '',
        event_type: enq.event_type || 'Wedding',
        booking_date: enq.event_date || new Date().toISOString().split('T')[0],
        source: enq.source || '',
        venue: enq.venue || enq.location || '',
        city: enq.location || '',
        google_map_link: '',
        notes: enq.notes || '',
        events: [
          {
            id: 'ev-' + Date.now(),
            event_type_id: '',
            event_type_name: enq.event_type || 'Wedding',
            event_date: enq.event_date || '',
            event_time: enq.event_time || '',
            venue: enq.venue || enq.location || '',
            google_map_link: '',
            notes: enq.notes || '',
            services: [],
          },
        ],
        deliverables: [],
        payment: { package_amount: enq.budget ? String(enq.budget) : '0', discount_amount: '0', gst_applicable: false, gst_percent: '18', ledger: [] },
        contract: { title: 'Standard Photography Agreement', agreement_number: '', agreement_date: new Date().toISOString().split('T')[0], valid_until: '', customer_signature: '', studio_signature: 'Trufocus Director', terms_content: '<h2>Agreement Terms</h2>' },
        pinterest_link: '', special_instructions: '',
        final_delivery_date: '', album_delivery_date: '',
      }
      setDrawer({ open: true, mode: 'wizard', initialData: prefilledWizardData })
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  const hasFilters =
    !!filters.search ||
    filters.status !== 'all' ||
    filters.event_type !== 'all' ||
    filters.payment_status !== 'all' ||
    filters.date_range !== 'all'

  const allActiveWorkOrders = useMemo(() => {
    return woService.getLocalWorkOrders().filter(w => !w.is_draft && !w.deleted_at && w.status !== 'deleted' && !w.is_archived && w.status !== 'archived')
  }, [result.items])

  const totalArchivedCount = useMemo(() => {
    return woService.getArchivedWorkOrders().length
  }, [result.items])

  const [archivedSearch, setArchivedSearch] = useState('')
  const archivedWorkOrders = useMemo(() => {
    const all = woService.getArchivedWorkOrders()
    if (!archivedSearch.trim()) return all
    const q = archivedSearch.toLowerCase()
    return all.filter(w =>
      w.work_order_number?.toLowerCase().includes(q) ||
      w.project_name?.toLowerCase().includes(q) ||
      w.customer_name?.toLowerCase().includes(q) ||
      w.mobile?.includes(q)
    )
  }, [result.items, archivedSearch])

  const statusCounts = useMemo(() => {
    return WorkOrderStatusService.calculateDashboardCounts(allActiveWorkOrders)
  }, [allActiveWorkOrders])

  const currentStatusFilter = filters.status || 'all'

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const openWizard = () => navigate('/work-orders/new')
  const openView = (wo: WorkOrder) => navigate(`/work-orders/${wo.id}`)
  const openEdit = (wo: WorkOrder) => setDrawer({ open: true, mode: 'wizard', workOrder: wo })
  const closeDrawer = () => setDrawer({ open: false })

  const handleWizardSubmit = async (data: WorkOrderWizardData, isDraft: boolean) => {
    if (!user) return
    if (drawer.open && drawer.mode === 'wizard' && drawer.workOrder) {
      const updates = wizardDataToWorkOrderUpdates(data, drawer.workOrder)
      const { error } = await updateWorkOrder(drawer.workOrder.id, updates)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Work order updated successfully! 🎉')
        closeDrawer()
      }
    } else {
      const { data: createdWO, error } = await createWorkOrder(data, user.id, isDraft)
      if (error) {
        toast.error(error)
      } else {
        toast.success(isDraft ? 'Work order saved as draft.' : 'Work order created successfully! 🎉')
        closeDrawer()
        if (createdWO) {
          setShareWorkOrder(createdWO)
        }
      }
    }
  }

  const handleArchive = async (_id: string) => {
    refresh()
  }

  const handleRestore = async (id: string) => {
    const res = woService.unarchiveWorkOrder(id, user?.full_name || 'Admin')
    if (res.success) {
      toast.success(res.message)
      refresh()
    } else {
      toast.error(res.message)
    }
  }

  const handleExport = () => {
    if (result.items.length === 0) return
    const csv = woService.exportWorkOrdersCSV(result.items)
    woService.downloadCSV(csv, `work-orders-${new Date().toISOString().split('T')[0]}.csv`)
    toast.success(`Exported ${result.items.length} work orders.`)
  }

  const handleImport = () => {
    toast.info('CSV import coming soon.')
  }

  return (
    <div className="flex flex-col gap-5 max-w-full">

      {/* ─── Page Header ─── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Work Orders Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time ERP dashboard for customer events, schedule lifecycle, production progress, deliverables, and payments.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 bg-white transition-colors cursor-pointer"
          >
            Import CSV
          </button>
          {hasPermission('work_orders', 'create') && (
            <button
              onClick={openWizard}
              id="page-new-work-order-btn"
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl shadow-xs',
                'bg-[#5B3FD9] text-white hover:bg-[#4C34C3]',
                'transition-colors duration-150 cursor-pointer'
              )}
            >
              <ClipboardList size={14} />+ New Work Order
            </button>
          )}
        </div>
      </div>

      {/* ─── Dynamic Live Dashboard Stats Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        <StatCard
          label="Total Active"
          value={statusCounts.all}
          icon={ClipboardList}
          color="bg-purple-100 text-[#5B3FD9]"
          loading={isLoading}
          isActive={currentStatusFilter === 'all'}
          onClick={() => setFilters({ status: 'all' })}
        />
        <StatCard
          label="Upcoming"
          value={statusCounts.upcoming}
          icon={Clock}
          color="bg-amber-100 text-amber-800"
          loading={isLoading}
          isActive={currentStatusFilter === 'upcoming'}
          onClick={() => setFilters({ status: 'upcoming' })}
        />
        <StatCard
          label="Today's Shoot"
          value={statusCounts.todays_shoot}
          icon={CalendarDays}
          color="bg-sky-100 text-sky-800"
          loading={isLoading}
          isActive={currentStatusFilter === 'todays_shoot'}
          onClick={() => setFilters({ status: 'todays_shoot' })}
        />
        <StatCard
          label="Ongoing"
          value={statusCounts.ongoing}
          icon={TrendingUp}
          color="bg-emerald-100 text-emerald-800"
          loading={isLoading}
          isActive={currentStatusFilter === 'ongoing'}
          onClick={() => setFilters({ status: 'ongoing' })}
        />
        <StatCard
          label="Editing"
          value={statusCounts.editing}
          icon={BookImage}
          color="bg-purple-100 text-purple-800"
          loading={isLoading}
          isActive={currentStatusFilter === 'editing'}
          onClick={() => setFilters({ status: 'editing' })}
        />
        <StatCard
          label="Completed"
          value={statusCounts.completed}
          icon={CheckCircle2}
          color="bg-emerald-200 text-emerald-900"
          loading={isLoading}
          isActive={currentStatusFilter === 'completed'}
          onClick={() => setFilters({ status: 'completed' })}
        />
        <StatCard
          label="Cancelled"
          value={statusCounts.cancelled}
          icon={CreditCard}
          color="bg-red-100 text-red-800"
          loading={isLoading}
          isActive={currentStatusFilter === 'cancelled'}
          onClick={() => setFilters({ status: 'cancelled' })}
        />
      </div>

      {/* ─── Tabs ─── */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-xs font-extrabold cursor-pointer',
                  'border-b-2 transition-all duration-150 whitespace-nowrap',
                  isActive
                    ? 'border-[#5B3FD9] text-[#5B3FD9]'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                )}
              >
                <Icon size={15} />
                {tab.label}
                {tab.id === 'archived' && totalArchivedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-purple-100 text-[#5B3FD9]">
                    {totalArchivedCount}
                  </span>
                )}
                {!tab.functional && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium uppercase tracking-wide">
                    Soon
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* ─── Tab: Work Orders ─── */}
      {activeTab === 'work-orders' && (
        <>
          {/* Filters */}
          <WorkOrderFiltersBar
            filters={filters}
            onChange={setFilters}
            onReset={resetFilters}
            onImport={handleImport}
            onExport={handleExport}
            totalCount={result.meta.total}
            statusCounts={statusCounts}
          />

          {/* Count */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-muted)]">
              {isLoading ? (
                <span className="inline-block h-4 w-28 bg-[var(--color-bg-elevated)] rounded animate-pulse" />
              ) : (
                <>
                  <span className="font-semibold text-[var(--color-text-primary)]">{result.meta.total}</span>
                  {' '}work order{result.meta.total === 1 ? '' : 's'}
                  {hasFilters && ' (filtered)'}
                </>
              )}
            </span>
          </div>

          {/* Table Card */}
          <div
            className={cn(
              'rounded-[var(--radius-lg)] bg-[var(--color-bg-card)]',
              'border border-[var(--color-border-subtle)]',
              'overflow-hidden'
            )}
          >
            <WorkOrderTable
              workOrders={result.items}
              isLoading={isLoading}
              sort={sort}
              page={page}
              pageSize={pageSize}
              total={result.meta.total}
              totalPages={result.meta.totalPages}
              hasFilters={hasFilters}
              onSort={setSort}
              onPage={setPage}
              onPageSize={(s) => { setPageSize(s); setPage(1) }}
              onView={openView}
              onEdit={openEdit}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onNew={openWizard}
              onSharePortal={(wo) => setShareWorkOrder(wo)}
            />
          </div>
        </>
      )}

      {/* ─── Tab: Archived ─── */}
      {activeTab === 'archived' && (
        <div className="space-y-4">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-100 text-[#5B3FD9] flex items-center justify-center shrink-0">
                <Archive size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#111827]">Archived Work Orders</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#5B3FD9] border border-purple-200">
                    {archivedWorkOrders.length}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Archived orders are hidden from active views. All data, deliverables, and financials remain intact and can be restored at any time.
                </p>
              </div>
            </div>

            <div className="relative min-w-[260px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={archivedSearch}
                onChange={(e) => setArchivedSearch(e.target.value)}
                placeholder="Search archived orders..."
                className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#5B3FD9] transition-all font-sans"
              />
              {archivedSearch && (
                <button
                  onClick={() => setArchivedSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Archived Table / List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            {archivedWorkOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="size-14 rounded-2xl bg-purple-50 text-[#5B3FD9] flex items-center justify-center mb-3">
                  <Archive size={24} />
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">
                  {archivedSearch ? 'No matching archived work orders' : 'No archived work orders'}
                </h4>
                <p className="text-xs text-gray-500 max-w-sm">
                  {archivedSearch
                    ? 'Try adjusting your search terms.'
                    : 'When you archive work orders from the actions menu, they will be safely kept here away from active projects.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">WO Number</th>
                      <th className="py-3 px-4">Project Name</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Archived Date & Reason</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {archivedWorkOrders.map((wo) => {
                      const archivedDate = wo.archived_at
                        ? new Date(wo.archived_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Archived'

                      return (
                        <tr key={wo.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#5B3FD9]">
                            <button
                              onClick={() => openView(wo)}
                              className="hover:underline cursor-pointer flex items-center gap-1.5"
                            >
                              <span>#{wo.work_order_number}</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-gray-900">
                            {wo.project_name}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-900">{wo.customer_name}</div>
                            {wo.mobile && <div className="text-[11px] text-gray-400 font-mono">{wo.mobile}</div>}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-[11px]">
                              {wo.event_type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-gray-900 font-semibold">{archivedDate}</div>
                            {wo.archive_reason ? (
                              <div className="text-[11px] text-gray-500 italic max-w-xs truncate">
                                {wo.archive_reason}
                              </div>
                            ) : (
                              <div className="text-[11px] text-gray-400">No reason specified</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleRestore(wo.id)}
                                className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                                title="Restore to Active Work Orders"
                              >
                                <RotateCcw size={13} />
                                <span>Restore</span>
                              </button>
                              <button
                                onClick={() => openView(wo)}
                                className="size-8 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => setShareWorkOrder(wo)}
                                className="size-8 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                                title="Customer Portal"
                              >
                                <Share2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab: Analytics ─── */}
      {activeTab === 'analytics' && (
        <ComingSoon
          icon={BarChart2}
          title="Analytics"
          description="View work order trends, revenue reports, team performance, and delivery success rates."
          module="Work Order Analytics"
        />
      )}

      {/* ─── Tab: Calendar ─── */}
      {activeTab === 'calendar' && (
        <ComingSoon
          icon={CalendarDays}
          title="Calendar"
          description="Visualise all shoot dates, editing deadlines, delivery dates, and team schedules in a calendar view."
          module="Work Order Calendar"
        />
      )}

      {/* ─── Wizard ─── */}
      {drawer.open && drawer.mode === 'wizard' && (
        <WorkOrderWizard
          isOpen={true}
          onClose={closeDrawer}
          onSubmit={(data) => handleWizardSubmit(data, false)}
          initialData={drawer.workOrder ? workOrderToWizardData(drawer.workOrder) : drawer.initialData}
        />
      )}

      {/* ─── View Drawer ─── */}
      {drawer.open && drawer.mode === 'view' && (
        <WorkOrderViewDrawer
          workOrder={drawer.workOrder}
          onClose={closeDrawer}
          onEdit={(wo) => { closeDrawer(); openEdit(wo) }}
          onSharePortal={(wo) => setShareWorkOrder(wo)}
        />
      )}

      {/* ─── Share Portal Modal ─── */}
      {shareWorkOrder && (
        <SharePortalModal
          isOpen={true}
          onClose={() => setShareWorkOrder(null)}
          workOrder={shareWorkOrder}
        />
      )}
    </div>
  )
}
