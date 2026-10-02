import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Pencil, ExternalLink, Share2, Printer, Download,
  ClipboardList, CalendarDays, FileCheck, PackageCheck, CreditCard,
  BookImage, Clock, Activity, Sparkles, FileText, MessageSquare, Image,
  Archive, RotateCcw, AlertTriangle, X,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import * as woService from '@/services/supabase/workOrders'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { WOStatusBadge } from '@/components/workOrders/WorkOrderBadges'
import { WorkOrderWizard } from '@/components/workOrders/WorkOrderWizard'
import { SharePortalModal } from '@/components/workOrders/SharePortalModal'
import { WorkOrderRightPanel } from '@/components/workOrders/details/WorkOrderRightPanel'
import { getOrCreatePortalForWorkOrder } from '@/services/customerPortalStore'
import { archiveWorkOrder, unarchiveWorkOrder } from '@/services/supabase/workOrders'
import {
  getWorkOrderNextShoot,
  getWorkOrderComputedStatus,
  getComputedStatusBadgeProps,
} from '@/utils/workOrderStatusEngine'

// 12 Tabs
import { OverviewTab } from '@/components/workOrders/details/OverviewTab'
import { ScheduleTab } from '@/components/workOrders/details/ScheduleTab'
import { QuotationTab } from '@/components/workOrders/details/QuotationTab'
import { DeliverablesTab } from '@/components/workOrders/details/DeliverablesTab'
import { PaymentsTab } from '@/components/workOrders/details/PaymentsTab'
import { ContractTab } from '@/components/workOrders/details/ContractTab'
import { MoodboardTab } from '@/components/workOrders/details/MoodboardTab'
import { CalendarTab } from '@/components/workOrders/details/CalendarTab'
import { TimelineTab } from '@/components/workOrders/details/TimelineTab'
import { ActivityLogTab } from '@/components/workOrders/details/ActivityLogTab'
import { ClientRequestsTab } from '@/components/workOrders/details/ClientRequestsTab'
import { GalleryTab } from '@/components/workOrders/details/GalleryTab'

import type { WorkOrder, WorkOrderWizardData } from '@/types/workOrders'
import { workOrderToWizardData, wizardDataToWorkOrderUpdates } from '@/types/workOrders'
import { toast } from 'react-hot-toast'
import { downloadDocumentPDF } from '@/services/pdfGeneratorService'
import { AssignTeamScreen } from '@/components/assignments/AssignTeamScreen'
import { Users } from 'lucide-react'

import { DocumentManagerWidget } from '@/components/documents/DocumentManagerWidget'
import { FolderInput } from 'lucide-react'

export type DetailTabId =
  | 'overview'
  | 'assign_team'
  | 'schedule'
  | 'quotation'
  | 'deliverables'
  | 'payments'
  | 'contract'
  | 'requests'
  | 'gallery'
  | 'moodboard'
  | 'calendar'
  | 'timeline'
  | 'attachments'
  | 'activity'

const TABS: { id: DetailTabId; label: string; icon: any }[] = [
  { id: 'overview',     label: 'Overview',      icon: ClipboardList },
  { id: 'assign_team',  label: 'Assign Team',   icon: Users },
  { id: 'schedule',     label: 'Schedule',      icon: CalendarDays },
  { id: 'quotation',    label: 'Quotation',     icon: FileText },
  { id: 'deliverables', label: 'Deliverables',  icon: PackageCheck },
  { id: 'payments',     label: 'Payments',      icon: CreditCard },
  { id: 'contract',     label: 'Contract',      icon: FileCheck },
  { id: 'requests',     label: 'Client Requests', icon: MessageSquare },
  { id: 'gallery',      label: 'Gallery',       icon: Image },
  { id: 'moodboard',    label: 'Moodboard',     icon: BookImage },
  { id: 'calendar',     label: 'Calendar',      icon: CalendarDays },
  { id: 'timeline',     label: 'Timeline',      icon: Clock },
  { id: 'attachments',  label: 'Documents & Files', icon: FolderInput },
  { id: 'activity',     label: 'Activity Log',  icon: Activity },
]

export function WorkOrderDetail() {
  const { workOrderId } = useParams<{ workOrderId: string }>()
  const navigate = useNavigate()

  const [currentWorkOrder, setCurrentWorkOrder] = useState<WorkOrder | null>(() => {
    if (!workOrderId) return null
    return (
      woService
        .getLocalWorkOrders()
        .find(
          (w) =>
            w.id === workOrderId ||
            w.work_order_number.toLowerCase() === workOrderId.toLowerCase()
        ) || null
    )
  })
  const [isLoading, setIsLoading] = useState(!currentWorkOrder)

  const [activeTab, setActiveTab] = useState<DetailTabId>('overview')
  const [isEditingWizard, setIsEditingWizard] = useState(false)
  const [shareWorkOrder, setShareWorkOrder] = useState<WorkOrder | null>(null)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [archiveReason, setArchiveReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const isArchived = Boolean(currentWorkOrder?.is_archived || currentWorkOrder?.status === 'archived')

  const handleArchive = async () => {
    if (!currentWorkOrder) return
    setIsProcessing(true)
    const res = archiveWorkOrder(currentWorkOrder.id, 'Admin', archiveReason.trim())
    if (res.success) {
      toast.success(res.message)
      setShowArchiveModal(false)
      setArchiveReason('')
      navigate('/work-orders')
    } else {
      toast.error(res.message)
    }
    setIsProcessing(false)
  }

  const handleRestore = async () => {
    if (!currentWorkOrder) return
    setIsProcessing(true)
    const res = unarchiveWorkOrder(currentWorkOrder.id, 'Admin')
    if (res.success) {
      toast.success(res.message)
      loadWorkOrder(false)
    } else {
      toast.error(res.message)
    }
    setIsProcessing(false)
  }

  const loadWorkOrder = useCallback(
    async (isSilent = false) => {
      if (!workOrderId) return
      if (!isSilent && !currentWorkOrder) setIsLoading(true)
      try {
        const fetched = await woService.fetchWorkOrder(workOrderId)
        if (fetched) {
          setCurrentWorkOrder(fetched)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [workOrderId, currentWorkOrder]
  )

  useEffect(() => {
    loadWorkOrder(false)
  }, [workOrderId])

  const handleRealtimeSync = useCallback(() => {
    loadWorkOrder(true)
  }, [loadWorkOrder])

  useRealtimeSync(handleRealtimeSync)

  if (isLoading && !currentWorkOrder) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
        <div className="flex items-center gap-3 text-sm text-[#5B3FD9] font-bold">
          <Sparkles className="animate-spin size-5" /> Loading Work Order Details...
        </div>
      </div>
    )
  }

  if (!currentWorkOrder) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans">
        <div className="max-w-md mx-auto text-center space-y-4 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-base font-bold text-gray-900">Work Order Not Found</h3>
          <p className="text-xs text-gray-500">The requested Work Order ({workOrderId}) could not be located in the database.</p>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3]"
          >
            ← Return to Work Orders List
          </button>
        </div>
      </div>
    )
  }

  const portalUrl = getOrCreatePortalForWorkOrder(currentWorkOrder).share_link

  const handleOpenPortal = () => window.open(portalUrl, '_blank')
  const handlePrint = () => window.print()
  const handleDownloadPdf = () => {
    downloadDocumentPDF('quotation', currentWorkOrder)
  }

  const handleWizardSubmit = async (data: WorkOrderWizardData) => {
    if (!currentWorkOrder) return
    const updates = wizardDataToWorkOrderUpdates(data, currentWorkOrder)
    const { error } = await woService.updateWorkOrder(currentWorkOrder.id, updates)
    if (!error) {
      toast.success('Work Order updated successfully! 🎉')
      setIsEditingWizard(false)
      loadWorkOrder(true)
    }
  }

  const nextShoot = getWorkOrderNextShoot(currentWorkOrder)
  const computedWOStatus = getWorkOrderComputedStatus(currentWorkOrder)
  const nextShootBadge = nextShoot ? getComputedStatusBadgeProps(nextShoot.status) : null

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        {/* Back Link & Title */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="size-9 rounded-xl border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
              title="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#5B3FD9] bg-[#5B3FD9]/10 px-2 py-0.5 rounded text-xs">
                  {currentWorkOrder.work_order_number}
                </span>
                <h1 className="text-lg font-bold text-[#111827]">{currentWorkOrder.project_name}</h1>
                <WOStatusBadge status={computedWOStatus} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Client: <strong>{currentWorkOrder.customer_name}</strong> • {currentWorkOrder.event_type} Shoot
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditingWizard(true)}
              className="min-h-[44px] px-3.5 py-2 text-xs font-extrabold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil size={14} /> <span className="hidden sm:inline">Edit Work Order</span><span className="sm:hidden">Edit</span>
            </button>

            <button
              onClick={handleOpenPortal}
              className="min-h-[44px] px-3.5 py-2 text-xs font-extrabold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink size={14} /> <span className="hidden sm:inline">Client Portal</span><span className="sm:hidden">Portal</span>
            </button>

            <button
              onClick={() => setShareWorkOrder(currentWorkOrder)}
              className="min-h-[44px] px-4 py-2 text-xs font-extrabold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Share2 size={14} /> Share
            </button>

            <button
              onClick={handlePrint}
              className="min-h-[44px] min-w-[44px] rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 flex items-center justify-center cursor-pointer"
              title="Print Work Order Summary"
            >
              <Printer size={16} />
            </button>

            <button
              onClick={handleDownloadPdf}
              className="min-h-[44px] min-w-[44px] rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 flex items-center justify-center cursor-pointer"
              title="Download PDF Document"
            >
              <Download size={16} />
            </button>

            {isArchived ? (
              <button
                onClick={handleRestore}
                disabled={isProcessing}
                className="min-h-[44px] px-3.5 py-2 text-xs font-extrabold rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Restore to Active Work Orders"
              >
                <RotateCcw size={14} /> <span className="hidden sm:inline">Restore to Active</span><span className="sm:hidden">Restore</span>
              </button>
            ) : (
              <button
                onClick={() => setShowArchiveModal(true)}
                disabled={isProcessing}
                className="min-h-[44px] px-3.5 py-2 text-xs font-extrabold rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#5B3FD9] flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Archive Work Order"
              >
                <Archive size={14} /> <span className="hidden sm:inline">Archive Work Order</span><span className="sm:hidden">Archive</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Archived Notice Banner ── */}
        {isArchived && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 font-semibold shadow-xs">
            <div className="flex items-center gap-2.5">
              <Archive size={18} className="text-amber-700 shrink-0" />
              <div>
                <p className="font-extrabold text-amber-950">This Work Order is Archived</p>
                <p className="text-[11px] text-amber-800 font-normal">
                  It is currently hidden from active work orders. All customer data and financials remain intact.
                  {currentWorkOrder.archive_reason && ` (Reason: ${currentWorkOrder.archive_reason})`}
                </p>
              </div>
            </div>
            <button
              onClick={handleRestore}
              disabled={isProcessing}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <RotateCcw size={13} /> {isProcessing ? 'Restoring...' : 'Restore to Active'}
            </button>
          </div>
        )}

        {/* ── NEXT SHOOT Header Card ── */}
        {nextShoot && nextShootBadge && (
          <div className="bg-gradient-to-r from-[#1E1B3A] via-indigo-950 to-purple-950 rounded-2xl p-5 text-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-900/60">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950 tracking-wider">
                  NEXT SHOOT
                </span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border',
                    nextShootBadge.bgClass,
                    nextShootBadge.textClass,
                    nextShootBadge.borderClass
                  )}
                >
                  {nextShootBadge.label}
                </span>
              </div>

              <h2 className="text-xl font-extrabold tracking-tight text-white">
                {nextShoot.event_name}
              </h2>

              <div className="text-xs text-indigo-200 font-medium flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <CalendarDays size={14} className="text-amber-300 shrink-0" /> {nextShoot.event_date}
                </span>
                <span className="text-indigo-400">•</span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-300 shrink-0" /> {nextShoot.event_time}
                </span>
                <span className="text-indigo-400">•</span>
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-300 shrink-0" /> {nextShoot.venue}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('schedule')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <CalendarDays size={14} /> View Full Event Schedule
              </button>
            </div>
          </div>
        )}

        {/* 12 Top Tabs */}
        <div className="overflow-x-auto border-t border-[#E5E7EB] pt-2">
          <div className="flex gap-1 min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all relative',
                    isActive
                      ? 'bg-[#5B3FD9]/10 text-[#5B3FD9]'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <Icon size={14} />
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#5B3FD9] rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Tabs Content (Left) + Sticky Side Panel (Right) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Active Tab Panel Container */}
        <div className="flex-1 min-w-0">
          {activeTab === 'overview' && (
            <OverviewTab workOrder={currentWorkOrder} onEditSection={() => setIsEditingWizard(true)} />
          )}

          {activeTab === 'assign_team' && (
            <AssignTeamScreen workOrder={currentWorkOrder} onUpdated={() => loadWorkOrder(true)} />
          )}

          {activeTab === 'schedule' && (
            <ScheduleTab workOrder={currentWorkOrder} onEditSchedule={() => setIsEditingWizard(true)} />
          )}

          {activeTab === 'quotation' && <QuotationTab workOrder={currentWorkOrder} />}

          {activeTab === 'deliverables' && (
            <DeliverablesTab workOrder={currentWorkOrder} onEditDeliverables={() => setIsEditingWizard(true)} />
          )}

          {activeTab === 'payments' && (
            <PaymentsTab workOrder={currentWorkOrder} />
          )}

          {activeTab === 'contract' && (
            <ContractTab workOrder={currentWorkOrder} onEditContract={() => setIsEditingWizard(true)} />
          )}

          {activeTab === 'requests' && <ClientRequestsTab workOrder={currentWorkOrder} />}

          {activeTab === 'gallery' && <GalleryTab workOrder={currentWorkOrder} />}

          {activeTab === 'moodboard' && <MoodboardTab workOrder={currentWorkOrder} />}

          {activeTab === 'calendar' && <CalendarTab workOrder={currentWorkOrder} />}

          {activeTab === 'timeline' && <TimelineTab workOrder={currentWorkOrder} />}

          {activeTab === 'attachments' && (
            <DocumentManagerWidget
              module="work_orders"
              relatedId={currentWorkOrder.id}
              relatedNumber={currentWorkOrder.work_order_number}
              title="Work Order Attachments & Document Management"
              subtitle={`Manage contracts, quotations, raw files, and inspiration attachments for WO #${currentWorkOrder.work_order_number}.`}
            />
          )}

          {activeTab === 'activity' && <ActivityLogTab workOrder={currentWorkOrder} />}
        </div>

        {/* Sticky Right Side Quick Panel */}
        <WorkOrderRightPanel
          workOrder={currentWorkOrder}
          onOpenPortal={handleOpenPortal}
          onSharePortal={() => setShareWorkOrder(currentWorkOrder)}
        />
      </div>

      {/* Edit Wizard Modal */}
      {isEditingWizard && (
        <WorkOrderWizard
          isOpen={isEditingWizard}
          onClose={() => setIsEditingWizard(false)}
          onSubmit={handleWizardSubmit}
          initialData={workOrderToWizardData(currentWorkOrder)}
        />
      )}

      {/* Share Portal Modal */}
      {shareWorkOrder && (
        <SharePortalModal
          isOpen={!!shareWorkOrder}
          onClose={() => setShareWorkOrder(null)}
          workOrder={shareWorkOrder}
        />
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && currentWorkOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-[#5B3FD9]">
                <Archive size={20} />
                <h3 className="text-base font-extrabold text-[#111827]">Archive Work Order?</h3>
              </div>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <p className="font-semibold text-gray-800">
                You are about to archive this Work Order.
              </p>

              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1 font-sans">
                <p>
                  Project: <strong className="text-gray-900">{currentWorkOrder.project_name}</strong>
                </p>
                <p>
                  Work Order: <strong className="font-mono text-[#5B3FD9]">{currentWorkOrder.work_order_number}</strong>
                </p>
                <p>
                  Customer: <strong className="text-gray-900">{currentWorkOrder.customer_name}</strong>
                </p>
              </div>

              <p className="text-gray-500">
                Archiving will hide this work order from the active work orders list. All project records, schedules, deliverables, and payment receipts are preserved safely.
              </p>

              <div className="pt-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Reason for Archiving (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Completed & closed / Inactive / Client requested hold"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#5B3FD9] font-sans"
                />
              </div>

              <span className="text-[11px] font-semibold text-[#5B3FD9] block bg-purple-50 p-2.5 rounded-lg border border-purple-100">
                📁 You can access, view, or restore this order anytime from the <strong>Archived</strong> tab on the Work Orders page.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                disabled={isProcessing}
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isProcessing}
                onClick={handleArchive}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Archive size={13} /> {isProcessing ? 'Archiving...' : 'Archive Work Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkOrderDetail
