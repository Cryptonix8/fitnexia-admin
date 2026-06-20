import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { IconEye, IconEyeOff } from '../components/icons'
import { api } from '../lib/api'
import { storeAuth } from '../lib/storage'
import type { AuthResponse } from '../lib/types'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const nextPath = useMemo(() => {
    const from = (location.state as { from?: string } | null)?.from
    return typeof from === 'string' && from.startsWith('/') ? from : '/metrics'
  }, [location.state])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post<AuthResponse>('/auth/login', { email, password })
      storeAuth({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
      })
      navigate(nextPath, { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: { message?: string }; message?: string } }
        message?: string
      }
      const msg =
        axiosErr.response?.data?.error?.message ||
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="loginShell">
      <div className="loginHero">
        <div className="loginHeroContent">
          <h1 className="loginHeroBrand">FITNEXIA</h1>
          <h2 className="loginHeroTitle">Manage your fitness marketplace</h2>
          <p className="loginHeroText">
            Verify profiles, moderate reviews, and manage users — all in one internal dashboard built
            for the Fitnexia team.
          </p>
        </div>
      </div>

      <div className="loginPanel">
        <div className="loginFormWrap">
          <div className="loginFormHeader">
            <div>
              <h2 className="loginFormTitle">Welcome back</h2>
              <p className="loginFormSub">Sign in with your admin credentials</p>
            </div>
            <ThemeToggle />
          </div>

          <form className="loginForm" onSubmit={onSubmit}>
            <label className="field">
              <span className="fieldLabel">Email address</span>
              <input
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@fitnexia.com"
                required
              />
            </label>

            <label className="field">
              <span className="fieldLabel">Password</span>
              <div className="inputWrap">
                <input
                  className="input inputWithToggle"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="inputToggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </label>

            {error ? <div className="alert alertError">{error}</div> : null}

            <div className="loginFormActions">
              <button className="btn btnPrimary" type="submit" disabled={loading} style={{ minWidth: 140 }}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
