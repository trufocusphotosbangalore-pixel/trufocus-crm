import {
  Layers, Clock, Scissors, Eye, ShieldCheck, CheckCircle2, Truck, AlertTriangle,
} from 'lucide-react'
import type { PostProductionItem } from '@/types/postProduction'

interface PostProductionStatsProps {
  items: PostProductionItem[]
}

export function PostProductionStats({ items }: PostProductionStatsProps) {
  const todayStr = new Date().toISOString().split('T')[0]

  const total = items.length
  const notStarted = items.filter(
    (i) => i.status === 'not_started' || i.status === 'pending' || i.status === 'assigned'
  ).length
  const inProgress = items.filter(
    (i) => i.status === 'in_progress' || i.status === 'editing'
  ).length
  const readyForReview = items.filter(
    (i) => i.status === 'ready_for_review' || i.status === 'review' || i.status === 'for_review'
  ).length
  const clientApproval = items.filter(
    (i) => i.status === 'client_approval'
  ).length
  const completed = items.filter(
    (i) => i.status === 'completed' || i.status === 'done'
  ).length
  const delivered = items.filter(
    (i) => i.status === 'delivered'
  ).length
  const overdue = items.filter(
    (i) =>
      i.due_date &&
      i.due_date < todayStr &&
      i.status !== 'completed' &&
      i.status !== 'delivered' &&
      i.status !== 'done'
  ).length

  const cards = [
    { title: 'Total Tasks', count: total, icon: Layers, color: 'text-[#5B3FD9]', bg: 'bg-[#5B3FD9]/10' },
    { title: 'Not Started', count: notStarted, icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' },
    { title: 'In Progress', count: inProgress, icon: Scissors, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Internal Review', count: readyForReview, icon: Eye, color: 'text-yellow-700', bg: 'bg-yellow-100' },
    { title: 'Client Approval', count: clientApproval, icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Completed', count: completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Delivered', count: delivered, icon: Truck, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Overdue', count: overdue, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-sans">
      {cards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 shadow-xs flex items-center gap-3 hover:border-gray-300 transition-colors"
          >
            <div className={`size-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
                {card.title}
              </span>
              <span className="text-base font-extrabold text-[#111827] font-mono leading-none">
                {card.count}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
