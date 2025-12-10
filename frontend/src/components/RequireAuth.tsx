import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

export default function RequireAuth({ children }: PropsWithChildren) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const location = useLocation()

  function isJwtValid(t?: string | null): boolean {
    if (!t) return false
    const parts = t.split('.')
    if (parts.length < 2) return false
    try {
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(b64))
      if (typeof payload.exp === 'number') {
        const nowSec = Math.floor(Date.now() / 1000)
        return nowSec < payload.exp
      }
      return true
    } catch {
      return false
    }
  }

  if (!isJwtValid(token)) {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } catch { void 0 }
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  // Mandanten-Routenschutz: verhindert Zugriff auf fremde Tenant-Seiten
  const pathname = location.pathname || ''
  const rawUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  let tenantSlug: string | undefined
  try {
    tenantSlug = rawUser ? (JSON.parse(rawUser)?.tenant?.slug as string | undefined) : undefined
  } catch {
    tenantSlug = undefined
  }
  // Wenn eine Tenant-Route (/oguz, /oflaz, ...) aufgerufen wird, muss sie zum eigenen Tenant passen
  const tenantRouteMatch = pathname.match(/^\/([a-zA-Z0-9_-]+)/)
  const routeTenant = tenantRouteMatch?.[1]
  if (routeTenant && ['oguz', 'oflaz', 'klees'].includes(routeTenant)) {
    if (!tenantSlug || tenantSlug !== routeTenant) {
      return <Navigate to={`/${tenantSlug ?? ''}`} replace />
    }
  }
  return <>{children}</>
}


