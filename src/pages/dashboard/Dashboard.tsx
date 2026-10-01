import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare, FolderKanban, CreditCard, Calendar, Clock,
  Film, PackageCheck, TrendingUp, AlertCircle, Plus, Users,
  Upload, FileText, ArrowRight, MapPin, CheckCircle,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import {
  getDashboardStats, formatINR, getRecentActivities, getUpcomingTasks,
  getRecentPayments, getUpcomingEventsList, getDashboardNotifications,
} from '@/services/dashboardService'
import { wipeAllCRMDataToClean } from '@/services/supabase/workOrders'
import type {
  DashboardStats, ActivityItem, TaskItem, RecentPaymentItem,
  CalendarEventItem, NotificationItem,
} from '@/services/dashboardService'
import { WorkspaceRouter } from '@/components/layout/WorkspaceRouter'

// ─── Stat Card Component ──────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: string | number
  subText?: string
  growth?: string
  positive?: boolean
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconColor: string
  iconBg: string
  isLoading?: boolean
  onClick?: () => void
}

function StatCard({ title, value, subText, growth, positive, icon: Icon, iconColor, iconBg, isLoading, onClick }: StatCardProps) {
  if (isLoading) return <CardSkeleton />

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-5 rounded-2xl bg-white',
        'border border-[#E5E7EB] shadow-xs',
        'hover:shadow-md transition-all duration-200 space-y-3',
        onClick && 'cursor-pointer hover:border-[#5B3FD9]'
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn('size-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon size={20} className={iconColor} />
        </div>
        {growth && (
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1', positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
            <TrendingUp size={12} className={positive ? '' : 'rotate-180'} />
            {growth}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#111827] tracking-tight font-mono">{value}</p>
        <p className="text-xs font-semibold text-[#111827] mt-0.5">{title}</p>
        {subText && <p className="text-[11px] text-[#6B7280] mt-1">{subText}</p>}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [recentPayments, setRecentPayments] = useState<RecentPaymentItem[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  // Live IST Clock
  const [timeState, setTimeState] = useState(() => new Date())

  // Dynamic Time Greeting
  const getGreeting = () => {
    const hour = timeState.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Load All Dashboard Data
  const loadData = useCallback(() => {
    const s = getDashboardStats()
    setStats(s)
    setActivities(getRecentActivities())
    setTasks(getUpcomingTasks())
    setRecentPayments(getRecentPayments())
    setCalendarEvents(getUpcomingEventsList())
    setNotifications(getDashboardNotifications())
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    // 60-Second Auto Refresh Timer
    const timer = setInterval(() => {
      loadData()
    }, 60000)
    return () => clearInterval(timer)
  }, [loadData])

  // Instant Cross-Tab Real-Time Payment Sync
  useRealtimeSync(loadData)

  // Live IST Clock Timer
  useEffect(() => {
    const clockTimer = setInterval(() => setTimeState(new Date()), 1000)
    return () => clearInterval(clockTimer)
  }, [])

  const handleOpenWorkOrder = (woId: string) => {
    navigate(`/work-orders/${woId}`)
  }

  return (
    <WorkspaceRouter onRefresh={loadData}>
      <div className="space-y-6 max-w-7xl">
      {/* ─── 1. GREETING & LIVE IST CLOCK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#111827]">
            {getGreeting()}, {user?.full_name || 'Staff Member'} 👋
          </h2>
          <p className="text-xs text-[#6B7280] mt-1 font-medium">
            Live Business Control Center for Trufocus Photography Studio.
          </p>
        </div>

        {/* Live IST Date & Time */}
        <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-[#E5E7EB] pt-3 sm:pt-0 sm:pl-6 flex flex-col items-start sm:items-end justify-between">
          <div>
            <p className="text-xs font-bold text-[#111827]">
              {timeState.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm font-mono font-bold text-[#5B3FD9] mt-0.5">
              {timeState.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })} <span className="text-[10px] text-gray-400 font-sans">IST</span>
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Clear all cached sample data from browser and reset to 100% clean?')) {
                wipeAllCRMDataToClean()
                loadData()
              }
            }}
            className="mt-2 px-2.5 py-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
          >
            🧹 Clear Cached Data
          </button>
        </div>
      </div>

      {/* ─── 2. SMART NOTIFICATIONS BAR ─── */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.slice(0, 2).map((n) => (
            <div
              key={n.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <span><strong className="text-[#111827]">{n.title}:</strong> {n.message}</span>
              </div>
              <button
                onClick={() => n.workOrderId ? handleOpenWorkOrder(n.workOrderId) : navigate('/projects')}
                className="text-[11px] font-bold text-[#5B3FD9] hover:underline shrink-0"
              >
                View Now →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ─── 3. 8 DYNAMIC STAT CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: New Enquiries */}
        <StatCard
          title="New Enquiries"
          value={isLoading ? '—' : stats?.enquiriesThisMonth ?? 0}
          subText={`Today: ${stats?.enquiriesToday ?? 0} • This Week: ${stats?.enquiriesThisWeek ?? 0}`}
          icon={MessageSquare}
          iconColor="text-[#5B3FD9]"
          iconBg="bg-[#5B3FD9]/10"
          isLoading={isLoading}
          onClick={() => navigate('/enquiries')}
        />

        {/* Card 2: Active Work Orders */}
        <StatCard
          title="Active Work Orders"
          value={isLoading ? '—' : stats?.activeWorkOrdersCount ?? 0}
          subText="Upcoming, In-Progress, Editing & Album"
          icon={FolderKanban}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          isLoading={isLoading}
          onClick={() => navigate('/projects')}
        />

        {/* Card 3: Pending Payments */}
        <StatCard
          title="Pending Payments"
          value={isLoading ? '—' : formatINR(stats?.totalPendingAmount ?? 0)}
          subText={`Pending across ${stats?.pendingCustomersCount ?? 0} customers`}
          icon={CreditCard}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          isLoading={isLoading}
          onClick={() => navigate('/finances')}
        />

        {/* Card 4: Today's Events */}
        <StatCard
          title="Today's Events"
          value={isLoading ? '—' : stats?.todayEventsCount ?? 0}
          subText={
            Object.keys(stats?.todayEventsBreakdown || {}).length > 0
              ? Object.entries(stats?.todayEventsBreakdown || {}).map(([k, v]) => `${k}: ${v}`).join(', ')
              : 'No events scheduled for today'
          }
          icon={Calendar}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          isLoading={isLoading}
          onClick={() => navigate('/projects?status=todays_shoot')}
        />

        {/* Card 5: Upcoming Events (Next 7 Days) */}
        <StatCard
          title="Upcoming Events (7 Days)"
          value={isLoading ? '—' : stats?.upcomingEvents7DaysCount ?? 0}
          subText="Shoots scheduled in the next 7 days"
          icon={Clock}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          isLoading={isLoading}
          onClick={() => navigate('/projects?status=upcoming')}
        />

        {/* Card 6: Pending Editing */}
        <StatCard
          title="Pending Editing"
          value={isLoading ? '—' : stats?.pendingEditingCount ?? 0}
          subText="Photo Editing, Video & Album Design"
          icon={Film}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          isLoading={isLoading}
          onClick={() => navigate('/projects?status=editing')}
        />

        {/* Card 7: Completed Deliveries */}
        <StatCard
          title="Completed Deliveries"
          value={isLoading ? '—' : stats?.completedDeliveriesThisMonth ?? 0}
          subText="Projects delivered this month"
          icon={PackageCheck}
          iconColor="text-teal-600"
          iconBg="bg-teal-50"
          isLoading={isLoading}
          onClick={() => navigate('/projects?status=completed')}
        />

        {/* Card 8: Monthly Revenue */}
        <StatCard
          title="Monthly Revenue"
          value={isLoading ? '—' : formatINR(stats?.monthlyRevenue ?? 0)}
          subText="Sum of received payments this month"
          growth={stats ? `${stats.revenueGrowthPct >= 0 ? '+' : ''}${stats.revenueGrowthPct}% vs last month` : undefined}
          positive={stats ? stats.revenueGrowthPct >= 0 : true}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          isLoading={isLoading}
        />
      </div>

      {/* ─── 4. QUICK ACTIONS BAR ─── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827]">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'New Enquiry', icon: MessageSquare, color: 'text-[#5B3FD9]', bg: 'bg-[#5B3FD9]/10', action: () => navigate('/enquiries') },
            { label: 'New Work Order', icon: Plus, color: 'text-blue-600', bg: 'bg-blue-50', action: () => navigate('/work-orders/new') },
            { label: 'Record Payment', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50', action: () => navigate('/finances') },
            { label: 'Manage Team', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', action: () => navigate('/settings') },
            { label: 'Upload Gallery', icon: Upload, color: 'text-indigo-600', bg: 'bg-indigo-50', action: () => navigate('/post-production') },
            { label: 'Create Invoice', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', action: () => navigate('/finances') },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-[#E5E7EB] hover:border-[#5B3FD9] hover:bg-gray-50 transition-all text-center group cursor-pointer"
            >
              <div className={cn('size-9 rounded-xl flex items-center justify-center', item.bg)}>
                <item.icon size={16} className={item.color} />
              </div>
              <span className="text-xs font-bold text-[#374151] group-hover:text-[#5B3FD9]">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── 5. MIDDLE ROW: RECENT PAYMENTS & UPCOMING EVENTS WIDGETS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Payments Widget */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Recent Payments Received</h3>
              <p className="text-xs text-[#6B7280]">Latest payment transactions across work orders</p>
            </div>
            <button onClick={() => navigate('/finances')} className="text-xs font-bold text-[#5B3FD9] hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </button>
          </div>

          <div className="p-2 overflow-x-auto flex-1">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">No records available.</p>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAFAFC] text-[#6B7280] font-semibold border-b border-[#E5E7EB]">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] bg-white">
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleOpenWorkOrder(p.workOrderId)}>
                      <td className="p-3 font-semibold text-[#111827]">
                        {p.customerName}
                        <span className="block text-[10px] font-mono text-gray-400">{p.workOrderNumber}</span>
                      </td>
                      <td className="p-3 font-bold text-emerald-600 font-mono">{formatINR(p.amount)}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-gray-100 font-medium">{p.paymentMode}</span></td>
                      <td className="p-3 text-gray-500">{p.paymentDate}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Upcoming Events Calendar Widget */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Events Calendar</h3>
              <p className="text-xs text-[#6B7280]">Today's and upcoming shoot schedules</p>
            </div>
            <button onClick={() => navigate('/projects')} className="text-xs font-bold text-[#5B3FD9] hover:underline flex items-center gap-1">
              Work Orders <ArrowRight size={12} />
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[320px]">
            {calendarEvents.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">No records available.</p>
            ) : (
              calendarEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => handleOpenWorkOrder(ev.workOrderId)}
                  className={cn(
                    'p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between',
                    ev.isToday
                      ? 'bg-[#5B3FD9]/5 border-[#5B3FD9]/30'
                      : 'bg-[#FAFAFC] border-[#E5E7EB] hover:bg-gray-50'
                  )}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#111827] truncate">{ev.projectName}</span>
                      {ev.isToday && (
                        <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                          TODAY
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280]">{ev.eventType} • <span className="font-semibold text-[#111827]">{ev.customerName}</span></p>
                    {ev.venue && (
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate">
                        <MapPin size={11} className="text-[#5B3FD9]" /> {ev.venue}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 font-mono text-xs">
                    <span className="block font-bold text-[#5B3FD9]">{ev.eventDate}</span>
                    <span className="text-[10px] text-gray-400">{ev.eventTime || 'Full Day'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ─── 6. BOTTOM ROW: RECENT ACTIVITY & UPCOMING TASKS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Recent Activity (3/5 width) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-bold text-[#111827]">Recent System Activity</h3>
            <span className="text-xs text-[#6B7280]">Live Audit Log</span>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            {activities.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">No records available.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-[#5B3FD9]/10 text-[#5B3FD9] flex items-center justify-center shrink-0">
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#111827]">{act.title}</p>
                      <p className="text-[11px] text-[#6B7280]">{act.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 shrink-0">{act.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Tasks (2/5 width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-bold text-[#111827]">Upcoming Auto Tasks</h3>
            <span className="text-xs font-bold bg-[#5B3FD9]/10 text-[#5B3FD9] px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>

          <div className="p-4 space-y-3">
            {tasks.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">No records available.</p>
            ) : (
              tasks.map((tsk) => (
                <div
                  key={tsk.id}
                  onClick={() => tsk.workOrderId ? handleOpenWorkOrder(tsk.workOrderId) : null}
                  className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFC] hover:bg-gray-50 transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#111827]">{tsk.title}</p>
                    <span className={cn(
                      'text-[9px] font-bold uppercase px-2 py-0.5 rounded',
                      tsk.priority === 'high' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    )}>
                      {tsk.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7280]">{tsk.client}</p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 pt-1">
                    <Clock size={10} /> <span>Due: {tsk.due}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
      </div>
    </WorkspaceRouter>
  )
}
