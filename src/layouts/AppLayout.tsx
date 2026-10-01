import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { cn } from '@/utils/cn'

/**
 * The main authenticated application shell.
 * Renders the Sidebar + Header + responsive page content area.
 */
export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main area: offset by sidebar width on desktop, 100% full width on mobile */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300 ease-in-out ml-0',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
        )}
      >
        {/* Header */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Page Content */}
        <main
          className="flex-1 mt-16 p-3 sm:p-6 overflow-y-auto max-w-full"
          style={{ minHeight: 'calc(100vh - var(--header-height))' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
