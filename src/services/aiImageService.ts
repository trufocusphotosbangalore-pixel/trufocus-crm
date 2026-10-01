import { saveGeneratedImageRecord, type GeneratedImageRecord } from './aiImageStore'
import type { StructuredOpenAiError } from '@/components/ai/OpenAiErrorDisplay'

export type ImageQualityOption = 'low' | 'medium' | 'high' | 'auto'

export interface GenerateImageOptions {
  originalPrompt: string
  finalPrompt: string
  workOrderId?: string
  clientName?: string
  category?: string
  model?: string
  size?: string
  quality?: ImageQualityOption
  n?: number
}

export interface OpenAIModelInfo {
  id: string
  name: string
  available: boolean
  created?: number
  owned_by?: string
}

export interface FetchModelsResult {
  models: OpenAIModelInfo[]
  allModelsCount: number
  gptImage1Available: boolean
  reason: string
}

const STORAGE_ACTIVE_MODEL_KEY = 'trufocus_ai_active_image_model'

export function getActiveImageModel(): string {
  return localStorage.getItem(STORAGE_ACTIVE_MODEL_KEY) || 'gpt-image-1'
}

export function setActiveImageModel(model: string): void {
  localStorage.setItem(STORAGE_ACTIVE_MODEL_KEY, model)
}

// ─── Fetch Available Image Models (GET /api/ai/models) ───
export async function fetchAvailableOpenAIModels(): Promise<FetchModelsResult> {
  try {
    const res = await fetch('/api/ai/models')
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.error || `HTTP ${res.status} when fetching models`)
    }
    return await res.json()
  } catch (err: any) {
    console.error('Error fetching OpenAI models:', err)
    throw err
  }
}

// ─── Generate AI Image (POST /api/ai/image) ───
export async function generateAIImage({
  originalPrompt,
  finalPrompt,
  workOrderId,
  clientName,
  category,
  model = 'gpt-image-1',
  size = '1024x1024',
  quality = 'auto',
  n = 1,
}: GenerateImageOptions): Promise<{ record: GeneratedImageRecord; rawResponse: any; generationTimeMs: number }> {
  // Requirement 5: Log complete API request parameters
  console.log('====================================================')
  console.log('[OpenAI Images API Request Parameters]')
  console.log('User Original Prompt:', originalPrompt)
  console.log('Final Prompt Sent:', finalPrompt)
  console.log('Model:', model)
  console.log('Size:', size)
  console.log('Quality:', quality)
  console.log('Number of Images:', n)
  console.log('====================================================')

  const startTime = performance.now()

  try {
    const requestPayload = {
      model,
      prompt: finalPrompt,
      size,
      quality,
      n,
    }

    const res = await fetch('/api/ai/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    })

    const generationTimeMs = Math.round(performance.now() - startTime)
    const data = await res.json()

    // Requirement 5: Log complete API response
    console.log('====================================================')
    console.log(`[OpenAI Images API Response (${res.status})]`)
    console.log(JSON.stringify(data, null, 2))
    console.log('====================================================')

    if (!res.ok) {
      const errObj: StructuredOpenAiError = typeof data.error === 'object'
        ? data.error
        : {
            httpStatus: res.status,
            type: 'invalid_request_error',
            code: 'api_error',
            message: data.error || `OpenAI API error (${res.status})`,
            requestedModel: model,
            requestId: data.requestId || null,
          }

      const err = new Error(errObj.message) as any
      err.structuredError = errObj
      err.rawResponse = data.rawResponse || data
      err.requestPayload = requestPayload
      err.generationTimeMs = generationTimeMs
      throw err
    }

    if (!data.url) {
      throw new Error(data.error?.message || 'No image URL or Base64 returned by OpenAI Images API.')
    }

    const modelUsed = data.modelUsed || model

    const saved = saveGeneratedImageRecord({
      originalPrompt,
      finalPrompt,
      url: data.url,
      workOrderId,
      clientName,
      category,
      model: modelUsed,
      size,
      quality,
      generationTimeMs,
      debugInfo: {
        requestJson: requestPayload,
        responseJson: data.rawResponse || data,
      },
    })

    return {
      record: saved,
      rawResponse: data.rawResponse || data,
      generationTimeMs,
    }
  } catch (err: any) {
    console.error('Image Generation Error:', err)
    throw err
  }
}

// ─── Test Image API with "A red apple on a white background" ───
export async function testOpenAIImageAPI(selectedModel: string = 'gpt-image-1'): Promise<{
  success: boolean
  url?: string
  error?: StructuredOpenAiError
  generationTimeMs: number
}> {
  const testPrompt = 'A red apple on a white background'
  const startTime = performance.now()

  try {
    const res = await generateAIImage({
      originalPrompt: testPrompt,
      finalPrompt: testPrompt,
      model: selectedModel,
      size: '1024x1024',
      quality: 'auto',
    })
    return {
      success: true,
      url: res.record.url,
      generationTimeMs: res.generationTimeMs,
    }
  } catch (err: any) {
    const generationTimeMs = Math.round(performance.now() - startTime)
    const structuredError: StructuredOpenAiError = err.structuredError || {
      httpStatus: 400,
      type: 'invalid_request_error',
      code: 'test_failed',
      message: err.message || 'Image API test failed.',
      requestedModel: selectedModel,
    }
    return {
      success: false,
      error: structuredError,
      generationTimeMs,
    }
  }
}
