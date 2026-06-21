import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'

// The access (JWT) token lives only in memory — never localStorage — so it
// cannot be read by injected scripts. The refresh token rides in an httpOnly
// cookie the browser sends automatically to /api/token/refresh.
let accessToken: string | null = null
const subscribers = new Set<(token: string | null) => void>()

export function setAccessToken(token: string | null): void {
  accessToken = token
  subscribers.forEach((fn) => fn(token))
}

export function getAccessToken(): string | null {
  return accessToken
}

export function onAccessTokenChange(fn: (token: string | null) => void): () => void {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

export const api: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

// On a 401, try the refresh-token cookie exactly once, then replay the request.
let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ token: string }>(
      '/api/token/refresh',
      {},
      { withCredentials: true, headers: { Accept: 'application/json' } },
    )
    setAccessToken(data.token)
    return data.token
  } catch {
    setAccessToken(null)
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
    const url = original?.url ?? ''
    const isAuthCall = url.includes('/token/refresh') || url.includes('/login_check')

    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null
      })
      const token = await refreshing
      if (token) {
        original.headers.set('Authorization', `Bearer ${token}`)
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)

export async function refreshSession(): Promise<string | null> {
  return refreshAccessToken()
}

/** Extract a human-readable message from an API error response. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  const e = error as AxiosError<Record<string, unknown>>
  const data = e?.response?.data
  if (data) {
    const msg = (data['detail'] ?? data['message'] ?? data['hydra:description']) as string | undefined
    if (msg) return msg
  }
  return e?.message ?? fallback
}
