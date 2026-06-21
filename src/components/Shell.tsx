import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LoadingOverlay from './LoadingOverlay'
import { IconChart, IconLogout, IconShield, IconUsers } from './icons'
import ThemeToggle from './ThemeToggle'
import { api } from '../lib/api'
import { clearAuth, getRefreshToken, getStoredUser } from '../lib/storage'

const navItems = [
  { to: '/metrics', label: 'Overview', icon: IconChart },
  { to: '/users', label: 'Users', icon: IconUsers },
  { to: '/verification', label: 'Verification', icon: IconShield },
] as const

export default function Shell() {
  const navigate = useNavigate()
  const [user, setUser] = useState(getStoredUser)
  const [signingOut, setSigningOut] = useState(false)
  const initial = user?.email?.[0]?.toUpperCase() ?? 'A'

  useEffect(() => {
    const sync = () => setUser(getStoredUser())
    window.addEventListener('fitnexia-admin-user-updated', sync)
    return () => window.removeEventListener('fitnexia-admin-user-updated', sync)
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => undefined)
      }
    } finally {
      clearAuth()
      setSigningOut(false)
      navigate('/login')
    }
  }

  return (
    <div className="shell">
      <LoadingOverlay show={signingOut} label="Signing out…" />
      <aside className="sidebar">
        <div className="sidebarBrand">
          <h3>FITNEXIA ADMIN</h3>
          <p>Internal panel</p>
        </div>
        <div className="navSection">Menu</div>
        <nav className="nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `navLink${isActive ? ' active' : ''}`}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebarFooter">
          {user ? (
            <button
              type="button"
              className="userCard userCardButton"
              onClick={() => navigate('/profile')}
            >
              <div className="userAvatar">{initial}</div>
              <div style={{ minWidth: 0 }}>
                <div className="userRole">Administrator</div>
                <div className="userEmail" title={user.email}>
                  {user.email}
                </div>
              </div>
            </button>
          ) : null}

          <ThemeToggle variant="sidebar" />

          <button
            className="btn btnGhost btnBlock"
            style={{ color: 'var(--sidebar-muted)', borderColor: 'var(--sidebar-border)' }}
            disabled={signingOut}
            onClick={handleSignOut}
          >
            <IconLogout />
            Sign out
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
