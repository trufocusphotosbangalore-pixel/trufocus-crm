export interface AIUsageRecord {
  id: string
  timestamp: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  estimated_cost_usd: number
  model: string
  action_summary: string
}

const STORAGE_KEY = 'trufocus_ai_usage_v1'

export function getAIUsageHistory(): AIUsageRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to read AI usage history:', e)
  }
  return []
}

export function recordAIUsage(record: Omit<AIUsageRecord, 'id' | 'timestamp'>): AIUsageRecord {
  const history = getAIUsageHistory()
  const newRecord: AIUsageRecord = {
    ...record,
    id: 'use-' + Date.now(),
    timestamp: new Date().toISOString(),
  }
  const updated = [newRecord, ...history]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 100)))
  } catch (e) {
    console.error('Failed to save AI usage record:', e)
  }
  return newRecord
}

export function getAIUsageSummary() {
  const history = getAIUsageHistory()
  const totalPromptTokens = history.reduce((sum, r) => sum + r.prompt_tokens, 0)
  const totalCompletionTokens = history.reduce((sum, r) => sum + r.completion_tokens, 0)
  const totalTokens = history.reduce((sum, r) => sum + r.total_tokens, 0)
  const totalCostUsd = history.reduce((sum, r) => sum + r.estimated_cost_usd, 0)

  return {
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens,
    totalCostUsd: parseFloat(totalCostUsd.toFixed(5)),
    requestCount: history.length,
  }
}
