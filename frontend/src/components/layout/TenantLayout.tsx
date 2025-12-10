import type { PropsWithChildren, ReactNode } from 'react'

type MenuItem = {
  key: string
  label: string
}

type TenantLayoutProps = PropsWithChildren<{
  title?: string
  menuItems: MenuItem[]
  activeKey: string
  onSelect: (key: string) => void
  onLogout?: () => void
  footer?: ReactNode
}>

const SIDEBAR_WIDTH_PX = 280

export default function TenantLayout({
  title,
  menuItems,
  activeKey,
  onSelect,
  onLogout,
  footer,
  children,
}: TenantLayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <aside
        style={{
          width: SIDEBAR_WIDTH_PX,
          background: '#0f172a',
          color: 'white',
          padding: 16,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
      >
        {title ? (
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{title}</div>
        ) : null}
        <nav>
          {menuItems.map((item, index) => {
            const isActive = item.key === activeKey
            return (
              <div
                key={item.key}
                role="button"
                onClick={() => onSelect(item.key)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: isActive ? '#1e293b' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  userSelect: 'none',
                  marginBottom: index === menuItems.length - 1 ? 16 : 8,
                }}
              >
                {item.label}
              </div>
            )
          })}
          {onLogout ? (
            <button
              onClick={onLogout}
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
          ) : null}
        </nav>
        {footer ? <div style={{ marginTop: 16 }}>{footer}</div> : null}
      </aside>
      <main style={{ flex: 1, padding: 24, boxSizing: 'border-box' }}>{children}</main>
    </div>
  )
}


