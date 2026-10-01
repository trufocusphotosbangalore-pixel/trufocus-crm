import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare, LayoutTemplate, BarChart2, Plug, Plus, FileText,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useEnquiries } from '@/hooks/useEnquiries'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { EnquiryFiltersBar } from '@/components/enquiries/EnquiryFiltersBar'
import { EnquiryTable } from '@/components/enquiries/EnquiryTable'
import { EnquiryModal } from '@/components/enquiries/EnquiryModal'
import { LandingPageBuilder } from '@/components/enquiries/LandingPageBuilder'
import { EnquiryAnalyticsPlaceholder } from '@/components/enquiries/EnquiryAnalyticsPlaceholder'
import { EnquiryIntegrationsPlaceholder } from '@/components/enquiries/EnquiryIntegrationsPlaceholder'
import { QuotationEditorModal } from '@/components/quotations/QuotationEditorModal'
import { QuotationViewModal } from '@/components/quotations/QuotationViewModal'
import { getQuotationByEnquiryId } from '@/services/quotationStore'
import type { Enquiry, EnquiryFormData, EnquiryStatus } from '@/types/enquiries'
import type { Quotation } from '@/types/quotation'
import { useTeamPermissions } from '@/hooks/useTeamPermissions'

// ─── Tab Definitions ──────────────────────────────────────────────────────────

type TabId = 'enquiries' | 'landing-pages' | 'analytics' | 'integrations'

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const TABS: Tab[] = [
  { id: 'enquiries',     label: 'Enquiries',     icon: MessageSquare },
  { id: 'landing-pages', label: 'Landing Page', icon: LayoutTemplate },
  { id: 'analytics',     label: 'Analytics',     icon: BarChart2 },
  { id: 'integrations',  label: 'Integrations',  icon: Plug },
]

// ─── Modal State ──────────────────────────────────────────────────────────────

type ModalState =
  | { open: false }
  | { open: true; mode: 'create'; enquiry: null }
  | { open: true; mode: 'edit' | 'view'; enquiry: Enquiry }

export default function Enquiries() {
  const { user } = useAuth()
  const { hasPermission } = useTeamPermissions()
  const navigate = useNavigate()
  const toast = useToast()

  const {
    result, isLoading, filters, sort, page, pageSize,
    setFilters, resetFilters, setSort, setPage, setPageSize,
    createEnquiry, updateEnquiry, deleteEnquiry,
  } = useEnquiries()

  const [activeTab, setActiveTab] = useState<TabId>('enquiries')
  const [modal, setModal] = useState<ModalState>({ open: false })
  const [showColumnDrawer, setShowColumnDrawer] = useState(false)

  const [quotationEditorModal, setQuotationEditorModal] = useState<{ open: boolean; enquiry: Enquiry | null; quotation: Quotation | null }>({
    open: false, enquiry: null, quotation: null,
  })
  const [quotationViewModal, setQuotationViewModal] = useState<{ open: boolean; quotation: Quotation | null }>({
    open: false, quotation: null,
  })

  const hasFilters =
    !!filters.search ||
    filters.status !== 'all' ||
    filters.source !== 'all' ||
    filters.event_type !== 'all' ||
    filters.date_range !== 'all'

  // Calculate Status Badge Counts
  const allEnquiries = result.items || []
  const counts = {
    all: result.meta.total,
    new: allEnquiries.filter(e => e.status === 'new').length,
    quotation_sent: allEnquiries.filter(e => e.status === 'quotation_sent').length,
    customer_reviewing: allEnquiries.filter(e => e.status === 'customer_reviewing').length,
    contacted: allEnquiries.filter(e => e.status === 'contacted' || e.status === 'follow_up').length,
    booked: allEnquiries.filter(e => e.status === 'booked').length,
    rejected: allEnquiries.filter(e => e.status === 'rejected' || e.status === 'lost').length,
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const openCreate = () => setModal({ open: true, mode: 'create', enquiry: null })
  const openEdit = (e: Enquiry) => setModal({ open: true, mode: 'edit', enquiry: e })
  const openView = (e: Enquiry) => setModal({ open: true, mode: 'view', enquiry: e })
  const closeModal = () => setModal({ open: false })

  const handleCreateQuotation = async (e: Enquiry) => {
    const existing = await getQuotationByEnquiryId(e.id)
    if (existing) {
      setQuotationViewModal({ open: true, quotation: existing })
    } else {
      setQuotationEditorModal({ open: true, enquiry: e, quotation: null })
    }
  }

  const handleSubmit = async (form: EnquiryFormData) => {
    if (!modal.open) return
    if (modal.mode === 'create') {
      const userId = user?.id || 'usr-admin'
      const { error } = await createEnquiry(form, userId)
      if (error) {
        toast.error(error)
        throw new Error(error)
      }
      toast.success('Enquiry created successfully!')
    } else if (modal.mode === 'edit') {
      const { error } = await updateEnquiry(modal.enquiry.id, form)
      if (error) {
        toast.error(error)
        throw new Error(error)
      }
      toast.success('Enquiry updated successfully!')
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteEnquiry(id)
    if (error) {
      toast.error('Failed to delete enquiry.')
    } else {
      toast.success('Enquiry deleted.')
    }
  }

  const handleStatusChange = async (id: string, newStatus: EnquiryStatus) => {
    const { error } = await updateEnquiry(id, { status: newStatus })
    if (error) {
      toast.error('Failed to update status.')
    } else {
      toast.success(`Enquiry status updated to ${newStatus.replace('_', ' ')}!`)
    }
  }

  const handleConvertToWorkOrder = (e: Enquiry) => {
    toast.success(`Converting Enquiry #${e.enquiry_number} to Work Order...`)
    navigate('/projects', { state: { prefillEnquiry: e } })
  }

  const handleImport = (_file: File) => {
    toast.info('CSV import ready.')
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl font-sans">

      {/* ─── Page Header ─── */}
      <div className="flex items-start justify-between gap-4 flex-wrap bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#111827]">Lead Management & Enquiries</h2>
          <p className="text-xs text-[#6B7280] mt-1 font-medium">
            Capture, track, and convert client photography inquiries into booked work orders.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setQuotationEditorModal({ open: true, enquiry: null, quotation: null })}
            id="page-create-quotation-btn"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#5B3FD9]/10 text-[#5B3FD9] border border-[#5B3FD9]/30 hover:bg-[#5B3FD9] hover:text-white transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            <FileText size={15} /> + Create Event Quotation
          </button>

          {hasPermission('enquiries', 'create') && (
            <button
              onClick={openCreate}
              id="page-new-enquiry-btn"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#5B3FD9] text-white hover:bg-[#4C34C3] transition-all shadow-sm shrink-0 cursor-pointer"
            >
              <Plus size={16} /> New Enquiry Lead
            </button>
          )}
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0',
                isActive
                  ? 'bg-[#5B3FD9] text-white shadow-xs'
                  : 'bg-white text-[#4B5563] hover:bg-gray-50 border border-[#E5E7EB]'
              )}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ─── TAB 1: ENQUIRIES TABLE & FILTERS ─── */}
      {activeTab === 'enquiries' && (
        <div className="space-y-4">
          <EnquiryFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            onReset={resetFilters}
            onNewEnquiry={openCreate}
            onImport={handleImport}
            allEnquiries={result.items || []}
            totalCount={result.meta.total}
            onOpenColumnSettings={() => setShowColumnDrawer(true)}
          />

          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <EnquiryTable
              enquiries={result.items || []}
              isLoading={isLoading}
              sort={sort}
              page={page}
              pageSize={pageSize}
              total={result.meta.total}
              totalPages={result.meta.totalPages}
              hasFilters={hasFilters}
              showColumnDrawer={showColumnDrawer}
              onCloseColumnDrawer={() => setShowColumnDrawer(false)}
              onSort={setSort}
              onPage={setPage}
              onPageSize={(s) => { setPageSize(s); setPage(1) }}
              onView={openView}
              onEdit={openEdit}
              onDelete={handleDelete}
              onNew={openCreate}
              onStatusChange={handleStatusChange}
              onConvertToWorkOrder={handleConvertToWorkOrder}
              onCreateQuotation={handleCreateQuotation}
            />
          </div>
        </div>
      )}

      {/* ─── TAB 2: VISUAL LANDING PAGE BUILDER ─── */}
      {activeTab === 'landing-pages' && (
        <LandingPageBuilder />
      )}

      {/* ─── TAB 3: ANALYTICS ─── */}
      {activeTab === 'analytics' && (
        <EnquiryAnalyticsPlaceholder />
      )}

      {/* ─── TAB 4: INTEGRATIONS ─── */}
      {activeTab === 'integrations' && (
        <EnquiryIntegrationsPlaceholder />
      )}

      {/* ─── Enquiry Modal ─── */}
      {modal.open && (
        <EnquiryModal
          isOpen={modal.open}
          onClose={closeModal}
          mode={modal.mode}
          enquiry={modal.open && modal.mode !== 'create' ? modal.enquiry : null}
          onSubmit={handleSubmit}
          onCreateQuotation={handleCreateQuotation}
        />
      )}

      {/* ─── Quotation Modals ─── */}
      <QuotationEditorModal
        isOpen={quotationEditorModal.open}
        onClose={() => setQuotationEditorModal({ open: false, enquiry: null, quotation: null })}
        enquiry={quotationEditorModal.enquiry}
        initialQuotation={quotationEditorModal.quotation}
        onSaved={(qtn) => {
          setQuotationEditorModal({ open: false, enquiry: null, quotation: null })
          setQuotationViewModal({ open: true, quotation: qtn })
        }}
      />

      <QuotationViewModal
        isOpen={quotationViewModal.open}
        onClose={() => setQuotationViewModal({ open: false, quotation: null })}
        quotation={quotationViewModal.quotation}
      />

    </div>
  )
}
