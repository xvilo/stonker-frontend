import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useAccounts } from '../api/queries'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '◧', end: true },
  { to: '/transactions', label: 'Transactions', icon: '⇄' },
  { to: '/performance', label: 'Performance', icon: '↗' },
  { to: '/members', label: 'Members', icon: '◑' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export function Layout() {
  const { user, logout, selectedAccountId, setSelectedAccountId } = useAuth()
  const { data: accounts } = useAccounts()

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="dot" />
          Stonker
        </div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span aria-hidden style={{ width: 18, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <div className="nav-spacer" />
        <div className="faint" style={{ padding: '8px 12px', fontSize: '0.75rem' }}>
          Tracking natively — totals are shown per currency.
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="acct-switch">
            <span className="faint">Account</span>
            <select
              value={selectedAccountId ?? ''}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              {(accounts ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontWeight: 600 }}>{user?.name}</div>
              <div className="faint" style={{ fontSize: '0.78rem' }}>{user?.email}</div>
            </div>
            <button className="btn-ghost btn-sm" onClick={logout}>Sign out</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
