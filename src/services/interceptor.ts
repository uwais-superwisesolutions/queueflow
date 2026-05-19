import axios from 'axios'

const ORG_TOKEN_KEY = 'token'
const CLIENT_TOKEN_KEY = 'client_token'

/**
 * Client routes use a per-tenant HS256 token (issued by /api/client/phone/confirm).
 * Org routes use the Supabase ES256 token (from /api/auth/login or /signup).
 * The OTP request/confirm endpoints are public — no token attached.
 */
function isPublicClientRoute(url: string) {
  return (
    url.startsWith('/api/client/phone/verify') ||
    url.startsWith('/api/client/phone/confirm')
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url: string = error.config?.url ?? ''
      if (isClientRoute(url)) {
        localStorage.removeItem(CLIENT_TOKEN_KEY)
        window.location.href = '/client'
      } else if (!isPublicClientRoute(url)) {
        localStorage.removeItem(ORG_TOKEN_KEY)
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
