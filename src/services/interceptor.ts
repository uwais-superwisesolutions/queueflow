import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { refreshSession } from './authApi'

const ORG_TOKEN_KEY = 'token'
const ORG_REFRESH_TOKEN_KEY = 'refresh_token'
const CLIENT_TOKEN_KEY = 'client_token'

/**
 * Client routes use a per-tenant HS256 token (issued by /api/client/phone/confirm).
 * Org routes use the Supabase ES256 token (from /api/auth/login or /signup).
 * The OTP request/confirm endpoints + portal-link scan are public — no token attached.
 */
function isPublicClientRoute(url: string) {
  return (
    url.startsWith('/api/client/phone/verify') ||
    url.startsWith('/api/client/phone/confirm') ||
    /^\/api\/client\/portal-links\/[^/]+\/scan$/.test(url) ||
    /^\/api\/client\/orgs\/[^/]+$/.test(url)
  )
}

function isClientRoute(url: string) {
  return url.startsWith('/api/client/') && !isPublicClientRoute(url)
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const url = config.url ?? ''
  if (isPublicClientRoute(url)) return config

  const tokenKey = isClientRoute(url) ? CLIENT_TOKEN_KEY : ORG_TOKEN_KEY
  const token = localStorage.getItem(tokenKey)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─────────────────────────────────────────────────
// Refresh-token coordination
// ─────────────────────────────────────────────────
// Only ONE refresh can be in flight at a time; concurrent 401s queue on the
// same promise so we don't fire N refresh requests in parallel.
let inFlightRefresh: Promise<string | null> | null = null

async function tryRefreshOrgToken(): Promise<string | null> {
  if (inFlightRefresh) return inFlightRefresh

  const stored = localStorage.getItem(ORG_REFRESH_TOKEN_KEY)
  if (!stored) return null

  inFlightRefresh = (async () => {
    try {
      const resp = await refreshSession({ refreshToken: stored })
      localStorage.setItem(ORG_TOKEN_KEY, resp.data.accessToken)
      if (resp.data.refreshToken) {
        localStorage.setItem(ORG_REFRESH_TOKEN_KEY, resp.data.refreshToken)
      }
      return resp.data.accessToken
    } catch {
      return null
    } finally {
      inFlightRefresh = null
    }
  })()

  return inFlightRefresh
}

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status
    const original = error.config as RetryableConfig | undefined
    const url: string = original?.url ?? ''

    if (status !== 401 || !original) {
      return Promise.reject(error)
    }

    // Public routes shouldn't ever 401 — bail out cleanly without redirecting.
    if (isPublicClientRoute(url)) {
      return Promise.reject(error)
    }

    // Client routes can't refresh (different token scheme) — kick to /client.
    if (isClientRoute(url)) {
      localStorage.removeItem(CLIENT_TOKEN_KEY)
      window.location.href = '/client'
      return Promise.reject(error)
    }

    // Org-member route. Try one refresh + retry. If we're already on a retry,
    // don't loop — clear state and bounce to /login.
    if (original._retried) {
      localStorage.removeItem(ORG_TOKEN_KEY)
      localStorage.removeItem(ORG_REFRESH_TOKEN_KEY)
      window.location.href = '/login'
      return Promise.reject(error)
    }

    const fresh = await tryRefreshOrgToken()
    if (!fresh) {
      localStorage.removeItem(ORG_TOKEN_KEY)
      localStorage.removeItem(ORG_REFRESH_TOKEN_KEY)
      window.location.href = '/login'
      return Promise.reject(error)
    }

    original._retried = true
    original.headers = original.headers ?? new axios.AxiosHeaders()
    original.headers.set?.('Authorization', `Bearer ${fresh}`)
    return api(original)
  }
)

export default api
