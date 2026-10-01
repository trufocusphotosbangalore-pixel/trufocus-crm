import { useState, useEffect } from 'react'
import { KeyRound, Server, CheckCircle2, AlertTriangle, Cpu, Check, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  fetchAvailableOpenAIModels,
  testOpenAIImageAPI,
  getActiveImageModel,
  setActiveImageModel,
  type OpenAIModelInfo,
} from '@/services/aiImageService'
import { OpenAiErrorDisplay, type StructuredOpenAiError } from '@/components/ai/OpenAiErrorDisplay'
import { toast } from 'react-hot-toast'

export function AiDeveloperTab() {
  const [selectedModel, setSelectedModel] = useState<string>(() => getActiveImageModel())
  const [availableModels, setAvailableModels] = useState<OpenAIModelInfo[]>([])
  const [gptImage1Available, setGptImage1Available] = useState<boolean | null>(null)
  const [modelFetchReason, setModelFetchReason] = useState<string>('')
  const [isFetchingModels, setIsFetchingModels] = useState(false)

  // Test API state
  const [isTestingApi, setIsTestingApi] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    url?: string
    error?: StructuredOpenAiError
    generationTimeMs: number
  } | null>(null)

  // Check models on mount
  useEffect(() => {
    handleCheckModels()
  }, [])

  const handleCheckModels = async () => {
    setIsFetchingModels(true)
    try {
      const res = await fetchAvailableOpenAIModels()
      setAvailableModels(res.models)
      setGptImage1Available(res.gptImage1Available)
      setModelFetchReason(res.reason)
      toast.success(`Checked OpenAI models! Found ${res.models.length} image model(s).`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch OpenAI models.')
    } finally {
      setIsFetchingModels(false)
    }
  }

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId)
    setActiveImageModel(modelId)
    toast.success(`Active image model set to: ${modelId}`)
  }

  const handleTestImageApi = async () => {
    setIsTestingApi(true)
    setTestResult(null)
    toast('Running OpenAI Image API Test...', { icon: '🧪' })

    try {
      const result = await testOpenAIImageAPI(selectedModel)
      setTestResult(result)
      if (result.success) {
        toast.success('✓ Image API Test Passed!')
      } else {
        toast.error('Image API Test Failed.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Test execution failed.')
    } finally {
      setIsTestingApi(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ─── Startup Model Warning Banner (Requirement #4) ─── */}
      {gptImage1Available === false && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-2xs space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-amber-900 flex items-center gap-2 text-xs uppercase tracking-wider">
              <AlertTriangle size={18} className="text-amber-600" />
              <span>Model Availability Warning</span>
            </span>
            <span className="text-[10px] font-mono font-bold bg-amber-200/80 px-2.5 py-0.5 rounded-md text-amber-950">
              gpt-image-1 Unavailable
            </span>
          </div>

          <p className="text-xs font-medium leading-relaxed">
            {modelFetchReason}
          </p>

          <div className="p-3 rounded-xl bg-white border border-amber-200/80 text-xs space-y-1">
            <span className="font-bold text-amber-950 block">Recommendation:</span>
            <p className="text-amber-900 text-[11px]">
              Select an available model from your account below (such as <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-900">dall-e-3</code>) or contact OpenAI support for account access to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-900">gpt-image-1</code>.
            </p>
          </div>
        </div>
      )}

      {/* ─── Model Configuration & Actions ─── */}
      <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
              <Cpu size={18} className="text-[#5B3FD9]" />
              <span>OpenAI Image Generation Settings</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Verify API access, inspect available models for your API key, and test image generation endpoints.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCheckModels}
              disabled={isFetchingModels}
              className="px-4 h-10 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <KeyRound size={14} className={cn(isFetchingModels && 'animate-spin')} />
              <span>Check Available Models</span>
            </button>

            <button
              onClick={handleTestImageApi}
              disabled={isTestingApi}
              className="px-5 h-10 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Server size={14} className={cn(isTestingApi && 'animate-spin')} />
              <span>Test Image API</span>
            </button>
          </div>
        </div>

        {/* ─── Available Models List (Requirement #3) ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#111827] uppercase tracking-wider font-mono">
              Supported Models List
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              Active: <strong className="text-[#5B3FD9]">{selectedModel}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* gpt-image-1 Card */}
            <div
              onClick={() => handleSelectModel('gpt-image-1')}
              className={cn(
                'p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative',
                selectedModel === 'gpt-image-1'
                  ? 'bg-purple-50/70 border-[#5B3FD9] shadow-xs'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {gptImage1Available ? (
                    <span className="text-emerald-600 font-black text-xs flex items-center gap-1">
                      <Check size={14} /> ✓ gpt-image-1
                    </span>
                  ) : (
                    <span className="text-red-500 font-bold text-xs flex items-center gap-1">
                      <X size={14} /> ✗ gpt-image-1 (Unavailable)
                    </span>
                  )}
                </div>

                {selectedModel === 'gpt-image-1' && (
                  <span className="px-2 py-0.5 rounded-full bg-[#5B3FD9] text-white text-[9px] font-black uppercase">
                    Active
                  </span>
                )}
              </div>

              <p className="text-[11px] text-gray-500">
                Latest OpenAI Image Generation Model.
              </p>
            </div>

            {/* dall-e-3 Card */}
            <div
              onClick={() => handleSelectModel('dall-e-3')}
              className={cn(
                'p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative',
                selectedModel === 'dall-e-3'
                  ? 'bg-purple-50/70 border-[#5B3FD9] shadow-xs'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-emerald-600 font-black text-xs flex items-center gap-1">
                  <Check size={14} /> ✓ dall-e-3
                </span>

                {selectedModel === 'dall-e-3' && (
                  <span className="px-2 py-0.5 rounded-full bg-[#5B3FD9] text-white text-[9px] font-black uppercase">
                    Active
                  </span>
                )}
              </div>

              <p className="text-[11px] text-gray-500">
                High-definition image generation model (1024x1024).
              </p>
            </div>

            {/* Other fetched models */}
            {availableModels
              .filter((m) => m.id !== 'gpt-image-1' && m.id !== 'dall-e-3')
              .map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelectModel(m.id)}
                  className={cn(
                    'p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative',
                    selectedModel === m.id
                      ? 'bg-purple-50/70 border-[#5B3FD9] shadow-xs'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-600 font-black text-xs flex items-center gap-1 truncate">
                      <Check size={14} /> ✓ {m.id}
                    </span>

                    {selectedModel === m.id && (
                      <span className="px-2 py-0.5 rounded-full bg-[#5B3FD9] text-white text-[9px] font-black uppercase shrink-0">
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 truncate">
                    Owned by {m.owned_by || 'OpenAI'}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* ─── Requirement 6: Test Image API Result Output ─── */}
        {testResult && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-extrabold text-[#111827] uppercase font-mono flex items-center justify-between">
              <span>Test API Result for "{selectedModel}"</span>
              <span className="text-[10px] text-gray-400">Execution Time: {testResult.generationTimeMs}ms</span>
            </h4>

            {testResult.success && testResult.url ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-black text-xs text-emerald-800">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>✓ Success — Image API Call Passed!</span>
                </div>

                <div className="flex items-center gap-4">
                  <img src={testResult.url} alt="Test Red Apple" className="size-24 rounded-xl object-cover border border-emerald-300 shadow-2xs bg-black" />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-emerald-950">Prompt: "A red apple on a white background"</p>
                    <p className="text-[11px] text-emerald-800">High-resolution image received directly from OpenAI API.</p>
                  </div>
                </div>
              </div>
            ) : testResult.error ? (
              <OpenAiErrorDisplay
                error={testResult.error}
                onTestImageApi={handleTestImageApi}
                onCheckModels={handleCheckModels}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
