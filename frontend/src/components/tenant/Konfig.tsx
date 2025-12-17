import { useState } from 'react'

export default function Konfig() {
  // Passwort ändern
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [pwMsg, setPwMsg] = useState<string | null>(null)
  const [pwBusy, setPwBusy] = useState(false)

  async function changePassword(): Promise<void> {
    setPwMsg(null)
    if (newPw !== newPw2) {
      setPwMsg('Neues Passwort stimmt nicht überein.')
      return
    }
    setPwBusy(true)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch('/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Fehler beim Ändern')
      setPwMsg('Passwort wurde geändert.')
      setCurPw('')
      setNewPw('')
      setNewPw2('')
    } catch (e: unknown) {
      setPwMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setPwBusy(false)
    }
  }

  // Nutzer anlegen
  const [nuUsername, setNuUsername] = useState('')
  const [nuEmail, setNuEmail] = useState('')
  const [nuPw, setNuPw] = useState('')
  const [nuMsg, setNuMsg] = useState<string | null>(null)
  const [nuBusy, setNuBusy] = useState(false)

  async function createUser(): Promise<void> {
    setNuMsg(null)
    setNuBusy(true)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch('/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          username: nuUsername,
          email: nuEmail,
          password: nuPw,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Fehler beim Anlegen')
      setNuMsg(`Benutzer ${j.user?.username || ''} angelegt.`.trim())
      setNuUsername('')
      setNuEmail('')
      setNuPw('')
    } catch (e: unknown) {
      setNuMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setNuBusy(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 24, maxWidth: 640 }}>
      <section>
        <h2 style={{ margin: '0 0 8px 0' }}>Passwort ändern</h2>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr' }}>
          <input type="password" placeholder="Altes Passwort" value={curPw} onChange={(e) => setCurPw(e.target.value)} style={{ padding: 8 }} />
          <input type="password" placeholder="Neues Passwort" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={{ padding: 8 }} />
          <input type="password" placeholder="Neues Passwort wiederholen" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} style={{ padding: 8 }} />
          <div>
            <button onClick={() => void changePassword()} disabled={pwBusy || !curPw || !newPw || !newPw2} style={{ padding: '8px 12px' }}>
              {pwBusy ? 'Bitte warten…' : 'Passwort ändern'}
            </button>
          </div>
          {pwMsg && <div style={{ color: pwMsg.includes('geändert') ? '#16a34a' : '#ef4444' }}>{pwMsg}</div>}
        </div>
      </section>

      <section>
        <h2 style={{ margin: '0 0 8px 0' }}>Benutzer anlegen</h2>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr' }}>
          <input type="text" placeholder="Benutzername" value={nuUsername} onChange={(e) => setNuUsername(e.target.value)} style={{ padding: 8 }} />
          <input type="email" placeholder="E-Mail" value={nuEmail} onChange={(e) => setNuEmail(e.target.value)} style={{ padding: 8 }} />
          <input type="password" placeholder="Passwort" value={nuPw} onChange={(e) => setNuPw(e.target.value)} style={{ padding: 8 }} />
          <div>
            <button onClick={() => void createUser()} disabled={nuBusy || !nuUsername || !nuEmail || !nuPw} style={{ padding: '8px 12px' }}>
              {nuBusy ? 'Bitte warten…' : 'Benutzer anlegen'}
            </button>
          </div>
          {nuMsg && <div style={{ color: nuMsg.startsWith('Benutzer') ? '#16a34a' : '#ef4444' }}>{nuMsg}</div>}
        </div>
      </section>
    </div>
  )
}


