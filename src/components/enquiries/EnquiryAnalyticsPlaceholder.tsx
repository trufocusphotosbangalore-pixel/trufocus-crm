import { TrendingUp, Users, Target, ArrowUpRight } from 'lucide-react'

export function EnquiryAnalyticsPlaceholder() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#111827]">Lead Performance Analytics</h3>
          <p className="text-xs text-[#6B7280]">Visual reporting for enquiry conversion rate and marketing channels</p>
        </div>
        <span className="text-xs font-bold bg-[#5B3FD9]/10 text-[#5B3FD9] px-3 py-1 rounded-full">
          Live Analytics Engine
        </span>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads This Month', value: '48', growth: '+18% vs last month', icon: Users, color: 'text-[#5B3FD9]', bg: 'bg-[#5B3FD9]/10' },
          { label: 'Lead Conversion Rate', value: '34.2%', growth: '+4.5%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Avg. Response Time', value: '2.4 Hours', growth: '-15 mins', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Top Lead Source', value: 'Instagram', growth: '42% share', icon: ArrowUpRight, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((card, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className={`size-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon size={18} className={card.color} />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{card.growth}</span>
            </div>
            <p className="text-2xl font-bold font-mono text-[#111827]">{card.value}</p>
            <p className="text-xs text-[#6B7280] font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Funnel & Breakdown Mock Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-[#111827]">Lead Sales Funnel</h4>
          <div className="space-y-3 text-xs">
            {[
              { stage: '1. New Enquiries Received', count: 48, pct: '100%' },
              { stage: '2. Proposal Sent', count: 36, pct: '75%' },
              { stage: '3. Follow-up & Reviewing', count: 24, pct: '50%' },
              { stage: '4. Booked & Work Order Created', count: 16, pct: '33%' },
            ].map((f, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>{f.stage}</span>
                  <span className="font-mono">{f.count} ({f.pct})</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-[#5B3FD9] rounded-full" style={{ width: f.pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-[#111827]">Lead Source Breakdown</h4>
          <div className="space-y-3 text-xs">
            {[
              { source: 'Instagram Direct / Reels', leads: 20, pct: '42%' },
              { source: 'WhatsApp Inquiries', leads: 14, pct: '29%' },
              { source: 'Website Landing Page', leads: 8, pct: '17%' },
              { source: 'Client Referrals', leads: 6, pct: '12%' },
            ].map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAFC] border border-[#E5E7EB]">
                <span className="font-bold text-[#111827]">{s.source}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#5B3FD9]">{s.leads} leads</span>
                  <span className="text-[10px] bg-[#5B3FD9]/10 text-[#5B3FD9] px-2 py-0.5 rounded font-bold">{s.pct}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
