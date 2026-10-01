import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, ChevronDown, User, Settings, LogOut, Moon, Menu } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { globalSearch } from '@/services/dashboardService'
import { ActiveRoleSwitcher } from '@/components/common/ActiveRoleSwitcher'

// ─── Route Title Map ──────────────────────────────────────────────────────────

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/enquiries': 'Enquiries',
  '/projects': 'Work Orders',
  '/post-production': 'Post Production',
  '/data': 'Data',
  '/team': 'Team',
  '/finances': 'Finances',
  '/client-requests': 'Client Requests',
  '/ai': 'Trufocus AI',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/how-it-works': 'How it Works',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  sidebarCollapsed: boolean
  onOpenMobileMenu?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Header({ sidebarCollapsed, onOpenMobileMenu }: HeaderProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const debouncedSearch = useDebounce(searchQuery, 300)

  const pageTitle = routeTitles[pathname] ?? 'Trufocus CRM'

  // TODO: wire up debouncedSearch when search service is ready
  void debouncedSearch

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    setShowProfile(false)
    await signOut()
  }

  const unreadCount = 3

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16',
        'bg-white border-b border-[#E5E7EB]',
        'flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 shadow-2xs',
        'transition-all duration-300 ease-in-out',
        'left-0',
        sidebarCollapsed ? 'md:left-16' : 'md:left-60'
      )}
    >
      {/* ─── Mobile Hamburger Menu + Page Title ─── */}
      <div className="flex items-center gap-2 font-extrabold text-[#111827]">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          aria-label="Open Mobile Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-sm sm:text-base font-extrabold text-[#111827] shrink-0 truncate">
          {pageTitle}
        </h1>
      </div>

      {/* ─── Search Bar Center ─── */}
      <div className="flex-1 max-w-md mx-auto relative">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            placeholder="Search customer, phone, WO#, invoice, gallery..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full h-9 pl-9 pr-4 text-xs font-medium',
              'bg-[#F9FAFB] text-[#111827]',
              'border border-[#E5E7EB] rounded-[10px]',
              'placeholder:text-gray-400',
              'focus:outline-none focus:bg-white focus:border-[#5B3FD9] focus:ring-2 focus:ring-[#5B3FD9]/15',
              'transition-all duration-150'
            )}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-white px-1.5 py-0.5 rounded border border-[#E5E7EB] hidden sm:inline-flex font-mono">
            ⌘K
          </kbd>
        </div>

        {/* Live Search Results Dropdown */}
        {searchQuery.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#E5E7EB] rounded-[12px] shadow-lg overflow-hidden z-50 divide-y divide-gray-100">
            {globalSearch(searchQuery).length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">No records found matching "{searchQuery}".</div>
            ) : (
              globalSearch(searchQuery).map((res) => (
                <button
                  key={res.id}
                  onClick={() => {
                    setSearchQuery('')
                    navigate(res.link)
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 flex items-center justify-between transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-[#111827]">{res.title}</p>
                    <p className="text-[11px] text-gray-500">{res.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-semibold bg-[#5B3FD9]/10 text-[#5B3FD9] px-2 py-0.5 rounded">
                    {res.category}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* ─── Right Controls ─── */}
      <div className="ml-auto flex items-center gap-2">
        <ActiveRoleSwitcher />

        {/* Notification Bell */}
        <div ref={notificationRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications((v) => !v)
              setShowProfile(false)
            }}
            className={cn(
              'relative size-9 rounded-[10px] flex items-center justify-center',
              'text-gray-500 hover:text-[#111827] hover:bg-gray-100 transition-colors duration-150',
              showNotifications && 'bg-gray-100 text-[#111827]'
            )}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 size-2 rounded-full bg-[#5B3FD9] ring-2 ring-white" />
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <NotificationDropdown
              count={unreadCount}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>

        {/* Active Role Switcher Badge */}
        <ActiveRoleSwitcher />

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => {
              setShowProfile((v) => !v)
              setShowNotifications(false)
            }}
            className={cn(
              'flex items-center gap-2 h-9 pl-1 pr-2 rounded-[10px]',
              'hover:bg-gray-100 transition-colors duration-150',
              showProfile && 'bg-gray-100'
            )}
            aria-label="Profile menu"
          >
            <Avatar
              src={user?.avatar_url}
              name={user?.full_name ?? user?.email}
              size="sm"
            />
            <ChevronDown
              size={14}
              className={cn(
                'text-gray-400 transition-transform duration-150',
                showProfile && 'rotate-180'
              )}
            />
          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <ProfileDropdown user={user} onSignOut={handleSignOut} onClose={() => setShowProfile(false)} />
          )}
        </div>
      </div>
    </header>
  )
}

// ─── Notification Dropdown ────────────────────────────────────────────────────

function NotificationDropdown({ onClose }: { count: number; onClose: () => void }) {
  const notifications = [
    { id: '1', title: 'New Enquiry', message: 'Sarah Johnson submitted a new enquiry', time: '2m ago', unread: true },
    { id: '2', title: 'Payment Received', message: 'Invoice #INV-2024-001 has been paid', time: '1h ago', unread: true },
    { id: '3', title: 'Project Update', message: 'Wedding shoot edited and ready for review', time: '3h ago', unread: true },
  ]

  return (
    <div
      className={cn(
        'absolute right-0 top-full mt-2 w-80 z-50',
        'bg-white rounded-[12px]',
        'border border-[#E5E7EB]',
        'shadow-lg',
        'overflow-hidden'
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
        <span className="text-sm font-semibold text-[#111827]">Notifications</span>
        <button
          onClick={onClose}
          className="text-xs text-[#5B3FD9] font-medium hover:underline"
        >
          Mark all read
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={cn(
              'px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer',
              n.unread && 'bg-[#5B3FD9]/5'
            )}
          >
            <div className="flex items-start gap-2">
              {n.unread && (
                <span className="mt-1.5 size-1.5 rounded-full bg-[#5B3FD9] shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111827]">{n.title}</p>
                <p className="text-xs text-gray-500 truncate">{n.message}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-[#E5E7EB] bg-gray-50">
        <button className="text-xs font-medium text-[#5B3FD9] hover:underline w-full text-center">
          View all notifications
        </button>
      </div>
    </div>
  )
}

// ─── Profile Dropdown ─────────────────────────────────────────────────────────

interface ProfileDropdownProps {
  user: { full_name?: string | null; email?: string; role?: string; role_name?: string } | null
  onSignOut: () => void
  onClose: () => void
}

function ProfileDropdown({ user, onSignOut, onClose }: ProfileDropdownProps) {
  return (
    <div
      className={cn(
        'absolute right-0 top-full mt-2 w-56 z-50',
        'bg-white rounded-[12px]',
        'border border-[#E5E7EB]',
        'shadow-lg',
        'overflow-hidden'
      )}
    >
      <div className="px-4 py-3 border-b border-[#E5E7EB]">
        <p className="text-sm font-semibold text-[#111827]">
          {user?.full_name ?? 'Staff Member'}
        </p>
        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        <p className="text-[10px] text-[#5B3FD9] font-semibold capitalize mt-0.5">
          {user?.role_name ?? user?.role ?? 'Staff'}
        </p>
      </div>

      <div className="py-1">
        {[
          { icon: User, label: 'Profile', href: '/profile' },
          { icon: Settings, label: 'Settings', href: '/settings' },
          { icon: Moon, label: 'Appearance', href: '/settings' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={onClose}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2 text-xs font-medium',
              'text-gray-700 hover:text-[#111827]',
              'hover:bg-gray-50 transition-colors duration-150'
            )}
          >
            <item.icon size={15} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="border-t border-[#E5E7EB] py-1">
        <button
          onClick={onSignOut}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2 text-xs font-medium',
            'text-red-600 hover:bg-red-50',
            'transition-colors duration-150'
          )}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  )
}
