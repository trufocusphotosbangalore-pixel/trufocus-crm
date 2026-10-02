import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { initCloudDatabaseSync } from '@/services/cloudSyncService'

// Guards
import { ProtectedRoute, PublicRoute } from '@/components/common/RouteGuard'
import { ProtectedModuleRoute } from '@/components/common/ProtectedModuleRoute'

// Auth Provider
import { AuthContext, useAuthProvider } from '@/hooks/useAuth'

const AuthLayout = lazy(() => import('@/layouts/AuthLayout').then((m) => ({ default: m.AuthLayout })))
const AppLayout = lazy(() => import('@/layouts/AppLayout').then((m) => ({ default: m.AppLayout })))

const Login = lazy(() => import('@/pages/auth/Login'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))
const DataManagementPage = lazy(() => import('@/pages/data/DataManagementPage'))
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'))
const Enquiries = lazy(() => import('@/pages/enquiries/Enquiries'))
const WorkOrders = lazy(() => import('@/pages/projects/WorkOrders'))
const WorkOrderNewPage = lazy(() => import('@/pages/projects/WorkOrderNewPage'))
const WorkOrderDetailsPage = lazy(() => import('@/pages/projects/WorkOrderDetailsPage'))
const PostProduction = lazy(() => import('@/pages/post-production/PostProductionPage'))
const DirectSalesPage = lazy(() => import('@/pages/directSales/DirectSalesPage'))
const TeamDirectoryPage = lazy(() => import('@/pages/team/TeamDirectoryPage'))
const AttendancePage = lazy(() => import('@/pages/team/AttendancePage'))
const TeamRolesPage = lazy(() => import('@/pages/team/TeamRolesPage'))
const Finances = lazy(() => import('@/pages/finances/Finances'))
const ClientRequestsPage = lazy(() => import('@/pages/requests/ClientRequestsPage'))
const TrufocusAI = lazy(() => import('@/pages/ai/TrufocusAI'))
const Profile = lazy(() => import('@/pages/profile/Profile'))
const SettingsPage = lazy(() => import('@/pages/settings/Settings'))
const HowItWorks = lazy(() => import('@/pages/how-it-works/HowItWorks'))
const CustomerPortal = lazy(() => import('@/pages/portal/CustomerPortal'))
const PublicEnquiryPage = lazy(() => import('@/pages/public/PublicEnquiryPage'))
const PublicQuotationPage = lazy(() => import('@/pages/portal/PublicQuotationPage'))
const TeamDirectoryPreviewPage = lazy(() => import('@/pages/dev/TeamDirectoryPreviewPage'))

// Crew Portal Lazy Components
const CrewLayout = lazy(() => import('@/layouts/CrewLayout').then((m) => ({ default: m.CrewLayout })))
const CrewLogin = lazy(() => import('@/pages/crew/CrewLogin'))
const CrewDashboard = lazy(() => import('@/pages/crew/CrewDashboard'))
const CrewAssignmentsPage = lazy(() => import('@/pages/crew/CrewAssignmentsPage'))
const CrewTodaySchedulePage = lazy(() => import('@/pages/crew/CrewTodaySchedulePage'))
const CrewCalendarPage = lazy(() => import('@/pages/crew/CrewCalendarPage'))
const CrewMyShootsPage = lazy(() => import('@/pages/crew/CrewMyShootsPage'))
const CrewMyEditingPage = lazy(() => import('@/pages/crew/CrewMyEditingPage'))
const CrewAttendancePage = lazy(() => import('@/pages/crew/CrewAttendancePage'))
const CrewEquipmentPage = lazy(() => import('@/pages/crew/CrewEquipmentPage'))
const CrewReportsPage = lazy(() => import('@/pages/crew/CrewReportsPage'))
const CrewHelpCenterPage = lazy(() => import('@/pages/crew/CrewHelpCenterPage'))
const CrewNotificationsPage = lazy(() => import('@/pages/crew/CrewNotificationsPage'))
const CrewAiAssistantPage = lazy(() => import('@/pages/crew/CrewAiAssistantPage'))
const CrewProfilePage = lazy(() => import('@/pages/crew/CrewProfilePage'))

// ─── Auth Provider ────────────────────────────────────────────────────────────

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  useEffect(() => {
    initCloudDatabaseSync()
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              boxShadow: 'var(--shadow-dropdown)',
            },
            success: {
              iconTheme: {
                primary: 'var(--color-success)',
                secondary: 'var(--color-bg-elevated)',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--color-error)',
                secondary: 'var(--color-bg-elevated)',
              },
            },
          }}
        />

        <Suspense fallback={<div className="p-4 text-xs text-[var(--color-text-muted)]">Loading...</div>}>
          <Routes>
            {/* ── Public Customer Portal & Landing Page Routes ── */}
            <Route path="/portal/customer/:workOrderNumber" element={<CustomerPortal />} />
            <Route path="/portal/quotation/:quotationNumber" element={<PublicQuotationPage />} />
            <Route path="/enquiry/:landingId" element={<PublicEnquiryPage />} />

            {/* ── Trufocus Crew Portal Routes ── */}
            <Route path="/crew/login" element={<CrewLogin />} />
            <Route path="/crew" element={<CrewLayout />}>
              <Route index element={<Navigate to="/crew/dashboard" replace />} />
              <Route path="dashboard" element={<CrewDashboard />} />
              <Route path="assignments" element={<CrewAssignmentsPage />} />
              <Route path="schedule" element={<CrewTodaySchedulePage />} />
              <Route path="calendar" element={<CrewCalendarPage />} />
              <Route path="shoots" element={<CrewMyShootsPage />} />
              <Route path="editing" element={<CrewMyEditingPage />} />
              <Route path="attendance" element={<CrewAttendancePage />} />
              <Route path="equipment" element={<CrewEquipmentPage />} />
              <Route path="reports" element={<CrewReportsPage />} />
              <Route path="help-center" element={<CrewHelpCenterPage />} />
              <Route path="notifications" element={<CrewNotificationsPage />} />
              <Route path="ai" element={<CrewAiAssistantPage />} />
              <Route path="ai-assistant" element={<CrewAiAssistantPage />} />
              <Route path="profile" element={<CrewProfilePage />} />
              <Route path="*" element={<Navigate to="/crew/dashboard" replace />} />
            </Route>

            {/* ── Auth routes (redirect to dashboard if logged in) ── */}
            <Route element={<PublicRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>
            </Route>

            {/* ── Protected app routes ── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                {/* ── Core CRM & ERP Module Routes ── */}
                <Route path="/dashboard" element={<ProtectedModuleRoute module="dashboard"><Dashboard /></ProtectedModuleRoute>} />
                <Route path="/customers" element={<ProtectedModuleRoute module="enquiries"><Enquiries /></ProtectedModuleRoute>} />
                <Route path="/enquiries" element={<ProtectedModuleRoute module="enquiries"><Enquiries /></ProtectedModuleRoute>} />
                <Route path="/quotations" element={<ProtectedModuleRoute module="enquiries"><Enquiries /></ProtectedModuleRoute>} />
                <Route path="/projects" element={<ProtectedModuleRoute module="work_orders"><WorkOrders /></ProtectedModuleRoute>} />
                <Route path="/work-orders" element={<ProtectedModuleRoute module="work_orders"><WorkOrders /></ProtectedModuleRoute>} />
                <Route path="/work-orders/new" element={<ProtectedModuleRoute module="work_orders"><WorkOrderNewPage /></ProtectedModuleRoute>} />
                <Route path="/work-orders/:workOrderId" element={<ProtectedModuleRoute module="work_orders"><WorkOrderDetailsPage /></ProtectedModuleRoute>} />
                <Route path="/workflow" element={<ProtectedModuleRoute module="work_orders"><WorkOrders /></ProtectedModuleRoute>} />
                <Route path="/calendar" element={<ProtectedModuleRoute module="work_orders"><WorkOrders /></ProtectedModuleRoute>} />
                <Route path="/post-production" element={<ProtectedModuleRoute module="post_production"><PostProduction /></ProtectedModuleRoute>} />
                <Route path="/data" element={<ProtectedModuleRoute module="data"><DataManagementPage /></ProtectedModuleRoute>} />
                <Route path="/direct-sales" element={<ProtectedModuleRoute module="finances"><DirectSalesPage /></ProtectedModuleRoute>} />
                <Route path="/billing" element={<ProtectedModuleRoute module="finances"><Finances /></ProtectedModuleRoute>} />
                <Route path="/receipts" element={<ProtectedModuleRoute module="finances"><Finances /></ProtectedModuleRoute>} />
                <Route path="/ledger" element={<ProtectedModuleRoute module="finances"><Finances /></ProtectedModuleRoute>} />
                <Route path="/reports" element={<ProtectedModuleRoute module="finances"><Finances /></ProtectedModuleRoute>} />
                <Route path="/team" element={<Navigate to="/team/directory" replace />} />
                <Route path="/team/directory" element={<ProtectedModuleRoute module="team"><TeamDirectoryPage /></ProtectedModuleRoute>} />
                <Route path="/team/attendance" element={<ProtectedModuleRoute module="team"><AttendancePage /></ProtectedModuleRoute>} />
                <Route path="/team/roles" element={<ProtectedModuleRoute module="team"><TeamRolesPage /></ProtectedModuleRoute>} />
                <Route path="/finances" element={<ProtectedModuleRoute module="finances"><Finances /></ProtectedModuleRoute>} />
                <Route path="/requests" element={<ProtectedModuleRoute module="client_requests"><ClientRequestsPage /></ProtectedModuleRoute>} />
                <Route path="/client-requests" element={<ProtectedModuleRoute module="client_requests"><ClientRequestsPage /></ProtectedModuleRoute>} />
                <Route path="/ai" element={<ProtectedModuleRoute module="trufocus_ai"><TrufocusAI /></ProtectedModuleRoute>} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/masters" element={<ProtectedModuleRoute module="settings"><SettingsPage /></ProtectedModuleRoute>} />
                <Route path="/settings" element={<ProtectedModuleRoute module="settings"><SettingsPage /></ProtectedModuleRoute>} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                {import.meta.env.DEV && (
                  <Route path="/dev/team-directory-preview" element={<TeamDirectoryPreviewPage />} />
                )}
              </Route>
            </Route>

            {/* ── Catch-all ── */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
