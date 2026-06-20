import axios from 'axios'
import { clearAuth, getAccessToken, getRefreshToken, storeAuth } from './storage'

const baseURL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/v1'

export const api = axios.create({
  baseURL,
  timeout: 30_000,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing: Promise<void> | null = null

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status
    const original = err?.config

    if (status !== 401 || !original || original.__isRetryRequest) {
      throw err
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearAuth()
      throw err
    }

    original.__isRetryRequest = true

    if (!refreshing) {
      refreshing = (async () => {
        try {
          const res = await axios.post(
            `${baseURL.replace(/\/$/, '')}/auth/refresh`,
            { refreshToken },
            { timeout: 30_000 },
          )
          storeAuth({
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
            user: res.data.user,
          })
        } catch {
          clearAuth()
        } finally {
          refreshing = null
        }
      })()
    }

    await refreshing

    const nextToken = getAccessToken()
    if (!nextToken) throw err
    original.headers = original.headers ?? {}
    original.headers.Authorization = `Bearer ${nextToken}`
    return api.request(original)
  },
)

