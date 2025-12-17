import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error ?? 'Login fehlgeschlagen')
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      try {
        localStorage.setItem('user', JSON.stringify(data.user))
      } catch {
        // ignore storage failures
      }
      // Admin zur Auswahlseite, sonst Standard-Redirect
      if (data?.user?.role === 'admin') {
        navigate('/admin/select', { replace: true })
      } else {
        navigate(data.redirectPath || '/', { replace: true })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', padding: 16 }}>
      <h1>Login</h1>
      <form onSubmit={onSubmit} autoComplete="off">
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            name="no-username"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="email"
            placeholder="E-Mail eingeben"
            style={{ width: '100%', padding: 8 }}
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Passwort</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            name="no-password"
            autoComplete="new-password"
            placeholder="Passwort"
            style={{ width: '100%', padding: 8 }}
            required
          />
        </div>
        {error && (
          <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>
        )}
        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? 'Bitte warten…' : 'Einloggen'}
        </button>
      </form>
    </div>
  )
}


