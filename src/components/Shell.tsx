import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import { IconChart, IconFlag, IconLogout, IconShield, IconUsers } from './icons'
import ThemeToggle from './ThemeToggle'
import { clearAuth, getStoredUser } from '../lib/storage'

const navItems = [
  { to: '/metrics', label: 'Overview', icon: IconChart },
  { to: '/users', label: 'Users', icon: IconUsers },
  { to: '/verification', label: 'Verification', icon: IconShield },
  { to: '/reviews/reported', label: 'Moderation', icon: IconFlag },
] as const

export default function Shell() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const initial = user?.email?.[0]?.toUpperCase() ?? 'A'

  return (
    <div className="shell">
      <aside className="sidebar">
        <BrandLogo subtitle="Internal panel" />

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
            <div className="userCard">
              <div className="userAvatar">{initial}</div>
              <div style={{ minWidth: 0 }}>
                <div className="userRole">Administrator</div>
                <div className="userEmail" title={user.email}>
                  {user.email}
                </div>
              </div>
            </div>
          ) : null}

          <ThemeToggle variant="sidebar" />

          <button
            className="btn btnGhost btnBlock"
            style={{ color: 'var(--sidebar-muted)', borderColor: 'var(--sidebar-border)' }}
            onClick={() => {
              clearAuth()
              navigate('/login')
            }}
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
