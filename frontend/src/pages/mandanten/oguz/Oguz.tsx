import RequireAuth from '../../../components/RequireAuth'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import TourenCalculator from '../../../components/mandanten/oguz/TourenCalculator'
import Telematik from '../../../components/mandanten/oguz/Telematik'
import Rentenbefreiung from '../../../components/mandanten/oguz/Rentenbefreiung'
import TenantLayout from '../../../components/layout/TenantLayout'

export default function Oguz() {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState<'welcome' | 'TourenCalculator' | 'Telematik' | 'Rentenbefreiung'>('welcome')

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
        ]}
        activeKey={activeMenu}
        onSelect={(k) => setActiveMenu(k as 'welcome' | 'TourenCalculator' | 'Telematik' | 'Rentenbefreiung')}
        onLogout={handleLogout}
      >
        {activeMenu === 'welcome' && (
          <section>
            <h1 style={{ marginBottom: 8 }}>Herzlich Willkommen, Oguz</h1>
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
      </TenantLayout>
    </RequireAuth>
  )
}


