import RequireAuth from '../../../components/RequireAuth'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import TenantLayout from '../../../components/layout/TenantLayout'
import XlsxToPdf from '../../../components/mandanten/klees/XlsxToPdf'
import Konfig from '../../../components/tenant/Konfig'

type MenuKey = 'welcome' | 'XLSX_to_PDF' | 'Konfig'

export default function Klees() {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState<MenuKey>('welcome')
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

  function handleSelect(k: string): void {
    setActiveMenu(k as MenuKey)
  }

  return (
    <RequireAuth>
      <TenantLayout
        title="Klees"
        menuItems={[
          { key: 'welcome', label: 'Willkommen' },
          { key: 'XLSX_to_PDF', label: 'XLSX_to_PDF' },
          { key: 'Konfig', label: 'Konfig' },
        ]}
        activeKey={activeMenu}
        onSelect={handleSelect}
        onLogout={handleLogout}
      >
        {activeMenu === 'welcome' && (
          <section>
            <h1 style={{ marginBottom: 8 }}>Herzlich Willkommen, {username || 'Klees'}</h1>
            <p style={{ color: '#475569' }}>
              Wähle links im Menü „XLSX_to_PDF“ zum Konvertieren von Excel-Dateien in PDFs oder „Logout“, um dich abzumelden.
            </p>
          </section>
        )}
        {activeMenu === 'Konfig' && (
          <section>
            <h1 style={{ marginBottom: 12 }}>Konfiguration</h1>
            <Konfig />
          </section>
        )}
        {activeMenu === 'XLSX_to_PDF' && (
          <section>
            <h1 style={{ marginBottom: 12 }}>XLSX_to_PDF</h1>
            <XlsxToPdf />
          </section>
        )}
      </TenantLayout>
    </RequireAuth>
  )
}



