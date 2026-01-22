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

  // Aktuellen Pfad früh lesen, um Login-Sonderfall handhaben zu können
  const pathname = location.pathname || ''

  if (!isJwtValid(token)) {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } catch { void 0 }
    // Verhindere Weiterleitungs-/Reload-Schleifen: Wenn wir bereits auf /login sind,
    // rendere die Kinder (z. B. die Login-Seite) ohne erneute Navigation.
    if (pathname === '/login' || pathname.startsWith('/login')) {
      return <>{children}</>
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  // Mandanten-Routenschutz: verhindert Zugriff auf fremde Tenant-Seiten
  const rawUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  let tenantSlug: string | undefined
  let role: string | undefined
  try {
    const u = rawUser ? JSON.parse(rawUser) : null
    tenantSlug = u?.tenant?.slug as string | undefined
    role = u?.role as string | undefined
  } catch {
    tenantSlug = undefined
    role = undefined
  }
  // Wenn eine Tenant-Route (/oguz, /oflaz, ...) aufgerufen wird, muss sie zum eigenen Tenant passen
  const tenantRouteMatch = pathname.match(/^\/([a-zA-Z0-9_-]+)/)
  const routeTenant = tenantRouteMatch?.[1]
  if (routeTenant && ['oguz', 'oflaz', 'klees'].includes(routeTenant) && role !== 'admin') {
    if (!tenantSlug || tenantSlug !== routeTenant) {
      return <Navigate to={`/${tenantSlug ?? ''}`} replace />
    }
  }
  return <>{children}</>
}


