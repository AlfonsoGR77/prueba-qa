import { Outlet } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { AnalysisProvider } from '@/features/analysis/AnalysisProvider'
import { AnalysisSheet } from '@/features/analysis/components/AnalysisSheet'
import { LastAnalysisStatus } from '@/features/analysis/components/LastAnalysisStatus'
import { RunAnalysisButton } from '@/features/analysis/components/RunAnalysisButton'
import { useAuth } from '@/features/auth/auth-context'
import { RequireAuth } from '@/features/auth/RequireAuth'

/** Layout de las rutas con sesión: aquí se juntan el shell, la sesión y el análisis. */
export function AppLayout() {
  return (
    <RequireAuth>
      <AnalysisProvider>
        <ShellWithUser />
      </AnalysisProvider>
    </RequireAuth>
  )
}

function ShellWithUser() {
  const { state, actions } = useAuth()
  return (
    <AppShell
      action={
        <>
          <LastAnalysisStatus />
          <RunAnalysisButton />
        </>
      }
      panel={<AnalysisSheet />}
      userName={state.user?.name ?? ''}
      onLogout={actions.logout}
    >
      <Outlet />
    </AppShell>
  )
}
