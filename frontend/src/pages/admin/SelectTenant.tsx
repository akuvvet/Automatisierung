import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Tenant = { id: number; slug: string; name: string; redirectPath: string }

export default function SelectTenant() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('token') || ''
        const res = await fetch('/auth/tenants', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j?.error || 'Konnte Tenants nicht laden')
        }
        const j = await res.json()
        setTenants(j.tenants || [])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function gotoTenant(t: Tenant) {
    const path = t.redirectPath && t.redirectPath !== '/' ? t.redirectPath : `/${t.slug}`
    navigate(path, { replace: true })
  }

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', padding: 16 }}>
      <h1>Mandant auswählen</h1>
      {loading && <div>Laden…</div>}
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {!loading && !error && (
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr' }}>
          {tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => gotoTenant(t)}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#f9fafb',
              }}
            >
              <div style={{ fontWeight: 600 }}>{t.name}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{t.redirectPath || `/${t.slug}`}</div>
            </button>
          ))}
          {tenants.length === 0 && <div>Keine Mandanten gefunden.</div>}
        </div>
      )}
    </div>
  )
}


