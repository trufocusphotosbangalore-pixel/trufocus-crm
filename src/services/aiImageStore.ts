export interface GeneratedImageRecord {
  id: string
  originalPrompt: string
  finalPrompt: string
  prompt?: string
  url: string
  createdAt: string
  workOrderId?: string
  clientName?: string
  category?: string
  model?: string
  size?: string
  quality?: string
  generationTimeMs?: number
  debugInfo?: {
    requestJson: any
    responseJson: any
  }
}

const STORAGE_IMAGES_KEY = 'trufocus_ai_generated_images_v1'

export function getGeneratedImagesHistory(workOrderId?: string): GeneratedImageRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_IMAGES_KEY)
    if (raw) {
      const list: GeneratedImageRecord[] = JSON.parse(raw)
      if (workOrderId && workOrderId !== 'all') {
        return list.filter((img) => img.workOrderId === workOrderId)
      }
      return list
    }
  } catch (e) {
    console.error('Error reading generated images history:', e)
  }
  return []
}

export function saveGeneratedImageRecord(record: Omit<GeneratedImageRecord, 'id' | 'createdAt'>): GeneratedImageRecord {
  const history = getGeneratedImagesHistory()
  const newRecord: GeneratedImageRecord = {
    ...record,
    id: 'img-' + Date.now(),
    createdAt: new Date().toISOString(),
  }
  const updated = [newRecord, ...history]
  try {
    localStorage.setItem(STORAGE_IMAGES_KEY, JSON.stringify(updated.slice(0, 100)))
  } catch (e) {
    console.error('Error saving generated image record:', e)
  }
  return newRecord
}

export function deleteGeneratedImageRecord(id: string): void {
  const history = getGeneratedImagesHistory()
  const updated = history.filter((img) => img.id !== id)
  try {
    localStorage.setItem(STORAGE_IMAGES_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Error deleting image record:', e)
  }
}
