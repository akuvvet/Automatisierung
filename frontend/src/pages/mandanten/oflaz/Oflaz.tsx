import RequireAuth from '../../../components/RequireAuth'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Kontobuchung from '../../../components/mandanten/oflaz/Kontobuchung'
import TenantLayout from '../../../components/layout/TenantLayout'
import Konfig from '../../../components/tenant/Konfig'

export default function Oflaz() {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState<'welcome' | 'Kontobuchung' | 'Konfig'>('welcome')
  // eingeloggter Username
  let username: string | undefined
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    username = raw ? (JSON.parse(raw)?.username as string | undefined) : undefined
  } catch {
    username = undefined
  }
  // Log-Helfer
  async function logMenu(menuKey: string): Promise<void> {
    try {
      const token = localStorage.getItem('token') || ''
      await fetch('http://localhost:3000/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ menu: `/oflaz/${menuKey}` }),
      }).catch(() => {})
    } catch {
      // ignore
    }
  }

  function handleLogout(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  return (
    <RequireAuth>
      <TenantLayout
        title="Oflaz"
        menuItems={[
          { key: 'welcome', label: 'Willkommen' },
          { key: 'Kontobuchung', label: 'Kontobuchung' },
          { key: 'Konfig', label: 'Konfig' },
        ]}
        activeKey={activeMenu}
        onSelect={(k) => {
          const key = k as 'welcome' | 'Kontobuchung' | 'Konfig'
          setActiveMenu(key)
          void logMenu(key)
        }}
        onLogout={handleLogout}
      >
        <LogOnMount onLog={() => logMenu(activeMenu)} />
        {activeMenu === 'welcome' && (
          <section>
            <h1 style={{ marginBottom: 8 }}>Herzlich Willkommen, {username || 'Oflaz'}</h1>
            <p style={{ color: '#475569' }}>
              Für diesen Mandanten sind keine Module wie „TourenCalculator“ oder „Telematik“ freigeschaltet.
            </p>
          </section>
        )}
        {activeMenu === 'Kontobuchung' && (
          <section>
            <h1 style={{ marginBottom: 12 }}>Kontobuchung</h1>
            <Kontobuchung />
          </section>
        )}
        {activeMenu === 'Konfig' && (
          <section>
            <h1 style={{ marginBottom: 12 }}>Konfiguration</h1>
            <Konfig />
          </section>
        )}
      </TenantLayout>
    </RequireAuth>
  )
}

function LogOnMount({ onLog }: { onLog: () => void }) {
  useEffect(() => {
    onLog()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}


