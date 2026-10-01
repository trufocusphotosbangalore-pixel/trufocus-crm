import { useState } from 'react'
import { HELP_CENTER_ARTICLES, type SopArticle } from '@/services/crewHelpCenterService'
import { HelpCircle, ChevronRight, Search, X } from 'lucide-react'

export default function CrewHelpCenterPage() {
  const [search, setSearch] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<SopArticle | null>(null)

  const filtered = HELP_CENTER_ARTICLES.filter((a) =>
    !search ||
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 text-gray-900 font-sans max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <HelpCircle size={24} className="text-[#5B3FD9]" /> Crew Knowledge Base & Help Center
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Company SOPs, camera settings, color grading standards, and emergency contacts.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search SOPs & Guidelines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#5B3FD9] shadow-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((art) => (
          <div
            key={art.id}
            onClick={() => setSelectedArticle(art)}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-3 hover:border-[#5B3FD9] transition-all cursor-pointer"
          >
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-[#5B3FD9] border border-purple-200 uppercase">
              {art.category}
            </span>
            <h3 className="font-extrabold text-base text-gray-900">{art.title}</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">{art.description}</p>
            <div className="pt-2 flex items-center text-xs font-bold text-[#5B3FD9]">
              Read SOP <ChevronRight size={14} className="ml-1" />
            </div>
          </div>
        ))}
      </div>

      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl w-full max-w-xl space-y-4 max-h-[85vh] overflow-y-auto text-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold bg-purple-50 text-[#5B3FD9] border border-purple-200 px-2 py-0.5 rounded-full uppercase">
                  {selectedArticle.category}
                </span>
                <h3 className="text-lg font-extrabold text-gray-900 mt-1">{selectedArticle.title}</h3>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line font-medium">
              {selectedArticle.content}
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 rounded-xl bg-[#5B3FD9] text-white text-xs font-extrabold cursor-pointer"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
