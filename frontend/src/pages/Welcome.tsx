import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import RequireAuth from '../components/RequireAuth'

type LocationState = {
  redirectPath?: string
  user?: {
    username?: string
    tenant?: { name?: string; slug?: string }
  }
}

export default function Welcome() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as LocationState) || {}
  const redirectPath = state.redirectPath || '/'
  const username = state.user?.username
  const tenantName = state.user?.tenant?.name || state.user?.tenant?.slug

  // Optional: Auto-Weiterleitung nach kurzer Zeit
  useEffect(() => {
    const t = setTimeout(() => {
      // Kommentar entfernen, falls keine Auto-Weiterleitung gewünscht ist
      // navigate(redirectPath, { replace: true })
    }, 1_000)
    return () => clearTimeout(t)
  }, [navigate, redirectPath])

  function handleContinue(): void {
    navigate(redirectPath, { replace: true })
  }

  return (
    <RequireAuth>
      <div style={{ maxWidth: 720, margin: '80px auto', padding: 16, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 8 }}>
          Herzlich Willkommen{username ? `, ${username}` : ''}{tenantName ? ` (${tenantName})` : ''}
        </h1>
        <p style={{ color: '#475569', marginBottom: 24 }}>
          Sie wurden erfolgreich angemeldet.
        </p>
        <button onClick={handleContinue} style={{ padding: '10px 14px' }}>
          Weiter
        </button>
      </div>
    </RequireAuth>
  )
}


