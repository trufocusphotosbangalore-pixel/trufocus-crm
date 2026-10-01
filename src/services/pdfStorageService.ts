export interface GeneratedDocumentRecord {
  id: string
  type: 'quotation' | 'invoice' | 'receipt'
  work_order_id: string
  work_order_number: string
  doc_number: string
  file_name: string
  version: number
  generated_at: string
  file_url?: string
}

const PDF_STORAGE_KEY = 'trufocus_crm_pdf_documents_v1'

export function loadAllStoredPDFs(): GeneratedDocumentRecord[] {
  try {
    const raw = localStorage.getItem(PDF_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error loading stored PDFs:', e)
  }
  return []
}

export function saveStoredPDFRecord(record: Omit<GeneratedDocumentRecord, 'id' | 'generated_at'>): GeneratedDocumentRecord {
  const existing = loadAllStoredPDFs()
  const matchingType = existing.filter(
    (d) => d.work_order_number === record.work_order_number && d.type === record.type
  )
  const nextVersion = matchingType.length + 1

  const newRecord: GeneratedDocumentRecord = {
    ...record,
    id: `pdf_${Date.now()}`,
    version: record.version || nextVersion,
    generated_at: new Date().toISOString(),
  }

  const updated = [newRecord, ...existing]
  try {
    localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Error saving PDF record:', e)
  }
  return newRecord
}

export function getLatestPDFVersion(workOrderNumber: string, type: 'quotation' | 'invoice' | 'receipt'): number {
  const existing = loadAllStoredPDFs()
  const matches = existing.filter((d) => d.work_order_number === workOrderNumber && d.type === type)
  return matches.length > 0 ? Math.max(...matches.map((m) => m.version)) : 1
}
