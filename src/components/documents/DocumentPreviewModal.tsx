import { useState } from 'react'
import {
  X, Download, ZoomIn, ZoomOut, RotateCw, FileText, Film, Image as ImageIcon,
  Info, Copy,
} from 'lucide-react'
import type { CrmDocumentRecord } from '@/types/document'
import { formatBytes } from '@/services/documentManagementStore'
import { toast } from 'react-hot-toast'

interface DocumentPreviewModalProps {
  document: CrmDocumentRecord
  onClose: () => void
}

export function DocumentPreviewModal({ document: doc, onClose }: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(doc.extension.toLowerCase())
  const isPdf = doc.extension.toLowerCase() === 'pdf' || doc.file_type.includes('pdf')
  const isVideo = ['mp4', 'mov', 'webm'].includes(doc.extension.toLowerCase()) || doc.file_type.includes('video')

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = doc.file_url
    a.download = doc.file_name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success(`Downloading ${doc.file_name}`)
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(doc.file_url)
      toast.success('Document link copied to clipboard!')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              {isImage ? <ImageIcon size={20} /> : isVideo ? <Film size={20} /> : <FileText size={20} />}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-white truncate">{doc.file_name}</h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-bold uppercase">{doc.category}</span>
                <span>•</span>
                <span>{formatBytes(doc.file_size)}</span>
                <span>•</span>
                <span>Uploaded by {doc.uploaded_by}</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {isImage && (
              <>
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                  className="size-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>

                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                  className="size-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>

                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="size-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                  title="Rotate"
                >
                  <RotateCw size={16} />
                </button>
              </>
            )}

            <button
              onClick={handleShare}
              className="px-3 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy Link"
            >
              <Copy size={14} /> Copy Link
            </button>

            <button
              onClick={handleDownload}
              className="px-3 h-9 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Download size={14} /> Download
            </button>

            <button
              onClick={onClose}
              className="size-9 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-950 p-4 flex items-center justify-center overflow-auto relative min-h-0">
          {isImage ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto">
              <img
                src={doc.file_url}
                alt={doc.file_name}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={doc.file_url}
              title={doc.file_name}
              className="w-full h-full rounded-xl border border-slate-800 bg-white"
            />
          ) : isVideo ? (
            <div className="w-full h-full flex items-center justify-center bg-black rounded-xl overflow-hidden">
              <video
                controls
                autoPlay
                src={doc.file_url}
                className="max-w-full max-h-full rounded-xl shadow-lg"
              >
                Your browser does not support playing this video format natively.
              </video>
            </div>
          ) : (
            <div className="p-8 text-center space-y-4 max-w-md mx-auto">
              <div className="size-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20">
                <FileText size={32} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-white">{doc.file_name}</h4>
                <p className="text-xs text-slate-400 font-mono">
                  Extension: .{doc.extension.toUpperCase()} • Size: {formatBytes(doc.file_size)}
                </p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800">
                Inline preview is optimized for Images, PDFs, and Videos. Use the button below to download and view this document in your native desktop application.
              </p>

              <button
                onClick={handleDownload}
                className="px-6 h-11 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer mx-auto"
              >
                <Download size={16} /> Download File ({formatBytes(doc.file_size)})
              </button>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        {doc.notes && (
          <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 flex items-center gap-2 font-mono shrink-0">
            <Info size={14} className="text-purple-400 shrink-0" />
            <span className="truncate">Notes: {doc.notes}</span>
          </div>
        )}
      </div>
    </div>
  )
}
