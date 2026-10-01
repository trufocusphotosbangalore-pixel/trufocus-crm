import { getCRMContextSummary } from './aiContextStore'
import { recordAIUsage } from './aiUsageStore'
import { buildTrufocusSystemPrompt } from './aiSystemPromptBuilder'
import { analyzePromptPermission } from './aiPermissionService'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  isStreaming?: boolean
}

export interface StreamChatOptions {
  messages: ChatMessage[]
  useCRMContext?: boolean
  customRules?: string[]
  onChunk: (chunkText: string) => void
  onComplete: (fullText: string) => void
  onError: (errorMessage: string) => void
  signal?: AbortSignal
}

let activeModelName = 'gpt-4o-mini'

export function formatModelDisplayName(modelRaw?: string): string {
  if (!modelRaw) return 'GPT-4o Mini'
  const m = modelRaw.trim()
  if (m === 'gpt-4o-mini') return 'GPT-4o Mini'
  if (m === 'gpt-4o') return 'GPT-4o'
  if (m === 'gpt-4') return 'GPT-4'
  if (m === 'gpt-3.5-turbo') return 'GPT-3.5 Turbo'
  if (m === 'o1-mini') return 'O1 Mini'
  if (m === 'o3-mini') return 'O3 Mini'
  if (m === 'gpt-5') return 'GPT-5'
  if (m.toLowerCase().includes('gemini')) return 'Gemini 1.5 Flash'
  return m.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export async function fetchActiveAIModel(): Promise<string> {
  try {
    let res = await fetch('/api/ai/models')
    if (!res.ok) {
      res = await fetch('/.netlify/functions/models')
    }
    if (res.ok) {
      const data = await res.json()
      if (data.activeModel) {
        activeModelName = data.activeModel
        return activeModelName
      }
    }
  } catch {
    // ignore
  }
  return activeModelName
}

export async function streamAIChatResponse({
  messages,
  useCRMContext = true,
  customRules = [],
  onChunk,
  onComplete,
  onError,
  signal,
}: StreamChatOptions): Promise<void> {
  // RULE 1, 2, 3, 6 & 7: Permission Check before execution
  const lastUserMsg = messages.slice().reverse().find((m) => m.role === 'user')?.content || ''
  if (lastUserMsg) {
    const permResult = analyzePromptPermission(lastUserMsg)
    if (!permResult.allowed) {
      const deniedMsg = permResult.reason
      onChunk(deniedMsg)
      onComplete(deniedMsg)
      return
    }
  }

  const crmContext = useCRMContext ? getCRMContextSummary() : ''
  const systemPrompt = buildTrufocusSystemPrompt({ useCRMContext, customRules })

  const apiMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  let fullResponseText = ''

  try {
    let res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: apiMessages,
        crmContext,
        systemPrompt,
      }),
      signal,
    })

    if (!res.ok && res.status === 404) {
      console.warn('[AI Service] /api/ai/chat returned 404. Falling back to direct function path: /.netlify/functions/chat')
      res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          crmContext,
          systemPrompt,
        }),
        signal,
      })
    }

    if (!res.ok) {
      let errorDetail = `Server returned status ${res.status}`
      try {
        const errJson = await res.json()
        if (errJson.error) {
          if (typeof errJson.error === 'string') {
            errorDetail = errJson.error
          } else if (typeof errJson.error === 'object' && errJson.error.message) {
            errorDetail = errJson.error.message
          } else {
            errorDetail = JSON.stringify(errJson.error)
          }
        }
      } catch {
        // default error message
      }
      throw new Error(errorDetail)
    }

    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const json = await res.json()
      if (json.model) activeModelName = json.model
      const replyText = json.reply || json.text || json.choices?.[0]?.message?.content || json.choices?.[0]?.text || ''
      if (replyText) {
        fullResponseText = replyText
        onChunk(replyText)

        // Record usage
        const promptTokens = Math.ceil((systemPrompt.length + crmContext.length + messages.reduce((s, m) => s + m.content.length, 0)) / 4)
        const completionTokens = Math.ceil(fullResponseText.length / 4)
        const totalTokens = promptTokens + completionTokens
        const estimatedCostUsd = parseFloat(((promptTokens * 0.00000015) + (completionTokens * 0.00000060)).toFixed(6))

        recordAIUsage({
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          estimated_cost_usd: estimatedCostUsd,
          model: activeModelName,
          action_summary: messages[messages.length - 1]?.content.slice(0, 40) || 'AI Assistant Chat',
        })

        onComplete(replyText)
        return
      }
    }

    if (!res.body) {
      throw new Error('ReadableStream not supported by response.')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let done = false
    let lineBuffer = ''

    while (!done) {
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      if (value) {
        lineBuffer += decoder.decode(value, { stream: true })
        const lines = lineBuffer.split('\n')
        lineBuffer = lines.pop() || '' // Keep last incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':')) continue

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim()
            if (dataStr === '[DONE]') {
              done = true
              break
            }

            try {
              const parsed = JSON.parse(dataStr)
              if (parsed.model) activeModelName = parsed.model

              if (parsed.error) {
                throw new Error(parsed.error)
              }

              // Extract ONLY the text snippet. NEVER output raw API JSON.
              const textChunk =
                parsed.text ??
                parsed.choices?.[0]?.delta?.content ??
                parsed.choices?.[0]?.text ??
                parsed.choices?.[0]?.message?.content ??
                ''

              if (textChunk) {
                fullResponseText += textChunk
                onChunk(textChunk)
              }
            } catch (parseErr: any) {
              // If error parsed from backend
              if (parseErr.message && !parseErr.message.includes('JSON')) {
                throw parseErr
              }
              // Skip malformed SSE lines silently - DO NOT render raw API event strings!
            }
          }
        }
      }
    }

    // Process any remaining buffered text at the end
    if (lineBuffer.trim().startsWith('data: ')) {
      const dataStr = lineBuffer.trim().slice(6).trim()
      if (dataStr !== '[DONE]') {
        try {
          const parsed = JSON.parse(dataStr)
          if (parsed.model) activeModelName = parsed.model
          const textChunk = parsed.text ?? parsed.choices?.[0]?.delta?.content ?? ''
          if (textChunk) {
            fullResponseText += textChunk
            onChunk(textChunk)
          }
        } catch {
          // ignore
        }
      }
    }

    if (!fullResponseText.trim()) {
      fullResponseText = 'Apologies, no text was returned by the AI service.'
      onChunk(fullResponseText)
    }

    // Estimate token usage and record
    const promptTokens = Math.ceil((systemPrompt.length + crmContext.length + messages.reduce((s, m) => s + m.content.length, 0)) / 4)
    const completionTokens = Math.ceil(fullResponseText.length / 4)
    const totalTokens = promptTokens + completionTokens
    const estimatedCostUsd = parseFloat(((promptTokens * 0.00000015) + (completionTokens * 0.00000060)).toFixed(6))

    recordAIUsage({
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      estimated_cost_usd: estimatedCostUsd,
      model: activeModelName,
      action_summary: messages[messages.length - 1]?.content.slice(0, 40) || 'AI Assistant Chat',
    })

    onComplete(fullResponseText)
  } catch (err: any) {
    if (err.name === 'AbortError') {
      onComplete(fullResponseText || 'Generation stopped by user.')
      return
    }
    console.error('AI Chat Error:', err)
    onError(err.message || 'Unable to connect to Trufocus AI server.')
  }
}
