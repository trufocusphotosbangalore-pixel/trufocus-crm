import { Image, Upload, ExternalLink } from 'lucide-react'
import type { WorkOrder } from '@/types/workOrders'
import { toast } from 'react-hot-toast'

interface MoodboardTabProps {
  workOrder: WorkOrder
}

export function MoodboardTab({ workOrder }: MoodboardTabProps) {
  const handleUpload = () => toast.success('Select reference images to upload.')
  const handlePinterest = () => {
    if (workOrder.pinterest_link) {
      window.open(workOrder.pinterest_link, '_blank')
    } else {
      toast.error('No Pinterest board link added yet.')
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Visual Moodboard & Creative References</h3>
            <p className="text-xs text-gray-500">Pose ideas, lighting styles, Pinterest boards, and client aesthetic preferences</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePinterest}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5"
            >
              <ExternalLink size={13} /> Open Pinterest Board
            </button>
            <button
              onClick={handleUpload}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#5B3FD9] text-white hover:bg-[#4C34C3] flex items-center gap-1.5 shadow-2xs"
            >
              <Upload size={14} /> Upload Reference Image
            </button>
          </div>
        </div>

        {workOrder.pinterest_link && (
          <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 truncate max-w-md">Pinterest Board: {workOrder.pinterest_link}</span>
            <a
              href={workOrder.pinterest_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink size={12} /> Visit Board
            </a>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-4/3 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center p-4 text-center text-gray-400 group hover:border-[#5B3FD9] transition-colors relative overflow-hidden">
              <Image size={24} className="mb-2 text-gray-300 group-hover:text-[#5B3FD9]" />
              <span className="text-[11px] font-medium text-gray-500">Reference Shot #{i}</span>
              <span className="text-[9px] text-gray-400">Wedding Poses & Lighting</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
