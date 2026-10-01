import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'
import { wipeAllCRMDataToClean } from '@/services/supabase/workOrders'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CRITICAL_CLIENT_ERROR] Uncaught Exception in React tree:', error, errorInfo)
    const msg = (error?.message || '').toLowerCase()
    if (
      msg.includes('failed to fetch dynamically imported module') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('importing a module script failed')
    ) {
      const reloadKey = 'trufocus_chunk_reload_attempt'
      const hasReloaded = sessionStorage.getItem(reloadKey)
      if (!hasReloaded) {
        sessionStorage.setItem(reloadKey, 'true')
        window.location.reload()
        return
      }
    }
    this.setState({ errorInfo })
  }

  private handleReload = () => {
    try {
      sessionStorage.removeItem('trufocus_chunk_reload_attempt')
    } catch {}
    window.location.reload()
  }

  private handleClearCache = () => {
    if (window.confirm('Clear all cached browser state and re-initialize session?')) {
      try {
        wipeAllCRMDataToClean()
        localStorage.clear()
      } catch (e) {
        console.error('Error clearing storage:', e)
      }
      window.location.href = '/login'
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 font-sans text-white">
          <div className="max-w-lg w-full bg-[#1E293B] border border-slate-700/80 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
            <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-block">
                Application Protection Active
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight">Studio Control Center Auto-Recovery</h1>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                An unexpectedly formatted dataset or state anomaly occurred. The system has prevented a crash.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 text-left font-mono text-[11px] text-amber-300/90 overflow-x-auto max-h-36 scrollbar-thin">
                <p className="font-bold text-red-400">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-slate-400 mt-2 font-mono whitespace-pre-wrap">
                    {this.state.error.stack.split('\n').slice(0, 4).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#5B3FD9]/30 transition-all"
              >
                <RefreshCw size={14} /> Reload Control Center
              </button>
              <button
                onClick={this.handleClearCache}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-700"
              >
                <Trash2 size={14} className="text-red-400" /> Reset Session Data
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
