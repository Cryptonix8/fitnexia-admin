import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { getAccessToken, getStoredUser } from '../lib/storage'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const token = getAccessToken()
  const user = getStoredUser()

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user.role !== 'admin') {
    return (
      <div className="loginPanel" style={{ minHeight: '100vh' }}>
        <div className="loginFormWrap">
          <h2 className="loginFormTitle">Access denied</h2>
          <p className="loginFormSub" style={{ marginBottom: 24 }}>
            This panel requires an account with the <strong>admin</strong> role.
          </p>
          <Link className="btn btnPrimary" to="/login">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
