import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  let isAdmin = false
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const user = raw ? JSON.parse(raw) : null
    isAdmin = user?.role === 'admin'
  } catch {
    isAdmin = false
  }

  function handleLogout(): void {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } catch { /* noop */ }
    navigate('/login', { replace: true })
  }

  if (isAdmin) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside
          style={{
            width: 240,
            background: '#0f172a',
            color: 'white',
            padding: 16,
            position: 'sticky',
            top: 0,
            alignSelf: 'flex-start',
            minHeight: '100vh',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Admin</div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              background: '#ef4444',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </aside>
        <main style={{ flex: 1, padding: 24 }}>
          <h1>Herzlich Willkommen</h1>
          <p>Du bist als Admin eingeloggt.</p>
        </main>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '80px auto', padding: 16 }}>
      <h1>Herzlich Willkommen</h1>
      <p>Du bist eingeloggt.</p>
    </div>
  )
}


