import { FileText, Download, Printer } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function CrewReportsPage() {
  const handleExport = (type: string) => {
    toast.success(`Generated ${type} report for your staff workflow records!`)
  }

  return (
    <div className="space-y-6 text-gray-900 font-sans max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <FileText size={24} className="text-[#5B3FD9]" /> Staff Performance & Shoot Reports
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Export monthly shoot completion reports, attendance summary, and deliverable logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('PDF')}
            className="px-4 py-2 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Download size={14} /> Export PDF
          </button>
          <button
            onClick={() => handleExport('Excel')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Download size={14} /> Export Excel
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-slate-50 text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-gray-500">Total Shoots Completed</span>
          <span className="text-2xl font-extrabold text-gray-900 block">42 Projects</span>
          <span className="text-[11px] text-emerald-600 font-semibold block">100% On-Time Delivery</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-gray-500">Post-Production Edits Approved</span>
          <span className="text-2xl font-extrabold text-gray-900 block">28 Deliverables</span>
          <span className="text-[11px] text-purple-600 font-semibold block">Zero Rejections</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-gray-500">Client Satisfaction Score</span>
          <span className="text-2xl font-extrabold text-gray-900 block">4.9 / 5.0</span>
          <span className="text-[11px] text-amber-600 font-semibold block">Top Rated Specialist</span>
        </div>
      </div>
    </div>
  )
}
