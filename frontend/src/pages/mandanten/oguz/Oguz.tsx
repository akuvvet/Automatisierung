import RequireAuth from '../../../components/RequireAuth'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import TourenCalculator from '../../../components/mandanten/oguz/TourenCalculator'
import Telematik from '../../../components/mandanten/oguz/Telematik'
import Rentenbefreiung from '../../../components/mandanten/oguz/Rentenbefreiung'
import TenantLayout from '../../../components/layout/TenantLayout'
import Konfig from '../../../components/tenant/Konfig'

export default function Oguz() {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState<'welcome' | 'TourenCalculator' | 'Telematik' | 'Rentenbefreiung' | 'Konfig'>('welcome')
  // eingeloggter Username
  let username: string | undefined
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    username = raw ? (JSON.parse(raw)?.username as string | undefined) : undefined
  } catch {
    username = undefined
  }

  function handleLogout(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  return (
    <RequireAuth>
      <TenantLayout
        title="Oguz"
        menuItems={[
          { key: 'welcome', label: 'Willkommen' },
          { key: 'TourenCalculator', label: 'TourenCalculator' },
          { key: 'Telematik', label: 'Telematik' },
          { key: 'Rentenbefreiung', label: 'Rentenbefreiung' },
          { key: 'Konfig', label: 'Konfig' },
        ]}
        activeKey={activeMenu}
        onSelect={(k) => setActiveMenu(k as 'welcome' | 'TourenCalculator' | 'Telematik' | 'Rentenbefreiung')}
        onLogout={handleLogout}
      >
        {activeMenu === 'welcome' && (
          <section>
            <h1 style={{ marginBottom: 8 }}>Herzlich Willkommen, {username || 'Oguz'}</h1>
            <p style={{ color: '#475569' }}>
              Wähle links im Menü ein Modul wie „TourenCalculator“ oder „Telematik“ aus, um zu starten.
            </p>
          </section>
        )}
        {activeMenu === 'TourenCalculator' && (
          <section>
            <h1 style={{ marginBottom: 16 }}>TourenCalculator</h1>
            <TourenCalculator />
          </section>
        )}
        {activeMenu === 'Telematik' && (
          <section>
            <h1 style={{ marginBottom: 16 }}>Telematik</h1>
            <Telematik />
          </section>
        )}
        {activeMenu === 'Rentenbefreiung' && (
          <section>
            <h1 style={{ marginBottom: 16 }}>Rentenbefreiung</h1>
            <Rentenbefreiung />
          </section>
        )}
        {activeMenu === 'Konfig' && (
          <section>
            <h1 style={{ marginBottom: 16 }}>Konfiguration</h1>
            <Konfig />
          </section>
        )}
      </TenantLayout>
    </RequireAuth>
  )
}


