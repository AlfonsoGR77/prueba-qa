import { Check, Circle, LoaderCircle, X, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import { Stamp } from '@/components/ui/Stamp'
import { paths } from '@/config/paths'
import { cn } from '@/lib/cn'
import { formatClockTime, formatDuration } from '@/lib/format'
import { narratorLabel } from '@/lib/labels'
import type { AnalysisStep, StepStatus } from '@/types/api.entities'
import { useAnalysis } from '../analysis-context'
import { useAnalysisRun } from '../analysis.queries'

const PIPELINE: Pick<AnalysisStep, 'key' | 'label'>[] = [
  { key: 'readings', label: 'Lecturas' },
  { key: 'baseline', label: 'Baseline' },
  { key: 'detection', label: 'Detección' },
  { key: 'correlation', label: 'Correlación' },
  { key: 'events', label: 'Eventos' },
  { key: 'explanation', label: 'Explicación' },
  { key: 'recommendation', label: 'Recomendación' },
]

const statusText: Record<StepStatus, string> = {
  PENDING: 'Pendiente',
  RUNNING: 'En curso',
  DONE: 'Hecho',
  FAILED: 'Falló',
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'DONE') return <Check aria-hidden className="size-4 text-form" strokeWidth={3} />
  if (status === 'RUNNING') return <LoaderCircle aria-hidden className="size-4 animate-spin text-form" />
  if (status === 'FAILED') return <XCircle aria-hidden className="size-4 text-critical" />
  return <Circle aria-hidden className="size-4 text-rule-strong" />
}

/**
 * Hoja de pasos del análisis: una fila numerada por paso del pipeline que se
 * va chequeando con el polling, y al final el total sellado.
 * No es un modal: queda debajo de la barra y el usuario puede seguir trabajando.
 */
export function AnalysisSheet() {
  const { state, actions } = useAnalysis()
  const { data: run, error } = useAnalysisRun(state.runId)

  if (!state.open) return null

  const steps = run?.steps ?? PIPELINE.map((s) => ({ ...s, status: 'PENDING' as const, detail: '' }))
  const doneCount = steps.filter((s) => s.status === 'DONE').length
  const failed = run?.status === 'FAILED' || state.error !== null || error !== null
  const completed = run?.status === 'COMPLETED'

  return (
    <section aria-labelledby="analysis-title" className="animate-sheet border-b border-rule bg-sheet">
      <div className="mx-auto max-w-[88rem] px-4 py-4 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="analysis-title" className="flex flex-wrap items-baseline gap-x-3 font-semibold">
              Análisis de IA
              <span className="data text-sm font-normal text-ink-muted">{run?.id ?? 'iniciando…'}</span>
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted" aria-live="polite">
              {run ? (
                <>
                  Iniciado {formatClockTime(run.started_at)} · Redacción: {narratorLabel(run.narrator)} ·{' '}
                  {completed ? `terminado en ${formatDuration(run.duration_ms)}` : `${doneCount} de ${steps.length} pasos`}
                </>
              ) : (
                'Enviando la orden al motor…'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={actions.close}
            className="inline-flex size-8 items-center justify-center text-ink-muted hover:bg-form-wash hover:text-form"
            aria-label="Cerrar la hoja del análisis"
          >
            <X aria-hidden className="size-4" />
          </button>
        </header>

        <ol className="mt-3 grid gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-7">
          {steps.map((step, i) => (
            <li
              key={step.key}
              className={cn('flex flex-col gap-1 bg-sheet px-3 py-2.5', step.status === 'DONE' && 'animate-tick')}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="form-label">
                  <span className="data">{i + 1}</span> · {step.label}
                </span>
                <StepIcon status={step.status} />
                <span className="sr-only">{statusText[step.status]}</span>
              </span>
              <span className="min-h-8 text-xs leading-4 text-ink-muted">{step.detail || '—'}</span>
            </li>
          ))}
        </ol>

        {completed && run.summary ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2" role="status">
            <Stamp tone={run.summary.requiring_attention > 0 ? 'critical' : 'neutral'} size="md">
              {run.summary.anomalies_detected} anomalías · {run.summary.requiring_attention} prioritarias
            </Stamp>
            <p className="text-sm">
              {run.summary.anomalies_detected} anomalías detectadas · {run.summary.requiring_attention} requieren atención
              prioritaria.
            </p>
            <Link to={paths.anomalies} onClick={actions.close} className="text-sm font-semibold text-form underline">
              Ver órdenes
            </Link>
          </div>
        ) : null}

        {failed ? (
          <p role="alert" className="mt-3 text-sm text-critical">
            El análisis no terminó: {run?.error ?? state.error ?? 'no hubo respuesta del servidor'}. Vuelve a intentarlo.
          </p>
        ) : null}
      </div>
    </section>
  )
}
