import { formatClockTime } from '@/lib/format'
import { useLatestAnalysis } from '../analysis.queries'

const statusText = { RUNNING: 'en curso', COMPLETED: 'completado', FAILED: 'falló' } as const

/** Último análisis en la barra de despacho: "AN-0003 · completado · 24 sept 12:29:11". */
export function LastAnalysisStatus() {
  const { data } = useLatestAnalysis()
  if (!data) return null

  const at = data.finished_at ?? data.started_at
  return (
    <p className="hidden text-right text-xs leading-4 text-ink-muted xl:block" aria-live="polite">
      <span className="form-label block">Último análisis</span>
      <span className="data text-ink">{data.id}</span> · {statusText[data.status]} · {formatClockTime(at)}
    </p>
  )
}
