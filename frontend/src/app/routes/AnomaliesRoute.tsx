import { PageHeader } from '@/components/layout/PageHeader'
import { ErrorState, Skeleton } from '@/components/ui/feedback'
import { AnomalyTable } from '@/features/anomalies/components/AnomalyTable'
import { useAnomalies } from '@/features/anomalies/anomalies.queries'
import { ApiError } from '@/lib/api-client'
import { anomalyTypeHint, anomalyTypeLabel } from '@/lib/labels'
import type { AnomalyType } from '@/types/api.entities'

const TYPES: AnomalyType[] = ['REAL_ANOMALY', 'DATA_QUALITY', 'EXPLAINABLE_ANOMALY', 'FALSE_POSITIVE']

/** Anomalías IA: la lista de órdenes en orden de prioridad. */
export function AnomaliesRoute() {
  const { data, isPending, isError, error, refetch } = useAnomalies()
  const attention = data?.filter((a) => a.severity === 'HIGH').length ?? 0

  return (
    <>
      <PageHeader
        title="Anomalías IA"
        description={
          data
            ? `${data.length} anomalías detectadas · ${attention} requieren atención prioritaria. Abre una para ver qué encontró la IA, la evidencia y la acción.`
            : 'Cargando las órdenes…'
        }
      />

      {isError ? (
        <ErrorState message={ApiError.from(error).message} onRetry={() => void refetch()} />
      ) : isPending ? (
        <Skeleton className="h-72" />
      ) : (
        <AnomalyTable anomalies={data} />
      )}

      <section aria-labelledby="types-title" className="mt-8">
        <h2 id="types-title" className="mb-3 text-lg font-bold tracking-[-0.01em]">
          Cómo clasifica el motor
        </h2>
        <dl className="grid gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {TYPES.map((t) => (
            <div key={t} className="bg-sheet px-4 py-3">
              <dt className="text-sm font-semibold">{anomalyTypeLabel[t]}</dt>
              <dd className="mt-1 text-sm text-ink-muted">{anomalyTypeHint[t]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}
