import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { UNAUTHORIZED_EVENT } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { tokenStorage } from '@/lib/token-storage'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'
import { authServices } from './auth.services'

/** Guarda el token, valida la sesión con /auth/me y expone login / logout. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(tokenStorage.get)

  // Con token guardado, se valida contra /auth/me al cargar la app.
  const me = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authServices.me,
    enabled: token !== null,
    staleTime: Infinity,
  })

  const logout = useCallback(() => {
    tokenStorage.clear()
    setToken(null)
    queryClient.clear()
  }, [queryClient])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authServices.login(email, password)
      tokenStorage.set(res.access_token)
      queryClient.setQueryData(queryKeys.auth.me(), res.user)
      setToken(res.access_token)
    },
    [queryClient],
  )

  // Cualquier 401 de la API (token vencido) cierra la sesión.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout)
  }, [logout])

  let status: AuthStatus = 'anonymous'
  if (token !== null) status = me.data ? 'authenticated' : me.isError ? 'anonymous' : 'checking'

  const value = useMemo<AuthContextValue>(
    () => ({ state: { status, user: me.data ?? null }, actions: { login, logout } }),
    [status, me.data, login, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
