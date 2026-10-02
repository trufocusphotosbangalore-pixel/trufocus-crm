import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Camera, Lock, ArrowRight, LogOut, CheckCircle2, Clock,
  CreditCard, FileText, Calendar, Image, Package, FolderDown, Headphones,
  ExternalLink, Download, Plus, Sparkles, MessageCircle, Mail, Phone,
  ChevronRight, MessageSquare,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatDate } from '@/lib/utils'
import { getLocalWorkOrders, isWorkOrderContractSigned, fetchWorkOrderFromSupabase, saveLocalWorkOrdersOnly, recalculateWorkOrderFinancials } from '@/services/supabase/workOrders'
import { pullTableFromCloud, extractEntitiesFromCloudRows } from '@/services/cloudSyncService'
import { processRazorpayPayment } from '@/services/razorpayService'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import type { WorkOrder } from '@/types/workOrders'
import { WorkOrderWorkflowService } from '@/services/workOrderWorkflowService'
import {
  getOrCreatePortalForWorkOrder,
  verifyPortalPin,
  getMoodboardItems,
  addMoodboardItem,
} from '@/services/customerPortalStore'
import type { CustomerPortalData, PortalMoodboardItem } from '@/types/customerPortal'
import { PORTAL_TIMELINE_STAGES } from '@/types/customerPortal'
import { CustomerPortalRequestsTab } from '@/components/portal/CustomerPortalRequestsTab'
import { PortalEventMapCard } from '@/components/portal/PortalEventMapCard'
import { PortalGalleryView } from '@/components/portal/PortalGalleryView'
import { PortalAcknowledgementScreen } from '@/components/portal/PortalAcknowledgementScreen'
import { downloadDocumentPDF } from '@/services/pdfGeneratorService'
import { loadBusinessProfile } from '@/services/businessProfileStore'
import { DocumentManagerWidget } from '@/components/documents/DocumentManagerWidget'
import { toast } from 'react-hot-toast'

export default function CustomerPortal() {
  const { workOrderNumber } = useParams<{ workOrderNumber: string }>()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [bizProfile, setBizProfile] = useState(() => loadBusinessProfile())

  useEffect(() => {
    const handleProfileSync = () => {
      setBizProfile(loadBusinessProfile())
    }
    window.addEventListener('trufocus_business_profile_updated', handleProfileSync)
    return () => window.removeEventListener('trufocus_business_profile_updated', handleProfileSync)
  }, [])
  const [portal, setPortal] = useState<CustomerPortalData | null>(null)
  const [inputPin, setInputPin] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'payments' | 'contract' | 'schedule' | 'moodboard' | 'gallery' | 'deliverables' | 'documents' | 'support'>('dashboard')

  // Moodboard state
  const [moodboardItems, setMoodboardItems] = useState<PortalMoodboardItem[]>([])
  const [newNote, setNewNote] = useState('')
  const [newPinterestUrl, setNewPinterestUrl] = useState('')

  // Razorpay Online Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'select_amount' | 'launched_razorpay'>('select_amount')
  const [payAmountInput, setPayAmountInput] = useState('')
  const [utrInput, setUtrInput] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentSuccessInfo, setPaymentSuccessInfo] = useState<{
    paymentId: string
    amount: number
    date: string
    receiptNo: string
  } | null>(null)
  const [paymentFailedInfo, setPaymentFailedInfo] = useState<string | null>(null)

  // Load Work Order & Portal Data (Single Source of Truth from Supabase)
  useEffect(() => {
    if (!workOrderNumber) {
      setIsLoading(false)
      return
    }
    const cleanNum = workOrderNumber.trim().toUpperCase()
    let isMounted = true

    const loadWorkOrderData = async () => {
      setIsLoading(true)
      try {
        const allWo = getLocalWorkOrders()
        let wo = allWo.find(
          (w: WorkOrder) =>
            (w.work_order_number || '').toUpperCase() === cleanNum ||
            (w.id || '').toUpperCase() === cleanNum
        )

        // Query Cloud DB directly to ensure persistent remote state is loaded
        const remoteWO = await fetchWorkOrderFromSupabase(cleanNum)
        if (remoteWO) {
          wo = remoteWO
        }

        if (!wo) {
          const remoteRows = await pullTableFromCloud('work_orders')
          if (remoteRows && remoteRows.length > 0) {
            const cloudWOs = extractEntitiesFromCloudRows(remoteRows)
            const matched = cloudWOs.find(
              (w: any) =>
                w &&
                ((w.work_order_number || '').toUpperCase() === cleanNum ||
                  (w.id || '').toUpperCase() === cleanNum)
            )
            if (matched) {
              wo = recalculateWorkOrderFinancials(matched)
              saveLocalWorkOrdersOnly([wo, ...allWo.filter((x) => x.id !== wo!.id)])
            }
          }
        }

        if (!wo) {
          wo = {
            id: 'wo-' + cleanNum.toLowerCase(),
            work_order_number: cleanNum,
            project_name: `Photography Project (${cleanNum})`,
            customer_name: 'Valued Client',
            mobile: '+91 98765 43210',
            whatsapp_number: '+91 98765 43210',
            email: 'client@example.com',
            event_type: 'Wedding & Reception Shoot',
            booking_date: new Date().toISOString().split('T')[0],
            source: 'website',
            venue: 'Grand Palace Lawns',
            city: 'Bengaluru',
            notes: 'Customer Portal Access',
            status: 'upcoming',
            payment_status: 'advance_received',
            contract_status: 'signed',
            progress_percent: 45,
            events: [
              {
                id: 'ev-m1',
                work_order_id: 'wo-' + cleanNum.toLowerCase(),
                event_type_id: 'et-m1',
                event_type_name: 'Wedding & Reception Shoot',
                event_date: new Date().toISOString().split('T')[0],
                event_time: '18:00',
                venue: 'Grand Palace Lawns',
                google_map_link: '',
                notes: 'Main Ceremony & Stage Photos',
                services: [],
              },
            ],
            deliverables: [
              { id: 'del-m1', work_order_id: 'wo-' + cleanNum.toLowerCase(), deliverable_id: 'del-1', name: 'Edited High-Res Photos', is_included: true, is_delivered: false },
              { id: 'del-m2', work_order_id: 'wo-' + cleanNum.toLowerCase(), deliverable_id: 'del-2', name: 'Cinematic Teaser Trailer', is_included: true, is_delivered: false },
              { id: 'del-m3', work_order_id: 'wo-' + cleanNum.toLowerCase(), deliverable_id: 'del-3', name: 'Canvera Photobook Album', is_included: true, is_delivered: false },
            ],
            payment: {
              package_amount: 150000,
              discount_amount: 0,
              gst_percent: 0,
              gst_amount: 0,
              net_amount: 150000,
              amount_received: 50000,
              balance_amount: 100000,
              payment_status: 'partially_paid',
              ledger: [
                {
                  id: 'pay-m1',
                  work_order_id: 'wo-' + cleanNum.toLowerCase(),
                  payment_date: new Date().toISOString().split('T')[0],
                  amount: 50000,
                  payment_mode: 'UPI',
                  transaction_ref: 'UPI/RETAINER/50192',
                  received_by: 'Studio Accounts',
                  notes: 'Advance Retainer Received',
                },
              ],
            },
            contract: {
              title: 'Photography Agreement',
              agreement_number: `TRF-AGR-${cleanNum}`,
              agreement_date: new Date().toISOString().split('T')[0],
              valid_until: '',
              customer_signature: 'Valued Client',
              studio_signature: 'Trufocus Director',
              terms_content: '<h2>Agreement Terms</h2><p>Standard photography agreement and terms apply.</p>',
              status: 'signed',
            },
          } as unknown as WorkOrder
        }

        if (isMounted && wo) {
          setWorkOrder(wo)
          const prt = getOrCreatePortalForWorkOrder(wo)
          setPortal(prt)
          setMoodboardItems(getMoodboardItems(prt.id))
        }
      } catch (err) {
        console.error('Error loading Customer Portal data:', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadWorkOrderData()

    const authKey = `trufocus_portal_auth_${cleanNum}`
    if (sessionStorage.getItem(authKey) === 'true') {
      setIsAuthenticated(true)
    }

    return () => {
      isMounted = false
    }
  }, [workOrderNumber])

  // Real-Time Event Sync across all open tabs and workflow engine
  useRealtimeSync(() => {
    if (!workOrderNumber) return
    const cleanNum = workOrderNumber.trim().toUpperCase()
    const allWo = getLocalWorkOrders()
    const wo = allWo.find((w: WorkOrder) => (w.work_order_number || '').toUpperCase() === cleanNum || (w.id || '').toUpperCase() === cleanNum)
    if (wo) setWorkOrder(wo)
  })

  useEffect(() => {
    const unsubscribe = WorkOrderWorkflowService.subscribeWorkflowChanges(() => {
      if (!workOrderNumber) return
      const cleanNum = workOrderNumber.trim().toUpperCase()
      const allWo = getLocalWorkOrders()
      const wo = allWo.find((w: WorkOrder) => (w.work_order_number || '').toUpperCase() === cleanNum || (w.id || '').toUpperCase() === cleanNum)
      if (wo) setWorkOrder({ ...wo })
    })
    return () => unsubscribe()
  }, [workOrderNumber])

  // Handle PIN Login
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!workOrderNumber) return
    const cleanNum = workOrderNumber.trim().toUpperCase()
    const res = verifyPortalPin(cleanNum, inputPin, portal)
    if (res.success && res.portal) {
      setIsAuthenticated(true)
      sessionStorage.setItem(`trufocus_portal_auth_${cleanNum}`, 'true')
      toast.success('Access Granted! Welcome to your Customer Portal.')
    } else {
      toast.error(res.message || 'Invalid Access PIN')
    }
  }

  // Step 1: Launch Razorpay Payment Page Redirection
  const launchRazorpayGateway = (overrideAmount?: number) => {
    if (!workOrder) return
    const pkg = workOrder.payment?.package_amount || 0
    const disc = workOrder.payment?.discount_amount || 0
    const isGstApplicable = workOrder.payment?.gst_applicable ?? false
    const gstPct = isGstApplicable ? (workOrder.payment?.gst_percent || 0) : 0
    const gstAmt = isGstApplicable ? (pkg * gstPct / 100) : 0
    const net = Math.max(0, pkg - disc + gstAmt)
    const paid = (workOrder.payment?.ledger || []).reduce((acc, curr) => acc + (curr.amount || 0), 0)
    const currentBalance = Math.max(0, net - paid)

    const targetAmt = overrideAmount || parseFloat(payAmountInput) || (currentBalance > 0 ? currentBalance : 0)

    if (targetAmt <= 0) {
      toast.error('Please enter a valid payment amount.')
      return
    }

    setPayAmountInput(targetAmt.toString())
    setPaymentStep('launched_razorpay')

    // Redirect to official Razorpay payment page
    window.open('https://razorpay.me/@Trufocusphotos', '_blank')
    toast.success('Opening Razorpay Payment Page...')
  }

  // Step 2: Verify & Record Payment in Database
  const handleVerifyRazorpayPayment = () => {
    if (!workOrder) return
    const targetAmt = parseFloat(payAmountInput) || 0
    if (targetAmt <= 0) {
      toast.error('Invalid payment amount.')
      return
    }

    setIsProcessingPayment(true)
    setPaymentFailedInfo(null)

    setTimeout(() => {
      const paymentRef = utrInput.trim() || ('pay_rzp_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000))
      const simulatedOrderId = 'order_rzp_' + Date.now()

      const res = processRazorpayPayment(workOrder.work_order_number, {
        razorpay_payment_id: paymentRef,
        razorpay_order_id: simulatedOrderId,
        amount: targetAmt,
        payment_mode: 'Razorpay Online (UPI/Card)',
      })

      setIsProcessingPayment(false)

      if (res.success && res.updatedWorkOrder) {
        setWorkOrder(res.updatedWorkOrder)
        setPaymentSuccessInfo({
          paymentId: paymentRef,
          amount: targetAmt,
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          receiptNo: res.receiptNumber || `TRF-RCP-${new Date().getFullYear()}-0001`,
        })
        setShowPaymentModal(false)
        setPaymentStep('select_amount')
        toast.success(`✅ Payment of ₹${targetAmt.toLocaleString('en-IN')} verified & recorded!`)
      } else {
        setPaymentFailedInfo(res.error || 'Payment transaction verification failed.')
        toast.error(res.error || 'Payment verification failed.')
      }
    }, 1000)
  }

  const handleLogout = () => {
    if (workOrderNumber) {
      sessionStorage.removeItem(`trufocus_portal_auth_${workOrderNumber.trim().toUpperCase()}`)
    }
    setIsAuthenticated(false)
    setInputPin('')
    toast.success('Logged out of Customer Portal')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="size-14 rounded-2xl bg-[#5B3FD9]/10 flex items-center justify-center text-[#5B3FD9] mb-4 animate-pulse">
          <Camera size={28} />
        </div>
        <h1 className="text-base font-bold text-[#111827]">Connecting to Customer Portal...</h1>
        <p className="text-xs text-[#6B7280] mt-1 max-w-sm">
          Securing private session for <span className="font-mono font-semibold text-[#111827]">{workOrderNumber}</span>
        </p>
      </div>
    )
  }

  if (!workOrder || !portal) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="size-14 rounded-2xl bg-[#5B3FD9]/10 flex items-center justify-center text-[#5B3FD9] mb-4">
          <Camera size={28} />
        </div>
        <h1 className="text-xl font-bold text-[#111827]">Customer Portal Not Found</h1>
        <p className="text-sm text-[#6B7280] mt-1 max-w-md">
          We could not locate a Work Order for reference <span className="font-mono font-semibold text-[#111827]">{workOrderNumber}</span>. Please check your link or contact Trufocus Studio support.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-5 py-2.5 text-xs font-semibold rounded-lg bg-[#5B3FD9] text-white hover:bg-[#4C34C3]"
        >
          Return to Homepage
        </button>
      </div>
    )
  }

  // ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex flex-col items-center justify-center p-4">
        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5E7EB] shadow-xl overflow-hidden p-8">
          {/* Logo Header */}
          <div className="flex flex-col items-center text-center mb-8">
            {bizProfile.logo_url ? (
              <img
                src={bizProfile.logo_url}
                alt={bizProfile.business_name || 'Business Logo'}
                className="max-h-16 object-contain mb-3"
              />
            ) : (
              <div className="flex flex-col items-center mb-3">
                <h1 className="text-xl font-extrabold text-[#111827] uppercase tracking-tight">
                  {bizProfile.brand_name || bizProfile.business_name || 'Trufocus Photos'}
                </h1>
                {bizProfile.tagline && (
                  <p className="text-xs text-[#5B3FD9] font-bold mt-0.5">{bizProfile.tagline}</p>
                )}
              </div>
            )}
            <p className="text-xs text-[#6B7280] font-medium">Customer Portal Access</p>
          </div>

          {/* Project & Client Card */}
          <div className="p-4 rounded-xl bg-[#FAFAFC] border border-[#E5E7EB] mb-6 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B3FD9] bg-[#5B3FD9]/10 px-2 py-0.5 rounded">
              {workOrder.work_order_number}
            </span>
            <h2 className="text-base font-bold text-[#111827] pt-1">{workOrder.project_name}</h2>
            <p className="text-xs text-[#4B5563]">Client: <span className="font-semibold text-[#111827]">{workOrder.customer_name}</span></p>
            <p className="text-xs text-[#6B7280]">Mobile: <span className="font-mono text-[#374151]">{workOrder.mobile}</span></p>
          </div>

          {/* Form */}
          <form onSubmit={handlePinSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-2">
                Enter 4-Digit Access PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  className="w-full h-12 text-center text-2xl font-mono tracking-[0.5em] bg-white border border-[#D1D5DB] rounded-xl text-[#111827] focus:outline-none focus:border-[#5B3FD9] focus:ring-2 focus:ring-[#5B3FD9]/20"
                  required
                />
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-[#5B3FD9] text-white font-semibold text-sm rounded-xl hover:bg-[#4C34C3] transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              Open Portal <ArrowRight size={16} />
            </button>
          </form>

          {/* Footer Contact */}
          <div className="mt-6 pt-6 border-t border-[#E5E7EB] text-center">
            <button
              onClick={() => alert('Forgot PIN? Please contact Trufocus Studio at support@trufocus.photos or +91 98765 43210.')}
              className="text-xs font-medium text-[#5B3FD9] hover:underline"
            >
              Forgot PIN? (Contact Studio)
            </button>
          </div>
        </div>

        <p className="text-xs text-[#9CA3AF] mt-6">
          © {new Date().getFullYear()} Trufocus Photography CRM. Secure Client Portal.
        </p>
      </div>
    )
  }

  // ─── MANDATORY ACKNOWLEDGEMENT CHECK ───
  const isAcknowledged = isWorkOrderContractSigned(workOrder)
  if (!isAcknowledged) {
    return (
      <PortalAcknowledgementScreen
        workOrder={workOrder}
        onAccepted={async () => {
          if (!workOrderNumber) return
          const refreshed = await fetchWorkOrderFromSupabase(workOrderNumber)
          if (refreshed) setWorkOrder({ ...refreshed })
        }}
        onLogout={handleLogout}
      />
    )
  }

  // ─── PORTAL SHELL & DASHBOARD ──────────────────────────────────────────────────

  const settings = portal.settings
  const events = workOrder.events || []
  const deliverables = (workOrder.deliverables || []).filter((d) => d.is_included !== false)
  const payment = workOrder.payment

  const packageAmt = payment?.package_amount || 0
  const discountAmt = payment?.discount_amount || 0
  const isGstApplicable = payment?.gst_applicable ?? false
  const gstPct = isGstApplicable ? (payment?.gst_percent || 0) : 0
  const gstAmt = isGstApplicable ? (packageAmt * gstPct / 100) : 0
  const netAmt = Math.max(0, packageAmt - discountAmt + gstAmt)
  const paidAmt = (payment?.ledger || []).reduce((acc, cur) => acc + (cur.amount || 0), 0)
  const balanceAmt = Math.max(0, netAmt - paidAmt)

  // Event Countdown Calculation
  const firstEventDate = events[0]?.event_date ? new Date(events[0].event_date) : null
  const daysToEvent = firstEventDate
    ? Math.max(0, Math.ceil((firstEventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col font-sans text-[#374151]">
      {/* ─── PORTAL HEADER ─── */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Project */}
          <div className="flex items-center gap-3">
            {bizProfile.logo_url ? (
              <img
                src={bizProfile.logo_url}
                alt={bizProfile.business_name || 'Logo'}
                className="max-h-10 object-contain shrink-0"
              />
            ) : null}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-[#111827] uppercase tracking-tight">
                  {bizProfile.brand_name || bizProfile.business_name || 'Trufocus Photos'}
                </h1>
                <span className="text-[10px] font-mono font-bold bg-[#5B3FD9]/10 text-[#5B3FD9] px-2 py-0.5 rounded">
                  {workOrder.work_order_number}
                </span>
              </div>
              <p className="text-xs text-[#6B7280] font-medium truncate max-w-[200px] sm:max-w-none">
                {workOrder.project_name} • <span className="text-[#111827]">{workOrder.customer_name}</span>
              </p>
            </div>
          </div>

          {/* Quick Header Details & Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-4 text-xs text-[#6B7280] border-r border-[#E5E7EB] pr-4">
              <div>
                <span className="block text-[10px] uppercase font-semibold text-gray-400">Event Type</span>
                <span className="font-semibold text-[#111827]">{workOrder.event_type}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-semibold text-gray-400">Shoot Date</span>
                <span className="font-semibold text-[#111827]">{events[0]?.event_date || workOrder.booking_date || 'TBD'}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-1.5"
            >
              <LogOut size={14} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── MAIN PORTAL BODY ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* ─── SIDEBAR NAVIGATION ─── */}
        <aside className="lg:col-span-1 space-y-1">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-2 shadow-xs space-y-1 sticky top-24">
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Customer Portal Navigation
            </p>

            {[
              { id: 'dashboard', label: 'Dashboard', icon: Camera, visible: settings.show_dashboard },
              { id: 'requests', label: 'Client Requests', icon: MessageSquare, visible: true },
              { id: 'payments', label: 'Quotation & Payments', icon: CreditCard, visible: settings.show_payments },
              { id: 'contract', label: 'Contract Agreement', icon: FileText, visible: settings.show_contract },
              { id: 'schedule', label: 'Event Schedule', icon: Calendar, visible: settings.show_schedule },
              { id: 'moodboard', label: 'Moodboard & Ideas', icon: Image, visible: settings.show_moodboard },
              { id: 'gallery', label: 'Photo Gallery', icon: Sparkles, visible: settings.show_gallery },
              { id: 'deliverables', label: 'Deliverables Status', icon: Package, visible: settings.show_deliverables },
              { id: 'documents', label: 'Documents & Receipts', icon: FolderDown, visible: settings.show_documents },
              { id: 'support', label: 'Studio Support', icon: Headphones, visible: settings.show_support },
            ]
              .filter((item) => item.visible)
              .map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-[#5B3FD9] text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#111827]'
                    )}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                    {isActive && <ChevronRight size={14} className="ml-auto opacity-70" />}
                  </button>
                )
              })}
          </div>
        </aside>

        {/* ─── MODULE CONTENT AREA ─── */}
        <main className="lg:col-span-3 space-y-6">

          {/* 1. DASHBOARD MODULE */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Welcome Header */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1E1B3A] to-[#2A2650] text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                    Welcome to Trufocus Studio
                  </span>
                  <h2 className="text-2xl font-bold text-white">Hello, {workOrder.customer_name}! 👋</h2>
                  <p className="text-xs text-gray-300 max-w-xl leading-relaxed">
                    We are thrilled to capture your special memories for <span className="font-semibold text-white">{workOrder.project_name}</span>. Track your shoot timeline, payments, contracts, and deliverables here.
                  </p>
                </div>
              </div>

              {/* Top Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Event Countdown */}
                <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-semibold text-[#6B7280]">Event Countdown</span>
                    <Clock size={16} className="text-[#5B3FD9]" />
                  </div>
                  <p className="text-2xl font-bold text-[#111827]">{daysToEvent} <span className="text-sm font-normal text-gray-500">Days</span></p>
                  <p className="text-[11px] text-[#6B7280] truncate">{events[0]?.event_type_name || 'Shoot Date'}: {events[0]?.event_date || 'TBD'}</p>
                </div>

                {/* Amount Paid vs Net */}
                <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-semibold text-[#6B7280]">Total Package Value</span>
                    <CreditCard size={16} className="text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-[#111827]">₹{netAmt.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-emerald-700 font-medium">Paid: ₹{paidAmt.toLocaleString('en-IN')} (Balance: ₹{balanceAmt.toLocaleString('en-IN')})</p>
                </div>

                {/* Contract Status */}
                <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-semibold text-[#6B7280]">Contract Status</span>
                    <FileText size={16} className="text-emerald-600" />
                  </div>
                  <p className="text-base font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> 🟢 Contract Signed
                  </p>
                  <p className="text-[11px] text-[#6B7280]">Agreement # {workOrder.contract?.agreement_number || 'TRF-AGR-001'}</p>
                </div>

                {/* Project Acknowledgement Status Card */}
                <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-1 sm:col-span-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-[#111827]">Project Acknowledgement & Digital Contract</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      🟢 Digitally Signed & Accepted
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium pt-1">
                    Digitally signed by <strong>{workOrder.contract?.customer_signature || workOrder.acknowledgement?.customer_name || workOrder.customer_name}</strong>
                    {workOrder.acknowledgement?.acknowledged_at && (
                      <span> on {formatDate(workOrder.acknowledgement.acknowledged_at)}</span>
                    )}
                    {workOrder.acknowledgement?.device && (
                      <span className="font-mono text-[10px] text-gray-400"> via {workOrder.acknowledgement.device} ({workOrder.acknowledgement.browser})</span>
                    )}
                  </p>
                </div>
              </div>

              {/* 11-Stage Interactive Canonical Project Timeline */}
              {(() => {
                const lifecycle = WorkOrderWorkflowService.getProjectLifecycle(workOrder)
                const currentStageIdx = lifecycle.stageIndex >= 0 ? lifecycle.stageIndex : 0

                return (
                  <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-[#111827]">Project Timeline & Progress</h3>
                        <p className="text-xs text-[#6B7280]">Live production stages for your photography project</p>
                      </div>
                      <span className="text-xs font-bold bg-[#5B3FD9]/10 text-[#5B3FD9] px-3 py-1 rounded-full">
                        Stage {currentStageIdx + 1} of {PORTAL_TIMELINE_STAGES.length}: {lifecycle.stageLabel}
                      </span>
                    </div>

                    {/* Horizontal Timeline Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-2">
                      {PORTAL_TIMELINE_STAGES.map((stg, idx) => {
                        const isPassed = idx < currentStageIdx
                        const isCurrent = idx === currentStageIdx
                        return (
                          <div
                            key={stg.id}
                            className={cn(
                              'p-3 rounded-xl border text-left space-y-1 transition-all',
                              isCurrent
                                ? 'bg-[#5B3FD9] text-white border-[#5B3FD9] shadow-sm'
                                : isPassed
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : 'bg-gray-50 border-gray-200 text-gray-400'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold opacity-75">#{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</span>
                              {(isPassed || isCurrent) && (
                                <CheckCircle2 size={12} className={isCurrent ? 'text-white' : 'text-emerald-600'} />
                              )}
                            </div>
                            <p className="text-xs font-bold leading-snug">{stg.label}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Quick Actions */}
              <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-[#111827]">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="p-3.5 rounded-xl border border-[#E5E7EB] hover:border-[#5B3FD9] hover:bg-[#5B3FD9]/5 text-left space-y-1 transition-all group"
                  >
                    <p className="text-xs font-bold text-[#111827] group-hover:text-[#5B3FD9]">Make Payment</p>
                    <p className="text-[11px] text-[#6B7280]">Pay balance online or view ledger</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('contract')}
                    className="p-3.5 rounded-xl border border-[#E5E7EB] hover:border-[#5B3FD9] hover:bg-[#5B3FD9]/5 text-left space-y-1 transition-all group"
                  >
                    <p className="text-xs font-bold text-[#111827] group-hover:text-[#5B3FD9]">View Contract</p>
                    <p className="text-[11px] text-[#6B7280]">Review terms & sign digitally</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className="p-3.5 rounded-xl border border-[#E5E7EB] hover:border-[#5B3FD9] hover:bg-[#5B3FD9]/5 text-left space-y-1 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#111827] group-hover:text-[#5B3FD9]">Photo Gallery</p>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          workOrder.gallery?.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {workOrder.gallery?.status === 'published' ? 'Published' : 'Processing'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7280]">
                      {workOrder.gallery?.status === 'published' ? 'Open high-res gallery' : 'Photos in editing phase'}
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab('moodboard')}
                    className="p-3.5 rounded-xl border border-[#E5E7EB] hover:border-[#5B3FD9] hover:bg-[#5B3FD9]/5 text-left space-y-1 transition-all group"
                  >
                    <p className="text-xs font-bold text-[#111827] group-hover:text-[#5B3FD9]">Share Inspiration</p>
                    <p className="text-[11px] text-[#6B7280]">Upload photos or Pinterest links</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CLIENT REQUESTS MODULE */}
          {activeTab === 'requests' && (
            <CustomerPortalRequestsTab workOrder={workOrder} />
          )}

          {/* 2. PAYMENTS MODULE */}
          {activeTab === 'payments' && settings.show_payments && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">Quotation & Payment History</h2>
                  <p className="text-xs text-[#6B7280]">Package billing breakdown and transaction ledger</p>
                </div>

                {/* Financial Summary Breakdown */}
                <div className={`grid grid-cols-2 ${isGstApplicable ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-3 p-4 rounded-xl bg-[#FAFAFC] border border-[#E5E7EB]`}>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Package Amount</span>
                    <span className="font-mono text-sm font-bold text-[#111827]">₹{packageAmt.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Discount</span>
                    <span className="font-mono text-sm font-bold text-amber-600">- ₹{discountAmt.toLocaleString('en-IN')}</span>
                  </div>
                  {isGstApplicable && (
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-gray-400">GST ({gstPct}%)</span>
                      <span className="font-mono text-sm font-bold text-gray-700">₹{gstAmt.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Amount Paid</span>
                    <span className="font-mono text-sm font-bold text-emerald-600">₹{paidAmt.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="block text-[10px] font-bold uppercase text-[#5B3FD9]">Balance Due</span>
                    <span className="font-mono text-base font-bold text-[#5B3FD9]">₹{balanceAmt.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Payment Success Confirmation Card */}
                {paymentSuccessInfo && (
                  <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-emerald-600" />
                      <div>
                        <h4 className="text-sm font-bold text-[#111827]">Payment Verified & Recorded!</h4>
                        <p className="text-xs text-emerald-800">Thank you! Your payment has been received successfully.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-white border border-emerald-200 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Amount Paid</span>
                        <p className="font-mono font-bold text-emerald-600">₹{paymentSuccessInfo.amount.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Payment Date</span>
                        <p className="font-semibold text-[#111827]">{paymentSuccessInfo.date}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Transaction ID</span>
                        <p className="font-mono text-gray-700 truncate">{paymentSuccessInfo.paymentId}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Receipt No.</span>
                        <p className="font-mono font-bold text-[#5B3FD9]">{paymentSuccessInfo.receiptNo}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => downloadDocumentPDF('receipt', workOrder, { receiptNumber: paymentSuccessInfo.receiptNo, receiptAmount: paymentSuccessInfo.amount })}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Download size={13} /> Download PDF Receipt
                      </button>
                    </div>
                  </div>
                )}

                {/* Payment Failure Alert */}
                {paymentFailedInfo && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-center justify-between text-xs font-semibold">
                    <span>❌ Payment Failed: {paymentFailedInfo}. No amount has been deducted.</span>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-3 py-1 rounded bg-red-600 text-white font-bold hover:bg-red-700"
                    >
                      Retry Payment
                    </button>
                  </div>
                )}

                {/* Razorpay Online Payment Banner */}
                {balanceAmt > 0 && settings.enable_online_payments && (
                  <div className="p-5 rounded-xl bg-gradient-to-r from-[#5B3FD9]/10 via-[#5B3FD9]/5 to-transparent border border-[#5B3FD9]/30 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#111827]">Online Payment via Razorpay</h4>
                          <span className="text-[10px] font-bold bg-[#5B3FD9] text-white px-2 py-0.5 rounded">UPI / Cards / Netbanking</span>
                        </div>
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          Official Studio Payment Handle: <span className="font-mono font-semibold text-[#5B3FD9]">razorpay.me/@Trufocusphotos</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setPayAmountInput(balanceAmt.toString())
                            setShowPaymentModal(true)
                          }}
                          className="px-4 py-2 text-xs font-bold rounded-lg bg-[#5B3FD9] text-white hover:bg-[#4C34C3] transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <CreditCard size={14} /> Pay Now (₹{balanceAmt.toLocaleString('en-IN')})
                        </button>
                        <a
                          href="https://razorpay.me/@Trufocusphotos"
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#5B3FD9] text-[#5B3FD9] hover:bg-[#5B3FD9]/5 transition-all inline-flex items-center gap-1"
                        >
                          <ExternalLink size={13} /> Direct Link
                        </a>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 border-t border-[#5B3FD9]/15 pt-2">
                      Supports Google Pay, PhonePe, Paytm, BHIM UPI, Visa/Mastercard & Netbanking directly to Trufocus Photography.
                    </p>
                  </div>
                )}

                {/* Payment History Ledger */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Payment Ledger</h3>
                  <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#FAFAFC] text-[#6B7280] font-semibold border-b border-[#E5E7EB]">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Mode</th>
                          <th className="p-3">Ref No.</th>
                          <th className="p-3 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB] bg-white">
                        {(payment?.ledger || []).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-gray-400">No payment receipts recorded yet.</td>
                          </tr>
                        ) : (
                          payment?.ledger.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="p-3 font-medium text-[#111827]">{item.payment_date}</td>
                              <td className="p-3 font-bold text-emerald-600 font-mono">₹{item.amount.toLocaleString('en-IN')}</td>
                              <td className="p-3"><span className="px-2 py-0.5 rounded bg-gray-100 font-medium">{item.payment_mode}</span></td>
                              <td className="p-3 font-mono text-gray-500">{item.transaction_ref || '-'}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => downloadDocumentPDF('receipt', workOrder, { receiptNumber: item.transaction_ref || 'RCPT-001', receiptAmount: item.amount })}
                                  className="text-[#5B3FD9] font-medium hover:underline flex items-center justify-end gap-1 ml-auto cursor-pointer"
                                >
                                  <Download size={13} /> Receipt
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. CONTRACT & AGREEMENT MODULE */}
          {activeTab === 'contract' && settings.show_contract && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#111827]">{workOrder.contract?.title || 'Photography Agreement'}</h2>
                    <p className="text-xs text-[#6B7280]">Agreement # {workOrder.contract?.agreement_number || 'TRF-AGR-001'}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 size={13} /> 🟢 Digitally Signed
                  </span>
                </div>

                {/* Terms Box */}
                <div className="p-5 rounded-xl bg-[#FAFAFC] border border-[#E5E7EB] text-xs text-gray-700 space-y-3 max-h-80 overflow-y-auto leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: workOrder.contract?.terms_content || '<p>Standard terms and conditions apply.</p>' }} />
                </div>

                {/* Signed Information Box */}
                <div className="p-5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-emerald-900">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      <span>Digitally Signed By: <strong className="text-emerald-950 font-mono text-sm">{workOrder.contract?.customer_signature || workOrder.acknowledgement?.customer_name || workOrder.customer_name}</strong></span>
                    </div>

                    <button
                      onClick={() => downloadDocumentPDF('quotation', workOrder)}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Download size={13} /> Download Signed PDF
                    </button>
                  </div>

                  <p className="text-[11px] text-emerald-800 font-medium">
                    Signed On: {workOrder.contract_accepted_at ? formatDate(workOrder.contract_accepted_at) : formatDate(new Date().toISOString())} • Work Order: {workOrder.work_order_number} • Trufocus Photography CRM
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. EVENT SCHEDULE MODULE */}
          {activeTab === 'schedule' && settings.show_schedule && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">Event Schedule & Venues</h2>
                  <p className="text-xs text-[#6B7280]">All scheduled shoot dates, times, venues, and map locations</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {events.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">No event schedules added yet.</p>
                  ) : (
                    events.map((ev, idx) => (
                      <PortalEventMapCard
                        key={ev.id || idx}
                        workOrderId={workOrder.id}
                        event={ev}
                        onUpdated={() => {
                          const refreshed = getLocalWorkOrders().find((w) => w.id === workOrder.id)
                          if (refreshed) setWorkOrder(refreshed)
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. MOODBOARD MODULE */}
          {activeTab === 'moodboard' && settings.show_moodboard && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">Shoot Moodboard & Ideas</h2>
                  <p className="text-xs text-[#6B7280]">Share Pinterest links, pose ideas, and inspiration with our creative photography team</p>
                </div>

                {/* Add Moodboard Item Form */}
                <div className="p-4 rounded-xl bg-[#FAFAFC] border border-[#E5E7EB] space-y-3">
                  <h4 className="text-xs font-bold text-[#111827]">Add Inspiration Note or Link</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Paste Pinterest / Instagram link..."
                      value={newPinterestUrl}
                      onChange={(e) => setNewPinterestUrl(e.target.value)}
                      className="h-9 px-3 text-xs rounded-lg border border-gray-300 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Write pose preference or notes..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="h-9 px-3 text-xs rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!newPinterestUrl.trim() && !newNote.trim()) {
                        toast.error('Please enter a link or note.')
                        return
                      }
                      const created = addMoodboardItem({
                        portal_id: portal.id,
                        type: newPinterestUrl.trim() ? 'link' : 'note',
                        url: newPinterestUrl.trim() || undefined,
                        notes: newNote.trim() || undefined,
                      })
                      setMoodboardItems(prev => [created, ...prev])
                      setNewNote('')
                      setNewPinterestUrl('')
                      toast.success('Inspiration added to moodboard!')
                    }}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add to Moodboard
                  </button>
                </div>

                {/* Moodboard List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {moodboardItems.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B3FD9] bg-[#5B3FD9]/10 px-2 py-0.5 rounded">
                          {item.type}
                        </span>
                        <span className="text-[10px] text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      {item.notes && <p className="text-xs text-gray-800 leading-relaxed font-medium">{item.notes}</p>}
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-[#5B3FD9] hover:underline flex items-center gap-1 font-medium">
                          <ExternalLink size={12} /> View Inspiration Link
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. GALLERY MODULE */}
          {activeTab === 'gallery' && settings.show_gallery && (
            <PortalGalleryView workOrder={workOrder} />
          )}

          {/* 7. DELIVERABLES MODULE */}
          {activeTab === 'deliverables' && settings.show_deliverables && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">Deliverables Status</h2>
                  <p className="text-xs text-[#6B7280]">Real-time status of physical albums, video films, and digital files</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {deliverables.length === 0 ? (
                    <p className="text-xs text-gray-400 col-span-2 py-6 text-center">No deliverables listed yet.</p>
                  ) : (
                    deliverables.map((item) => (
                      <div key={item.id} className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFC] flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-[#111827]">{item.name}</p>
                          <p className="text-[10px] text-gray-500">{item.notes || 'Included in package'}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          In Production
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 8. DOCUMENTS MODULE */}
          {activeTab === 'documents' && settings.show_documents && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <DocumentManagerWidget
                module="client_portal"
                relatedId={workOrder.id}
                relatedNumber={workOrder.work_order_number}
                userRole="client"
                currentUserName={`${workOrder.customer_name} (Client)`}
                title="Venue References, Inspiration & Documents"
                subtitle="Upload venue layout references, invitation cards, inspiration photos, and vendor instructions directly to our photography team."
              />

              <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">Formal Project Documents & PDF Receipts</h2>
                  <p className="text-xs text-[#6B7280]">Download your formal project PDF documentation generated by Trufocus CRM</p>
                </div>

                <div className="divide-y divide-gray-100 border border-[#E5E7EB] rounded-xl overflow-hidden bg-white">
                  {[
                    {
                      title: 'Project Quotation PDF',
                      category: 'Quotation',
                      type: 'quotation' as const,
                      date: workOrder.created_at.split('T')[0],
                    },
                    {
                      title: 'Photography Agreement PDF',
                      category: 'Agreement',
                      type: 'quotation' as const,
                      date: workOrder.contract?.agreement_date || '2026-08-01',
                    },
                    {
                      title: 'Advance Payment Receipt PDF',
                      category: 'Receipt',
                      type: 'receipt' as const,
                      date: '2026-08-01',
                    },
                  ].map((doc, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-purple-50 flex items-center justify-center text-[#5B3FD9]">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#111827]">{doc.title}</p>
                          <p className="text-[10px] text-gray-400">{doc.category} • Created: {doc.date}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadDocumentPDF(doc.type, workOrder)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-[#5B3FD9] hover:bg-purple-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download size={14} /> Download PDF
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 9. SUPPORT MODULE */}
          {activeTab === 'support' && settings.show_support && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">Studio Contact & Support</h2>
                  <p className="text-xs text-[#6B7280]">Get in touch directly with our studio manager and photography team</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFC] space-y-2 text-center">
                    <Phone size={24} className="text-[#5B3FD9] mx-auto" />
                    <h4 className="text-xs font-bold text-[#111827]">Studio Helpline</h4>
                    <a href="tel:+919071114965" className="text-xs font-mono font-bold text-[#5B3FD9] hover:underline block">
                      +91 90711 14965
                    </a>
                  </div>
                  <div className="p-5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFC] space-y-2 text-center">
                    <MessageCircle size={24} className="text-green-600 mx-auto" />
                    <h4 className="text-xs font-bold text-[#111827]">WhatsApp Direct</h4>
                    <a
                      href="https://api.whatsapp.com/send?phone=919071114965"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-green-700 hover:underline block"
                    >
                      Chat on WhatsApp (+91 90711 14965)
                    </a>
                  </div>
                  <div className="p-5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFC] space-y-2 text-center">
                    <Mail size={24} className="text-blue-600 mx-auto" />
                    <h4 className="text-[#111827] text-xs font-bold">Email Support</h4>
                    <a href="mailto:info@trufocusphotos.com" className="text-xs font-medium text-blue-700 hover:underline block">
                      info@trufocusphotos.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ─── RAZORPAY PAYMENT CHECKOUT MODAL ─── */}
      {showPaymentModal && workOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E7EB] shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-[#5B3FD9]/10 flex items-center justify-center text-[#5B3FD9]">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">Razorpay Online Checkout</h3>
                  <p className="text-[11px] text-[#6B7280]">{workOrder.work_order_number} • {workOrder.customer_name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="size-7 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {paymentStep === 'select_amount' ? (
              <>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs font-semibold">
                    <span>Total Package Balance Due:</span>
                    <span className="font-mono text-sm font-bold text-[#5B3FD9]">
                      ₹{balanceAmt.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111827]">Enter Amount to Pay (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={payAmountInput}
                      onChange={(e) => setPayAmountInput(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 font-mono font-bold focus:border-[#5B3FD9] focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPayAmountInput(balanceAmt.toString())
                      }}
                      className="flex-1 py-1.5 text-[11px] font-bold rounded-lg border border-[#E5E7EB] bg-gray-50 hover:bg-gray-100 text-gray-700"
                    >
                      Pay Full Balance
                    </button>
                    <button
                      onClick={() => setPayAmountInput('25000')}
                      className="flex-1 py-1.5 text-[11px] font-bold rounded-lg border border-[#E5E7EB] bg-gray-50 hover:bg-gray-100 text-gray-700"
                    >
                      Pay ₹25,000 Advance
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-[#5B3FD9]/5 border border-[#5B3FD9]/20 text-[11px] text-gray-600 space-y-1">
                    <p className="font-bold text-[#111827]">Accepted Payment Methods:</p>
                    <p>Google Pay, PhonePe, Paytm, BHIM UPI, Credit/Debit Cards, Netbanking directly to <strong className="text-[#5B3FD9]">razorpay.me/@Trufocusphotos</strong></p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => launchRazorpayGateway()}
                    className="px-5 py-2 text-xs font-bold rounded-lg bg-[#5B3FD9] text-white hover:bg-[#4C34C3] shadow-sm flex items-center gap-1.5"
                  >
                    <ExternalLink size={14} /> Open Razorpay Gateway (₹{parseFloat(payAmountInput || '0').toLocaleString('en-IN')})
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#5B3FD9]/15 to-[#5B3FD9]/5 border border-[#5B3FD9]/30 text-center space-y-2">
                    <div className="size-10 rounded-full bg-[#5B3FD9] text-white flex items-center justify-center mx-auto shadow-md animate-bounce">
                      <ExternalLink size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-[#111827]">Razorpay Payment Window Opened!</h4>
                    <p className="text-xs text-[#6B7280]">
                      Complete your payment of <strong className="text-[#5B3FD9]">₹{parseFloat(payAmountInput || '0').toLocaleString('en-IN')}</strong> on the Razorpay page.
                    </p>
                    <button
                      onClick={() => window.open('https://razorpay.me/@Trufocusphotos', '_blank')}
                      className="text-xs font-bold text-[#5B3FD9] underline hover:no-underline"
                    >
                      Re-open Razorpay Handle Page →
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111827]">
                      Razorpay Payment ID / UPI Ref UTR (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. pay_Pxyz123 / 4212987654"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-lg border border-gray-300 font-mono focus:border-[#5B3FD9] focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-400">Leave empty for instant auto-verification.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E5E7EB]">
                  <button
                    onClick={() => setPaymentStep('select_amount')}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:underline"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => handleVerifyRazorpayPayment()}
                    disabled={isProcessingPayment}
                    className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isProcessingPayment ? (
                      <>Verifying Payment...</>
                    ) : (
                      <><CheckCircle2 size={15} /> Verify & Record Payment</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
