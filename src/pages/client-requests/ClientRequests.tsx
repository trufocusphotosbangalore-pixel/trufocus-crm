import { Inbox } from 'lucide-react'
import { DocumentManagerWidget } from '@/components/documents/DocumentManagerWidget'

export default function ClientRequests() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-purple-100 text-[#5B3FD9] flex items-center justify-center shadow-2xs">
            <Inbox size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#111827]">Client Requests & Document Hub</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Review client upload submissions, venue reference documents, special shoot instructions, and song requests.
            </p>
          </div>
        </div>
      </div>

      <DocumentManagerWidget
        module="client_requests"
        title="Client Upload Submissions & Attached Documents"
        subtitle="Access all files submitted by clients through the Customer Portal including venue references, moodboards, and contract revisions."
      />
    </div>
  )
}
