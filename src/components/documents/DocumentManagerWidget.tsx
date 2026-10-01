import { useState, useEffect, useRef } from 'react'
import {
  UploadCloud, FileText, Image as ImageIcon, Film, Download, Eye, Edit3, Trash2,
  Search, FolderInput, RefreshCw, Sparkles,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import type { CrmDocumentRecord, DocumentCategory, DocumentModule } from '@/types/document'
import { ALL_DOCUMENT_CATEGORIES } from '@/types/document'
import {
  getDocumentsByModule,
  getDocumentsByWorkOrder,
  uploadCrmDocumentFile,
  renameCrmDocument,
  moveCrmDocument,
  replaceCrmDocument,
  deleteCrmDocument,
  toggleDocumentClientShare,
  formatBytes,
} from '@/services/documentManagementStore'
import { DocumentPreviewModal } from './DocumentPreviewModal'
import { toast } from 'react-hot-toast'

interface DocumentManagerWidgetProps {
  module: DocumentModule
  relatedId?: string
  relatedNumber?: string
  userRole?: 'admin' | 'team' | 'client'
  currentUserName?: string
  title?: string
  subtitle?: string
  compact?: boolean
  onTriggerAiAnalysis?: (doc: CrmDocumentRecord, prompt: string) => void
}

export function DocumentManagerWidget({
  module,
  relatedId = 'all',
  relatedNumber,
  userRole = 'admin',
  currentUserName = 'Admin User',
  title = 'Document Management & File Attachments',
  subtitle = 'Upload, categorize, preview, and manage contracts, invoices, RAW footage, and media references.',
  compact = false,
  onTriggerAiAnalysis,
}: DocumentManagerWidgetProps) {
  const [documents, setDocuments] = useState<CrmDocumentRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedFileType, setSelectedFileType] = useState<string>('all')

  // Drag and Drop & Upload Progress
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>(
    module === 'client_portal' ? 'Venue References' : 'Miscellaneous'
  )

  // Preview & Modal States
  const [previewDoc, setPreviewDoc] = useState<CrmDocumentRecord | null>(null)
  const [renameDoc, setRenameDoc] = useState<CrmDocumentRecord | null>(null)
  const [newFileName, setNewFileName] = useState('')
  const [moveDoc, setMoveDoc] = useState<CrmDocumentRecord | null>(null)
  const [targetCategory, setTargetCategory] = useState<DocumentCategory>('Miscellaneous')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load documents
  const loadDocs = () => {
    let docs: CrmDocumentRecord[] = []
    if (relatedId && relatedId !== 'all') {
      docs = getDocumentsByWorkOrder(relatedId)
      if (docs.length === 0) {
        docs = getDocumentsByModule(module, relatedId)
      }
    } else {
      docs = getDocumentsByModule(module)
    }

    // Role-based filtering
    if (userRole === 'client') {
      docs = docs.filter(
        (d) => d.shared_with_client || d.uploaded_by.toLowerCase().includes('client')
      )
    }

    setDocuments(docs)
  }

  useEffect(() => {
    loadDocs()
  }, [module, relatedId, userRole])

  // File Upload Logic
  const handleFilesSelected = async (filesList: FileList | File[]) => {
    const files = Array.from(filesList)
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress(10)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const progressVal = Math.round(((i + 1) / files.length) * 100)
        setUploadProgress(progressVal)

        await uploadCrmDocumentFile({
          file,
          category: uploadCategory,
          module,
          relatedId: relatedId !== 'all' ? relatedId : 'general',
          relatedNumber,
          uploadedBy: currentUserName,
          sharedWithClient: userRole === 'client' || userRole === 'admin',
        })
      }

      toast.success(`Successfully uploaded ${files.length} file(s)!`)
      loadDocs()
    } catch (err: any) {
      toast.error(err.message || 'File upload failed.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Action Handlers
  const handleRenameSubmit = () => {
    if (!renameDoc || !newFileName.trim()) return
    renameCrmDocument(renameDoc.id, newFileName.trim())
    toast.success('Document renamed successfully!')
    setRenameDoc(null)
    setNewFileName('')
    loadDocs()
  }

  const handleMoveSubmit = () => {
    if (!moveDoc) return
    moveCrmDocument(moveDoc.id, targetCategory)
    toast.success(`Document moved to category: ${targetCategory}`)
    setMoveDoc(null)
    loadDocs()
  }

  const handleReplaceFile = async (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      await replaceCrmDocument(docId, file)
      toast.success('File version replaced successfully!')
      loadDocs()
    } catch (err: any) {
      toast.error(err.message || 'File replacement failed.')
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this document attachment?')) {
      deleteCrmDocument(id)
      toast.success('Document deleted.')
      loadDocs()
    }
  }

  const handleToggleShare = (id: string) => {
    const updated = toggleDocumentClientShare(id)
    toast.success(
      updated.shared_with_client
        ? 'Document is now visible to client in portal.'
        : 'Document access restricted from client portal.'
    )
    loadDocs()
  }

  // Filtered List
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.related_number && doc.related_number.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory

    let matchesFileType = true
    if (selectedFileType === 'pdf') matchesFileType = doc.extension.toLowerCase() === 'pdf'
    if (selectedFileType === 'images')
      matchesFileType = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(doc.extension.toLowerCase())
    if (selectedFileType === 'videos')
      matchesFileType = ['mp4', 'mov', 'webm'].includes(doc.extension.toLowerCase())
    if (selectedFileType === 'documents')
      matchesFileType = ['doc', 'docx', 'xls', 'xlsx', 'zip', 'rar', 'psd', 'ai', 'cdr'].includes(
        doc.extension.toLowerCase()
      )

    return matchesSearch && matchesCategory && matchesFileType
  })

  return (
    <div className="space-y-6 font-sans">
      {/* Widget Header */}
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
              <FolderInput size={18} className="text-[#5B3FD9]" />
              <span>{title}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-5 h-10 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <UploadCloud size={16} />
              <span>Upload Attachments</span>
            </button>
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files)
        }}
        className={cn(
          'p-6 rounded-2xl border-2 border-dashed transition-all text-center space-y-3 relative overflow-hidden',
          isDragging
            ? 'border-[#5B3FD9] bg-purple-50/70 scale-[1.01]'
            : 'border-gray-300 bg-[#FAFAFC] hover:border-[#5B3FD9]/60 hover:bg-white'
        )}
      >
        <div className="size-12 rounded-2xl bg-purple-100 text-[#5B3FD9] flex items-center justify-center mx-auto shadow-2xs">
          <UploadCloud size={24} />
        </div>

        <div className="space-y-1">
          <p className="text-xs font-extrabold text-[#111827]">
            Drag & Drop files here, or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[#5B3FD9] underline font-extrabold cursor-pointer"
            >
              browse from computer
            </button>
          </p>
          <p className="text-[11px] text-gray-500 font-mono">
            Supported: PDF, DOCX, XLSX, JPG, PNG, MP4, MOV, PSD, AI, CDR, ZIP (Up to 500MB)
          </p>
        </div>

        {/* Upload Category Selector for Drag Zone */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="text-[11px] font-bold text-gray-500">Upload Category:</span>
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
            className="px-3 py-1 bg-white rounded-lg border border-gray-300 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#5B3FD9]"
          >
            {ALL_DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="pt-3 max-w-md mx-auto space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#5B3FD9]">
              <span>Uploading files...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#5B3FD9] to-purple-600 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files by name, category, or WO#..."
            className="w-full pl-9 pr-3 py-2 bg-[#FAFAFC] rounded-xl border border-gray-200 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#5B3FD9]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* File Type Filter */}
          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="px-3 py-2 bg-[#FAFAFC] rounded-xl border border-gray-200 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#5B3FD9]"
          >
            <option value="all">All File Types</option>
            <option value="pdf">PDF Documents</option>
            <option value="images">Images (JPG, PNG, HEIC)</option>
            <option value="videos">Videos (MP4, MOV)</option>
            <option value="documents">Office & Design (DOCX, XLSX, PSD)</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#FAFAFC] rounded-xl border border-gray-200 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#5B3FD9]"
          >
            <option value="all">All Categories ({documents.length})</option>
            {ALL_DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents List Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 space-y-2">
          <FileText size={32} className="text-gray-300 mx-auto" />
          <p className="text-xs text-gray-500 font-extrabold">No document attachments found.</p>
          <p className="text-[11px] text-gray-400">
            Upload contract PDFs, quotations, invoice receipts, or event reference photos above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const isImage = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(doc.extension.toLowerCase())
            const isPdf = doc.extension.toLowerCase() === 'pdf'
            const isVideo = ['mp4', 'mov', 'webm'].includes(doc.extension.toLowerCase())

            return (
              <div
                key={doc.id}
                className="group relative rounded-2xl border border-gray-200 bg-white p-4 space-y-3 hover:shadow-md hover:border-purple-200 transition-all flex flex-col justify-between"
              >
                {/* Top Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'size-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs uppercase',
                        isImage
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : isPdf
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : isVideo
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'bg-purple-50 text-purple-600 border border-purple-200'
                      )}
                    >
                      {isImage ? (
                        <ImageIcon size={18} />
                      ) : isVideo ? (
                        <Film size={18} />
                      ) : (
                        <FileText size={18} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-[#111827] truncate group-hover:text-[#5B3FD9] transition-colors">
                        {doc.file_name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-0.5">
                        <span className="font-bold text-[#5B3FD9]">{doc.category}</span>
                        <span>•</span>
                        <span>{formatBytes(doc.file_size)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Share badge */}
                  {doc.shared_with_client ? (
                    <span
                      onClick={() => userRole === 'admin' && handleToggleShare(doc.id)}
                      className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[9px] border border-emerald-200 cursor-pointer shrink-0"
                      title="Shared with Client Portal"
                    >
                      Client Portal
                    </span>
                  ) : (
                    <span
                      onClick={() => userRole === 'admin' && handleToggleShare(doc.id)}
                      className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-extrabold text-[9px] border border-gray-200 cursor-pointer shrink-0"
                      title="Internal Admin Only"
                    >
                      Internal Only
                    </span>
                  )}
                </div>

                {/* Thumbnail Preview Area */}
                <div
                  onClick={() => setPreviewDoc(doc)}
                  className="h-28 rounded-xl bg-gray-900 border border-gray-200 overflow-hidden relative group/thumb cursor-pointer flex items-center justify-center"
                >
                  {isImage ? (
                    <img src={doc.file_url} alt={doc.file_name} className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300" />
                  ) : isVideo ? (
                    <div className="flex flex-col items-center gap-1 text-blue-400">
                      <Film size={28} />
                      <span className="text-[10px] font-mono font-bold">Play Video ({doc.extension.toUpperCase()})</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-purple-300">
                      <FileText size={28} />
                      <span className="text-[10px] font-mono font-bold">Preview Document ({doc.extension.toUpperCase()})</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="px-3 py-1.5 rounded-xl bg-white/90 text-gray-900 font-extrabold text-xs flex items-center gap-1.5 shadow-md">
                      <Eye size={14} className="text-[#5B3FD9]" /> Preview
                    </span>
                  </div>
                </div>

                {/* Metadata Info */}
                <div className="text-[10px] text-gray-500 font-mono space-y-0.5 border-t border-gray-100 pt-2">
                  <div className="flex items-center justify-between">
                    <span>Uploaded by: <strong className="text-gray-700">{doc.uploaded_by}</strong></span>
                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-xs font-bold">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-purple-50 hover:border-[#5B3FD9] text-gray-700 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Preview"
                    >
                      <Eye size={13} className="text-[#5B3FD9]" />
                    </button>

                    <button
                      onClick={() => {
                        const a = document.createElement('a')
                        a.href = doc.file_url
                        a.download = doc.file_name
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                      }}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-purple-50 hover:border-[#5B3FD9] text-gray-700 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Download"
                    >
                      <Download size={13} className="text-emerald-600" />
                    </button>

                    {onTriggerAiAnalysis && (
                      <button
                        onClick={() => onTriggerAiAnalysis(doc, `Analyze document "${doc.file_name}" (${doc.category})`)}
                        className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#5B3FD9] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Analyze with Trufocus AI"
                      >
                        <Sparkles size={13} />
                      </button>
                    )}
                  </div>

                  {userRole === 'admin' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setRenameDoc(doc)
                          setNewFileName(doc.file_name)
                        }}
                        className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 cursor-pointer"
                        title="Rename"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        onClick={() => {
                          setMoveDoc(doc)
                          setTargetCategory(doc.category)
                        }}
                        className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 cursor-pointer"
                        title="Move Category"
                      >
                        <FolderInput size={13} />
                      </button>

                      <label
                        className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 cursor-pointer"
                        title="Replace Version"
                      >
                        <RefreshCw size={13} />
                        <input
                          type="file"
                          onChange={(e) => handleReplaceFile(doc.id, e)}
                          className="hidden"
                        />
                      </label>

                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:border-red-300 text-red-600 cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Inline Previewer Modal */}
      {previewDoc && (
        <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}

      {/* Rename Modal */}
      {renameDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-extrabold text-[#111827]">Rename Document</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full p-3 bg-[#FAFAFC] rounded-xl border border-gray-300 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#5B3FD9]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRenameDoc(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                className="px-5 py-2 rounded-xl bg-[#5B3FD9] text-white font-extrabold text-xs shadow-xs"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Category Modal */}
      {moveDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-extrabold text-[#111827]">Move Document Category</h3>
            <select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value as DocumentCategory)}
              className="w-full p-3 bg-[#FAFAFC] rounded-xl border border-gray-300 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#5B3FD9]"
            >
              {ALL_DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setMoveDoc(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleMoveSubmit}
                className="px-5 py-2 rounded-xl bg-[#5B3FD9] text-white font-extrabold text-xs shadow-xs"
              >
                Move Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
