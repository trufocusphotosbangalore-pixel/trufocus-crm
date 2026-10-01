import { AlertTriangle, Server, KeyRound, ShieldAlert } from 'lucide-react'

export interface StructuredOpenAiError {
  httpStatus: number
  type: string
  code: string
  message: string
  requestedModel: string
  requestId?: string | null
  param?: string | null
}

interface OpenAiErrorDisplayProps {
  error: StructuredOpenAiError | string
  onTestImageApi?: () => void
  onCheckModels?: () => void
}

export function OpenAiErrorDisplay({ error, onTestImageApi, onCheckModels }: OpenAiErrorDisplayProps) {
  if (typeof error === 'string') {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-2 text-xs font-sans">
        <div className="flex items-center gap-2 font-black text-red-700">
          <AlertTriangle size={16} />
          <span>OpenAI API Error</span>
        </div>
        <p className="font-medium text-red-800 leading-relaxed">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-5 rounded-2xl bg-red-950 text-red-100 border border-red-800 shadow-lg space-y-4 font-sans animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-red-800/80 pb-3">
        <div className="flex items-center gap-2.5 text-red-400 font-black text-xs uppercase tracking-wider">
          <ShieldAlert size={18} />
          <span>OpenAI Image API Error Details</span>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-red-900/80 text-red-200 font-mono text-xs font-bold border border-red-700">
          Status: {error.httpStatus || 400}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[11px]">
        <div className="p-2.5 rounded-xl bg-red-900/40 border border-red-800/60">
          <span className="text-[10px] text-red-400 font-bold uppercase block">Model</span>
          <span className="font-extrabold text-white text-xs">{error.requestedModel || 'gpt-image-1'}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-red-900/40 border border-red-800/60">
          <span className="text-[10px] text-red-400 font-bold uppercase block">Error Type</span>
          <span className="font-bold text-amber-300 truncate block">{error.type || 'invalid_request_error'}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-red-900/40 border border-red-800/60 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-red-400 font-bold uppercase block">Error Code</span>
          <span className="font-bold text-red-200 truncate block">{error.code || 'model_not_found'}</span>
        </div>
      </div>

      <div className="space-y-1.5 bg-red-900/30 p-3.5 rounded-xl border border-red-800/60">
        <span className="text-[10px] font-mono font-extrabold text-red-400 uppercase block">Error Message</span>
        <p className="text-xs font-semibold text-white leading-relaxed">{error.message}</p>
      </div>

      {error.requestId && (
        <div className="flex items-center justify-between text-[10px] font-mono text-red-400 pt-1">
          <span>Request ID: <strong className="text-red-200">{error.requestId}</strong></span>
          {error.param && <span>Param: <strong className="text-red-200">{error.param}</strong></span>}
        </div>
      )}

      {(onTestImageApi || onCheckModels) && (
        <div className="pt-2 border-t border-red-800/60 flex flex-wrap items-center gap-2">
          {onCheckModels && (
            <button
              onClick={onCheckModels}
              className="px-3 py-1.5 rounded-xl bg-red-900 hover:bg-red-800 text-white font-bold text-xs flex items-center gap-1.5 border border-red-700 transition-colors cursor-pointer"
            >
              <KeyRound size={13} /> Check Available Models
            </button>
          )}
          {onTestImageApi && (
            <button
              onClick={onTestImageApi}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 border border-amber-500 transition-colors cursor-pointer"
            >
              <Server size={13} /> Test Image API
            </button>
          )}
        </div>
      )}
    </div>
  )
}
