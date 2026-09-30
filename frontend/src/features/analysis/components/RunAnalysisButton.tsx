import { Play } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAnalysis } from '../analysis-context'
import { useAnalysisRun } from '../analysis.queries'

/** Botón principal de la app. Se deshabilita mientras hay un análisis corriendo. */
export function RunAnalysisButton() {
  const { state, actions } = useAnalysis()
  const run = useAnalysisRun(state.runId)
  const busy = state.starting || run.data?.status === 'RUNNING'

  return (
    <Button variant="primary" onClick={actions.run} disabled={busy} aria-describedby="run-analysis-hint">
      <Play aria-hidden className="size-4 fill-current" />
      {busy ? 'Analizando…' : 'Run AI Analysis'}
      <span id="run-analysis-hint" className="sr-only">
        Corre el motor sobre las 4.032 lecturas y redacta explicaciones y acciones.
      </span>
    </Button>
  )
}
