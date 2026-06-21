const ACCESS_TOKEN_KEY = 'fitnexia_admin_access_token'
const REFRESH_TOKEN_KEY = 'fitnexia_admin_refresh_token'
const USER_KEY = 'fitnexia_admin_user'

export type StoredUser = { id: string; email: string; role: string }

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function updateStoredUser(partial: Partial<StoredUser>) {
  const user = getStoredUser()
  if (!user) return
  localStorage.setItem(USER_KEY, JSON.stringify({ ...user, ...partial }))
  window.dispatchEvent(new CustomEvent('fitnexia-admin-user-updated'))
}

export function storeAuth(params: {
  accessToken: string
  refreshToken: string
  user: StoredUser
}) {
  localStorage.setItem(ACCESS_TOKEN_KEY, params.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, params.refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(params.user))
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

