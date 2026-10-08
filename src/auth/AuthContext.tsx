/* eslint-disable react-refresh/only-export-components -- provider and hook form one public context API */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useApi } from '../api/context'
import type { Session } from '../api/types'

const SESSION_KEY = 'syncspace.session.v1'

interface AuthContextValue {
  session: Session | null
  login: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readSession(): Session | null {
  const value = localStorage.getItem(SESSION_KEY)
  if (!value) return null
  try {
    return JSON.parse(value) as Session
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const api = useApi()
  const [session, setSession] = useState<Session | null>(readSession)

  const value = useMemo<AuthContextValue>(
    () => {
      const persistSession = (nextSession: Session) => {
        localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
        setSession(nextSession)
      }

      return {
        session,
        login: async (email, password) => {
          persistSession(await api.login(email, password))
        },
        signUp: async (email, password) => {
          await api.signUp(email, password)
          persistSession(await api.login(email, password))
        },
        logout: async () => {
          try {
            await api.logout()
          } catch {
            // Local sign-out still proceeds if the server session is already gone.
          }
          localStorage.removeItem(SESSION_KEY)
          setSession(null)
        },
      }
    },
    [api, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider.')
  return value
}
