import type { CrmDocumentRecord, DocumentCategory, DocumentModule } from '@/types/document'
import { supabase } from '@/services/supabase/client'

const STORAGE_DOCUMENTS_KEY = 'trufocus_crm_documents_v1'

// Default seed documents for rich demonstration
const DEFAULT_SEED_DOCUMENTS: CrmDocumentRecord[] = [
  {
    id: 'doc_seed_1',
    file_name: 'Ananya_Wedding_Photography_Contract_Signed.pdf',
    file_size: 2450000,
    file_type: 'application/pdf',
    extension: 'pdf',
    category: 'Contracts',
    module: 'work_orders',
    related_id: 'wo_101',
    related_number: 'WO-2026-001',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    uploaded_by: 'Ramesh (Admin)',
    uploaded_at: '2026-08-01T10:30:00.000Z',
    shared_with_client: true,
    notes: 'Signed contract copy received with initial advance payment.',
  },
  {
    id: 'doc_seed_2',
    file_name: 'Haldi_Stage_Decor_Inspiration_Moodboard.jpg',
    file_size: 1850000,
    file_type: 'image/jpeg',
    extension: 'jpg',
    category: 'Reference Images',
    module: 'work_orders',
    related_id: 'wo_101',
    related_number: 'WO-2026-001',
    file_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    uploaded_by: 'Ananya (Client)',
    uploaded_at: '2026-08-02T14:15:00.000Z',
    shared_with_client: true,
    notes: 'Yellow and marigold stage decor setup reference photo.',
  },
  {
    id: 'doc_seed_3',
    file_name: 'Trufocus_Official_Invoice_WO001.pdf',
    file_size: 820000,
    file_type: 'application/pdf',
    extension: 'pdf',
    category: 'Invoices',
    module: 'finances',
    related_id: 'wo_101',
    related_number: 'WO-2026-001',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    uploaded_by: 'Accounts Team',
    uploaded_at: '2026-08-03T11:00:00.000Z',
    shared_with_client: true,
    notes: 'Tax Invoice generated for 50% advance booking fee.',
  },
]

// ─── Storage Handlers ────────────────────────────────────────────────────────

export function loadAllDocuments(): CrmDocumentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_DOCUMENTS_KEY)
    if (raw) {
      const parsed: CrmDocumentRecord[] = JSON.parse(raw)
      if (parsed.length > 0) return parsed
    }
  } catch (e) {
    console.error('Error loading stored documents:', e)
  }

  // Seed defaults if empty
  try {
    localStorage.setItem(STORAGE_DOCUMENTS_KEY, JSON.stringify(DEFAULT_SEED_DOCUMENTS))
  } catch (e) {
    // ignore
  }
  return DEFAULT_SEED_DOCUMENTS
}

export function saveAllDocuments(docs: CrmDocumentRecord[]): void {
  try {
    localStorage.setItem(STORAGE_DOCUMENTS_KEY, JSON.stringify(docs))
  } catch (e) {
    console.error('Error saving documents:', e)
  }
}

// ─── Filter & Retrieval ─────────────────────────────────────────────────────

export function getDocumentsByModule(module: DocumentModule, relatedId?: string): CrmDocumentRecord[] {
  const all = loadAllDocuments()
  return all.filter((d) => {
    if (d.module !== module) return false
    if (relatedId && relatedId !== 'all' && d.related_id !== relatedId) return false
    return true
  })
}

export function getDocumentsByWorkOrder(workOrderId: string): CrmDocumentRecord[] {
  const all = loadAllDocuments()
  return all.filter((d) => d.related_id === workOrderId || d.related_number === workOrderId)
}

// ─── Upload File Handler (Supabase Storage + Local Fallback) ───

export async function uploadCrmDocumentFile({
  file,
  category,
  module,
  relatedId,
  relatedNumber,
  uploadedBy = 'Admin User',
  sharedWithClient = true,
  notes,
  onProgress,
}: {
  file: File
  category: DocumentCategory
  module: DocumentModule
  relatedId: string
  relatedNumber?: string
  uploadedBy?: string
  sharedWithClient?: boolean
  notes?: string
  onProgress?: (percent: number) => void
}): Promise<CrmDocumentRecord> {
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  const ext = file.name.split('.').pop()?.toLowerCase() || 'dat'
  const fileName = file.name

  let fileUrl = ''
  let storagePath = ''

  if (onProgress) onProgress(20)

  // 1. Try Supabase Storage Upload
  try {
    if (supabase) {
      const path = `${module}/${relatedId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { data, error } = await supabase.storage.from('trufocus_documents').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      })

      if (!error && data?.path) {
        storagePath = data.path
        const { data: pubUrlData } = supabase.storage.from('trufocus_documents').getPublicUrl(data.path)
        if (pubUrlData?.publicUrl) {
          fileUrl = pubUrlData.publicUrl
        }
      }
    }
  } catch (err) {
    console.warn('Supabase storage upload skipped or unconfigured, proceeding with data URL fallback:', err)
  }

  if (onProgress) onProgress(60)

  // 2. Fallback to Object URL / Data URL if Supabase storage url not generated
  if (!fileUrl) {
    fileUrl = await fileToDataUrl(file)
  }

  if (onProgress) onProgress(90)

  const newDoc: CrmDocumentRecord = {
    id: docId,
    file_name: fileName,
    file_size: file.size,
    file_type: file.type || `application/${ext}`,
    extension: ext,
    category,
    module,
    related_id: relatedId,
    related_number: relatedNumber,
    file_url: fileUrl,
    storage_path: storagePath || undefined,
    uploaded_by: uploadedBy,
    uploaded_at: new Date().toISOString(),
    shared_with_client: sharedWithClient,
    notes: notes || undefined,
  }

  const existing = loadAllDocuments()
  saveAllDocuments([newDoc, ...existing])

  if (onProgress) onProgress(100)
  return newDoc
}

// ─── File Actions ────────────────────────────────────────────────────────────

export function renameCrmDocument(id: string, newFileName: string): CrmDocumentRecord {
  const existing = loadAllDocuments()
  const updated = existing.map((d) => (d.id === id ? { ...d, file_name: newFileName } : d))
  saveAllDocuments(updated)
  return updated.find((d) => d.id === id)!
}

export function moveCrmDocument(id: string, targetCategory: DocumentCategory, targetModule?: DocumentModule, targetRelatedId?: string): CrmDocumentRecord {
  const existing = loadAllDocuments()
  const updated = existing.map((d) => {
    if (d.id === id) {
      return {
        ...d,
        category: targetCategory,
        module: targetModule || d.module,
        related_id: targetRelatedId || d.related_id,
      }
    }
    return d
  })
  saveAllDocuments(updated)
  return updated.find((d) => d.id === id)!
}

export async function replaceCrmDocument(id: string, newFile: File): Promise<CrmDocumentRecord> {
  const existing = loadAllDocuments()
  const oldDoc = existing.find((d) => d.id === id)
  if (!oldDoc) throw new Error('Document not found')

  const fileUrl = await fileToDataUrl(newFile)
  const ext = newFile.name.split('.').pop()?.toLowerCase() || oldDoc.extension

  const updatedDoc: CrmDocumentRecord = {
    ...oldDoc,
    file_name: newFile.name,
    file_size: newFile.size,
    file_type: newFile.type || oldDoc.file_type,
    extension: ext,
    file_url: fileUrl,
    uploaded_at: new Date().toISOString(),
  }

  const updatedList = existing.map((d) => (d.id === id ? updatedDoc : d))
  saveAllDocuments(updatedList)
  return updatedDoc
}

export function deleteCrmDocument(id: string): void {
  const existing = loadAllDocuments()
  const updated = existing.filter((d) => d.id !== id)
  saveAllDocuments(updated)
}

export function toggleDocumentClientShare(id: string): CrmDocumentRecord {
  const existing = loadAllDocuments()
  const updated = existing.map((d) => (d.id === id ? { ...d, shared_with_client: !d.shared_with_client } : d))
  saveAllDocuments(updated)
  return updated.find((d) => d.id === id)!
}

// Helper: Convert File to Data URL
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => {
      // Return blob URL if reader fails
      resolve(URL.createObjectURL(file))
    }
    reader.readAsDataURL(file)
  })
}

// Utility: Format File Size
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
