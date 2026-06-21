import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, refreshSession, setAccessToken } from '../api/client'
import type { User } from '../api/types'

type Status = 'loading' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  status: Status
  user: User | null
  selectedAccountId: string | null
  setSelectedAccountId: (id: string) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const ACCOUNT_KEY = 'stonker.accountId'

async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>('/me')
  return data
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [selectedAccountId, setSelected] = useState<string | null>(
    () => localStorage.getItem(ACCOUNT_KEY),
  )

  const applyUser = useCallback((u: User) => {
    setUser(u)
    setStatus('authenticated')
    setSelected((current) => {
      const ids = u.memberships.map((m) => m.account?.id).filter(Boolean) as string[]
      if (current && ids.includes(current)) return current
      const next = ids[0] ?? null
      if (next) localStorage.setItem(ACCOUNT_KEY, next)
      return next
    })
  }, [])

  // Bootstrap: a valid refresh cookie restores the session on reload.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const token = await refreshSession()
      if (cancelled) return
      if (!token) {
        setStatus('anonymous')
        return
      }
      try {
        applyUser(await fetchMe())
      } catch {
        if (!cancelled) setStatus('anonymous')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [applyUser])

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{ token: string }>('/login_check', { email, password })
      setAccessToken(data.token)
      applyUser(await fetchMe())
    },
    [applyUser],
  )

  const register = useCallback(
    async (email: string, name: string, password: string) => {
      await api.post('/register', { email, name, plainPassword: password })
      await login(email, password)
    },
    [login],
  )

  const logout = useCallback(() => {
    setAccessToken(null)
    setUser(null)
    setStatus('anonymous')
    queryClient.clear()
  }, [queryClient])

  const setSelectedAccountId = useCallback((id: string) => {
    localStorage.setItem(ACCOUNT_KEY, id)
    setSelected(id)
  }, [])

  const refreshUser = useCallback(async () => {
    applyUser(await fetchMe())
  }, [applyUser])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, selectedAccountId, setSelectedAccountId, login, register, logout, refreshUser }),
    [status, user, selectedAccountId, setSelectedAccountId, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
