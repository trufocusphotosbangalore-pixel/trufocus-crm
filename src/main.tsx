import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from '@/components/common/ErrorBoundary.tsx'

// Auto-recover from dynamic import chunk load failures (e.g. after a new Netlify deployment)
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[Vite] Dynamic import chunk failed to load. Auto-refreshing for latest deployment assets...', event)
    window.location.reload()
  })

  window.addEventListener('error', (event) => {
    const msg = (event.message || '').toLowerCase()
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
      }
    }
  })
}

// Purge only legacy employee-related keys on startup
try {
  const legacyEmployeeKeys = [
    'trufocus_crm_team_members_v1',
    'trufocus_crm_user_accounts_v1',
    'trufocus_session_user_v1',
  ]
  legacyEmployeeKeys.forEach((k) => {
    try { localStorage.removeItem(k) } catch {}
  })
} catch (e) {
  console.error('Error purging legacy employee keys on startup:', e)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
