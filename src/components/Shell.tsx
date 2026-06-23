import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LoadingOverlay from './LoadingOverlay'
import { IconChart, IconChevronLeft, IconLogout, IconShield, IconUsers } from './icons'
import ThemeToggle from './ThemeToggle'
import { api } from '../lib/api'
import { clearAuth, getRefreshToken, getStoredUser } from '../lib/storage'

const SIDEBAR_COLLAPSED_KEY = 'fitnexia_admin_sidebar_collapsed'

const navItems = [
  { to: '/metrics', label: 'Overview', icon: IconChart },
  { to: '/users', label: 'Users', icon: IconUsers },
  { to: '/institutions', label: 'Institutions', icon: IconShield },
  { to: '/verification', label: 'Verification', icon: IconShield },
] as const

export default function Shell() {
  const navigate = useNavigate()
  const [user, setUser] = useState(getStoredUser)
  const [signingOut, setSigningOut] = useState(false)
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true',
  )
  const initial = user?.email?.[0]?.toUpperCase() ?? 'A'

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      return next
    })
  }

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
    <div className={`shell${collapsed ? ' shellCollapsed' : ''}`}>
      <LoadingOverlay show={signingOut} label="Signing out…" />
      <aside className={`sidebar${collapsed ? ' sidebarCollapsed' : ''}`}>
        <div className="sidebarHeader">
          <div className="sidebarBrand">
            <h3>{collapsed ? 'FN' : 'FITNEXIA ADMIN'}</h3>
            {!collapsed ? <p>Internal panel</p> : null}
          </div>
          <button
            type="button"
            className="sidebarCollapseBtn"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <IconChevronLeft className={collapsed ? 'sidebarCollapseIconFlipped' : undefined} />
          </button>
        </div>

        {!collapsed ? <div className="navSection">Menu</div> : null}
        <nav className="nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `navLink${isActive ? ' active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon />
              <span className="sidebarLabel">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebarFooter">
          {user ? (
            <button
              type="button"
              className="userCard userCardButton"
              onClick={() => navigate('/profile')}
              title={collapsed ? user.email : undefined}
            >
              <div className="userAvatar">{initial}</div>
              {!collapsed ? (
                <div className="sidebarLabel userCardText" style={{ minWidth: 0 }}>
                  <div className="userRole">Administrator</div>
                  <div className="userEmail" title={user.email}>
                    {user.email}
                  </div>
                </div>
              ) : null}
            </button>
          ) : null}

          <ThemeToggle variant="sidebar" collapsed={collapsed} />

          <button
            className="btn btnGhost btnBlock sidebarSignOutBtn"
            style={{ color: 'var(--sidebar-muted)', borderColor: 'var(--sidebar-border)' }}
            disabled={signingOut}
            title={collapsed ? 'Sign out' : undefined}
            onClick={handleSignOut}
          >
            <IconLogout />
            <span className="sidebarLabel">Sign out</span>
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
