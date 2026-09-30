import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ApiError } from '@/lib/api-client'
import { AnalysisContext, type AnalysisContextValue } from './analysis-context'
import { useStartAnalysis } from './analysis.queries'

/** Guarda qué análisis se está siguiendo y si la hoja de pasos está abierta. */
export function AnalysisProvider({ children }: { children: ReactNode }) {
  const start = useStartAnalysis()
  const [runId, setRunId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const run = useCallback(() => {
    setOpen(true)
    start.mutate(undefined, { onSuccess: (r) => setRunId(r.id) })
  }, [start])

  const close = useCallback(() => setOpen(false), [])

  const error = start.error ? ApiError.from(start.error).message : null

  const value = useMemo<AnalysisContextValue>(
    () => ({ state: { runId, open, starting: start.isPending, error }, actions: { run, close } }),
    [runId, open, start.isPending, error, run, close],
  )

  return <AnalysisContext value={value}>{children}</AnalysisContext>
}
