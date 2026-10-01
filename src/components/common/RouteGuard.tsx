import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

/**
 * Guards authenticated routes.
 * Shows a loading screen while session is being resolved.
 * Redirects to /login if unauthenticated.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="space-y-4 text-center">
          <div className="size-12 rounded-2xl bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center mx-auto animate-pulse border border-[#5B3FD9]/20">
            <span className="font-black text-lg">TF</span>
          </div>
          <p className="text-xs font-bold text-gray-600">Loading Trufocus Studio Control Center...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

/**
 * Guards public-only routes (auth pages).
 * Redirects authenticated users to the dashboard.
 */
export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="space-y-4 text-center">
          <div className="size-12 rounded-2xl bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center mx-auto animate-pulse border border-[#5B3FD9]/20">
            <span className="font-black text-lg">TF</span>
          </div>
          <p className="text-xs font-bold text-gray-600">Verifying session...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}
