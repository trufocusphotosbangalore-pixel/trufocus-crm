import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Briefcase, Camera, Film,
  Clock, FileText, Bell, Sparkles, User, LogOut,
  HelpCircle, Menu, X, ChevronRight, Navigation, HardDrive,
} from 'lucide-react'
import { getCrewSession, clearCrewSession } from '@/services/crewSessionService'
import { getWorkRolesForEmployee } from '@/services/employeeWorkRolesService'
import { getPermissionsForCrewUser, canCrewUserAccessPath } from '@/services/crewPermissionService'
import type { UserAccount } from '@/types/teamLogin'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils/cn'

export function CrewLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [crewUser, setCrewUser] = useState<UserAccount | null>(() => getCrewSession())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleSessionChange = () => {
      const active = getCrewSession()
      setCrewUser(active)
      if (!active) {
        navigate('/crew/login', { replace: true })
      }
    }

    window.addEventListener('trufocus_crew_session_updated', handleSessionChange)
    return () => window.removeEventListener('trufocus_crew_session_updated', handleSessionChange)
  }, [navigate])

  // Route Protection Guard
  useEffect(() => {
    if (!crewUser) return
    const isAllowed = canCrewUserAccessPath(crewUser, location.pathname)
    if (!isAllowed) {
      toast.error('403 - You do not have permission to access this module')
      navigate('/crew/dashboard', { replace: true })
    }
  }, [crewUser, location.pathname, navigate])

  if (!crewUser) {
    return null
  }

  const handleLogout = () => {
    clearCrewSession()
    navigate('/crew/login', { replace: true })
  }

  const workRoles = getWorkRolesForEmployee(crewUser.id)
  const roleTitle = workRoles.length > 0 ? workRoles.map((r) => r.role_name).join(', ') : crewUser.role_name || 'Crew Member'

  const permSet = getPermissionsForCrewUser(crewUser)

  const ALL_NAV_ITEMS = [
    { key: 'dashboard', label: 'MY DAY', path: '/crew/dashboard', icon: LayoutDashboard },
    { key: 'my_assignments', label: 'My Assignments', path: '/crew/assignments', icon: Briefcase },
    { key: 'today_schedule', label: 'Today’s Schedule', path: '/crew/schedule', icon: Clock },
    { key: 'calendar', label: 'Calendar', path: '/crew/calendar', icon: Calendar },
    { key: 'my_shoots', label: 'My Shoots', path: '/crew/shoots', icon: Camera },
    { key: 'my_editing', label: 'My Editing', path: '/crew/editing', icon: Film },
    { key: 'attendance', label: 'Attendance', path: '/crew/attendance', icon: Clock },
    { key: 'equipment', label: 'Equipment', path: '/crew/equipment', icon: HardDrive },
    { key: 'reports', label: 'Reports', path: '/crew/reports', icon: FileText },
    { key: 'help_center', label: 'Help Center', path: '/crew/help-center', icon: HelpCircle },
    { key: 'notifications', label: 'Notifications', path: '/crew/notifications', icon: Bell },
    { key: 'ai_assistant', label: 'Crew Assistant', path: '/crew/ai', icon: Sparkles },
    { key: 'profile', label: 'Profile', path: '/crew/profile', icon: User },
  ]

  const navItems = ALL_NAV_ITEMS.filter((item) => permSet.allowedModules.has(item.key))

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-gray-900 flex flex-col font-sans">
      {/* Top Header - CRM Design System Glassmorphic Header */}
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/crew/dashboard" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[#5B3FD9] flex items-center justify-center text-white font-extrabold shadow-sm shadow-[#5B3FD9]/30">
              TC
            </div>
            <div>
              <span className="font-extrabold text-base text-gray-900 tracking-wide block leading-none">
                Trufocus <span className="text-[#5B3FD9]">Crew</span>
              </span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mt-0.5">
                Staff Operating System
              </span>
            </div>
          </Link>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/crew/profile"
            className="flex items-center gap-2.5 p-1.5 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/60 border border-slate-200 transition-colors"
          >
            <div className="size-7 rounded-full bg-[#5B3FD9] text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
              {(crewUser.employee_name || crewUser.full_name || 'C').charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-bold text-gray-900 leading-tight">
                {crewUser.employee_name || crewUser.full_name}
              </span>
              <span className="block text-[10px] text-[#5B3FD9] font-bold truncate max-w-[140px]">
                {roleTitle}
              </span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="size-9 rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar - Matches CRM #1E1B3A Dark Purple */}
        <aside className="hidden lg:flex w-64 bg-[#1E1B3A] border-r border-gray-800/60 flex-col justify-between p-4 space-y-4 shrink-0 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all',
                    isActive
                      ? 'bg-[#5B3FD9] text-white shadow-md shadow-[#5B3FD9]/30 font-extrabold'
                      : 'text-gray-300 hover:text-white hover:bg-[#2A2650]'
                  )}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto opacity-75" />}
                </Link>
              )
            })}
          </div>

          {/* Quick SOS Support Callout */}
          <div className="p-3.5 rounded-2xl bg-[#2A2650] border border-[#5B3FD9]/30 space-y-2">
            <span className="text-[11px] font-bold text-purple-200 block">Need Studio Support?</span>
            <a
              href="tel:+919876500000"
              className="w-full h-8 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <Navigation size={13} /> Operations Hotline
            </a>
          </div>
        </aside>

        {/* Mobile Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />

            <aside className="relative w-72 bg-[#1E1B3A] text-white p-4 space-y-4 flex flex-col justify-between z-10">
              <div className="space-y-1 overflow-y-auto max-h-[80vh]">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-800">
                  <span className="font-extrabold text-sm text-white">Trufocus Crew</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                {navItems.map((item) => {
                  const isActive = location.pathname === item.path
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all',
                        isActive
                          ? 'bg-[#5B3FD9] text-white shadow-md shadow-[#5B3FD9]/30 font-extrabold'
                          : 'text-gray-300 hover:text-white hover:bg-[#2A2650]'
                      )}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold text-xs flex items-center justify-center gap-2"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
