import { createContext, use } from 'react'
import type { User } from '@/types/api.entities'

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

/**
 * Interfaz del contexto separada en state / actions:
 * los componentes no saben dónde vive el token ni cómo se valida.
 * El componente que la implementa es AuthProvider.tsx.
 */
export interface AuthContextValue {
  state: { status: AuthStatus; user: User | null }
  actions: {
    login: (email: string, password: string) => Promise<void>
    logout: () => void
  }
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
