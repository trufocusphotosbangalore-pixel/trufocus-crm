import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { loadBusinessProfile } from '@/services/businessProfileStore'
import {
  LayoutDashboard,
  MessageSquare,
  FolderKanban,
  Film,
  Database,
  ShoppingBag,
  CreditCard,
  Inbox,
  Sparkles,
  User,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'
import type { NavItem } from '@/types/common'

import { useTeamPermissions } from '@/hooks/useTeamPermissions'
import type { CrmModuleId } from '@/types/teamAccess'

// ─── Nav Item Definitions ─────────────────────────────────────────────────────

const mainNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { id: 'enquiries', label: 'Enquiries', path: '/enquiries', icon: MessageSquare },
  { id: 'projects', label: 'Work Orders', path: '/projects', icon: FolderKanban },
  { id: 'post-production', label: 'Post Production', path: '/post-production', icon: Film },
  { id: 'data', label: 'Data', path: '/data', icon: Database },
  { id: 'direct-sales', label: 'Direct Sales', path: '/direct-sales', icon: ShoppingBag },
  { id: 'team', label: 'Team Workspace', path: '/team/directory', icon: Users },
  { id: 'finances', label: 'Finances', path: '/finances', icon: CreditCard },
  { id: 'client-requests', label: 'Client Requests', path: '/client-requests', icon: Inbox },
]

const accountNavItems: NavItem[] = [
  { id: 'ai', label: 'Trufocus AI', path: '/ai', icon: Sparkles },
  { id: 'profile', label: 'Profile', path: '/profile', icon: User },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
  { id: 'how-it-works', label: 'How it Works', path: '/how-it-works', icon: HelpCircle },
]

const navToModuleMap: Record<string, CrmModuleId> = {
  dashboard: 'dashboard',
  enquiries: 'enquiries',
  projects: 'work_orders',
  'post-production': 'post_production',
  data: 'data',
  'direct-sales': 'finances',
  team: 'team',
  finances: 'finances',
  'client-requests': 'client_requests',
  ai: 'trufocus_ai',
  settings: 'settings',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { canAccessModule } = useTeamPermissions()
  const [bizProfile, setBizProfile] = useState(() => loadBusinessProfile())

  useEffect(() => {
    const handleSync = () => {
      setBizProfile(loadBusinessProfile())
    }
    window.addEventListener('trufocus_business_profile_updated', handleSync)
    return () => window.removeEventListener('trufocus_business_profile_updated', handleSync)
  }, [])

  const wsRole = (user?.workspace_role || user?.role || 'owner').toLowerCase()

  const customizedMainNavItems = mainNavItems.map((item) => {
    if (item.id === 'dashboard') {
      let customLabel = 'Dashboard'
      if (wsRole === 'photographer') customLabel = '📷 My Shoots'
      else if (wsRole === 'videographer') customLabel = '🎥 My Video Shoots'
      else if (wsRole === 'photo_editor') customLabel = '🎨 My Photo Queue'
      else if (wsRole === 'video_editor') customLabel = '🎬 My Video Queue'
      else if (wsRole === 'album_designer') customLabel = '📖 My Album Queue'
      else if (wsRole === 'manager') customLabel = '📊 Operations Workspace'
      else if (wsRole === 'finance') customLabel = '💰 Finance Workspace'
      else if (wsRole === 'sales_executive') customLabel = '📞 Sales & Enquiries'
      else if (wsRole === 'data_operator') customLabel = '🖥 Data & Drives'
      else if (wsRole === 'client_manager') customLabel = '🤝 Client Portal Tickets'
      return { ...item, label: customLabel }
    }
    return item
  })

  const visibleMainNav = customizedMainNavItems.filter((item) => {
    const modId = navToModuleMap[item.id]
    if (!modId) return true
    if (user?.module_access && typeof user.module_access[modId] === 'boolean') {
      return user.module_access[modId]
    }
    return canAccessModule(modId)
  })

  const visibleAccountNav = accountNavItems.filter((item) => {
    const modId = navToModuleMap[item.id]
    if (!modId) return true
    if (user?.module_access && typeof user.module_access[modId] === 'boolean') {
      return user.module_access[modId]
    }
    return canAccessModule(modId)
  })

  const handleSignOut = async () => {
    if (onMobileClose) onMobileClose()
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200 cursor-pointer"
        />
      )}

      <aside
        style={{ backgroundColor: '#1E1B3A' }}
        className={cn(
          'fixed left-0 top-0 h-full z-50 flex flex-col',
          'border-r border-white/10 text-white shadow-xl',
          'transition-all duration-300 ease-in-out',
          // Desktop sidebar width
          collapsed ? 'md:w-16' : 'md:w-60',
          // Mobile slide-in drawer logic
          mobileOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0 w-60'
        )}
      >
      {/* ─── Logo ─── */}
      <div
        className={cn(
          'flex items-center h-16 px-4 shrink-0',
          'border-b border-white/10',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        <div className={cn('flex items-center gap-3 overflow-hidden', collapsed && 'justify-center w-full')}>
          {bizProfile.logo_url ? (
            <img
              src={bizProfile.logo_url}
              alt={bizProfile.business_name}
              className="size-8 rounded-[var(--radius-md)] object-cover shrink-0 shadow-xs border border-white/20"
            />
          ) : null}
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-white truncate leading-tight uppercase tracking-tight">
                {bizProfile.business_name || 'TRUFOCUS PHOTOGRAPHY'}
              </p>
              {bizProfile.tagline && (
                <p className="text-[10px] text-purple-200 truncate leading-tight font-medium mt-0.5">
                  {bizProfile.tagline}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          className={cn(
            'shrink-0 size-6 rounded-md flex items-center justify-center',
            'text-gray-300 hover:text-white hover:bg-[#2A2650] transition-colors duration-150',
            collapsed && 'hidden'
          )}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* ─── Collapsed toggle (shown when collapsed) ─── */}
      {collapsed && (
        <button
          onClick={onToggle}
          className={cn(
            'mx-auto mt-2 size-8 rounded-[var(--radius-md)] flex items-center justify-center',
            'text-gray-300 hover:text-white hover:bg-[#2A2650] transition-colors duration-150'
          )}
          aria-label="Expand sidebar"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* ─── Main Navigation ─── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Main
          </p>
        )}
        {visibleMainNav.map((item) => (
          <SidebarNavItem key={item.id} item={item} collapsed={collapsed} />
        ))}

        {/* Divider */}
        {visibleAccountNav.length > 0 && <div className="my-3 mx-2 border-t border-white/10" />}

        {!collapsed && visibleAccountNav.length > 0 && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Account
          </p>
        )}
        {visibleAccountNav.map((item) => (
          <SidebarNavItem key={item.id} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* ─── Bottom Profile Section ─── */}
      <div
        className={cn(
          'shrink-0 border-t border-white/10 p-3',
          collapsed ? 'flex flex-col items-center gap-2' : 'space-y-0'
        )}
      >
        {collapsed ? (
          <>
            <Avatar
              src={user?.avatar_url}
              name={user?.full_name ?? user?.email}
              size="sm"
            />
            <button
              onClick={handleSignOut}
              className={cn(
                'size-8 rounded-[var(--radius-md)] flex items-center justify-center',
                'text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150'
              )}
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 p-2 rounded-[var(--radius-md)] hover:bg-[#2A2650] transition-colors group cursor-pointer">
            <Avatar
              src={user?.avatar_url}
              name={user?.full_name ?? user?.email}
              size="sm"
              online
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate leading-tight">
                {user?.full_name ?? 'User'}
              </p>
              <p className="text-[11px] text-gray-400 truncate leading-tight">
                {user?.company ?? 'Trufocus Studio'}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className={cn(
                'shrink-0 size-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100',
                'text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150'
              )}
              aria-label="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  </>
  )
}

// ─── SidebarNavItem ───────────────────────────────────────────────────────────

interface SidebarNavItemProps {
  item: NavItem
  collapsed: boolean
}

function SidebarNavItem({ item, collapsed }: SidebarNavItemProps) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-[var(--radius-md)] transition-all duration-150',
          'text-sm font-medium group relative',
          collapsed ? 'h-10 w-10 mx-auto justify-center' : 'h-9 px-3',
          isActive
            ? 'bg-[#5B3FD9] text-white shadow-xs font-semibold'
            : 'text-gray-300 hover:bg-[#2A2650] hover:text-white'
        )
      }
    >
      {() => (
        <>
          <Icon size={17} className="shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
          {item.badge !== undefined && item.badge > 0 && !collapsed && (
            <span className="ml-auto text-[10px] font-bold bg-[#5B3FD9] text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center border border-white/20">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}

          {/* Tooltip for collapsed state */}
          {collapsed && (
            <span className={cn(
              'absolute left-full ml-3 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap z-50',
              'bg-[#1E1B3A] text-white border border-white/10 shadow-lg',
              'opacity-0 pointer-events-none group-hover:opacity-100',
              'translate-x-1 group-hover:translate-x-0',
              'transition-all duration-150'
            )}>
              {item.label}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}
