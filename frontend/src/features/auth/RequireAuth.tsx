import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { paths } from '@/config/paths'
import { useAuth } from './auth-context'

/** Deja pasar solo con sesión; si no, manda al login recordando a dónde iba. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === 'checking') {
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-ink-muted" role="status">
        Validando sesión…
      </div>
    )
  }
  if (state.status === 'anonymous') {
    return <Navigate to={paths.login} replace state={{ from: location.pathname + location.search }} />
  }
  return children
}
