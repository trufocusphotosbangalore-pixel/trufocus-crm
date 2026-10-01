import { Plug, MessageSquare, Globe, Calendar, Share2, Layers } from 'lucide-react'

export function EnquiryIntegrationsPlaceholder() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#111827]">Lead Source Integrations</h3>
          <p className="text-xs text-[#6B7280]">Connect Meta Ads, Google Forms, WhatsApp, and social channels to auto-capture enquiries</p>
        </div>
        <span className="text-xs font-bold bg-[#5B3FD9]/10 text-[#5B3FD9] px-3 py-1 rounded-full">
          6 Available Channels
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { name: 'Meta Lead Ads', desc: 'Sync leads directly from Facebook & Instagram Ad campaigns.', icon: Share2, color: 'text-blue-600', status: 'Connected' },
          { name: 'WhatsApp Business API', desc: 'Auto-receive customer WhatsApp messages as new CRM leads.', icon: MessageSquare, color: 'text-emerald-600', status: 'Connected' },
          { name: 'Instagram DM & Lead Forms', desc: 'Capture DMs and story response inquiries directly.', icon: Layers, color: 'text-purple-600', status: 'Ready' },
          { name: 'Google Forms & Ads', desc: 'Import responses from Google Forms into CRM enquiries.', icon: Globe, color: 'text-amber-600', status: 'Ready' },
          { name: 'Google Calendar Sync', desc: 'Sync shoot dates and follow-up schedules automatically.', icon: Calendar, color: 'text-indigo-600', status: 'Ready' },
          { name: 'Webhook & API Endpoint', desc: 'Custom HTTP webhook endpoint for external web forms.', icon: Share2, color: 'text-teal-600', status: 'Ready' },
        ].map((item, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="size-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <item.icon size={20} className={item.color} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'Connected' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'}`}>
                  {item.status}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#111827]">{item.name}</h4>
              <p className="text-xs text-[#6B7280] leading-snug">{item.desc}</p>
            </div>

            <button className="w-full py-2 text-xs font-bold rounded-lg border border-[#E5E7EB] bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center justify-center gap-1.5 transition-colors">
              <Plug size={13} strokeWidth={2.5} /> Configure Settings
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
