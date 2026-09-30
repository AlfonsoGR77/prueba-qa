import { useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { ErrorState, Skeleton } from '@/components/ui/feedback'
import { Sheet } from '@/components/ui/Sheet'
import { paths } from '@/config/paths'
import { KpiPanel } from '@/features/dashboard/components/KpiPanel'
import { CompactOrder, LeadOrder } from '@/features/dashboard/components/OrderTicket'
import { useDashboardSummary } from '@/features/dashboard/dashboard.queries'
import { MeterLedger } from '@/features/meters/components/MeterLedger'
import { useMeterList } from '@/features/meters/meters.queries'
import { ApiError } from '@/lib/api-client'
import { formatPlantDate } from '@/lib/format'
import type { MeterPagedRequest } from '@/types/api.entities'

/** Los medidores que más importan primero: severidad de mayor a menor. */
const LEDGER_REQUEST: MeterPagedRequest = {
  pagination: { page: 1, size: 12 },
  filter: { sort_by: 'severity', sort_order: 'DESC' },
}

/**
 * Despacho: la primera pantalla. Arriba a la izquierda, las órdenes que la IA
 * emitió (la prioridad 1 a doble escala); a la derecha, el estado de la planta;
 * abajo, el libro de medidores.
 */
export function DashboardRoute() {
  const summary = useDashboardSummary()
  const ledger = useMeterList(LEDGER_REQUEST)

  const [lead, ...rest] = summary.data?.priorities ?? []
  const pending = useMemo(() => summary.data?.priorities.filter((p) => p.anomaly).length ?? 0, [summary.data])

  if (summary.isError) {
    return <ErrorState message={ApiError.from(summary.error).message} onRetry={() => void summary.refetch()} />
  }

  const range = summary.data?.data_range

  return (
    <>
      <PageHeader
        title="Despacho"
        description={
          range ? (
            <>
              Lecturas del {formatPlantDate(range.from)} al {formatPlantDate(range.to)} · hora de planta.{' '}
              {pending > 0
                ? `${pending} órdenes abiertas, ordenadas por prioridad.`
                : 'No hay órdenes abiertas.'}
            </>
          ) : (
            'Cargando el estado de la planta…'
          )
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <section aria-labelledby="orders-title" className="flex min-w-0 flex-col gap-3">
          <h2 id="orders-title" className="sr-only">
            Órdenes emitidas por la IA
          </h2>
          {summary.isPending ? (
            <>
              <Skeleton className="h-80" />
              <div className="grid gap-3 md:grid-cols-3">
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
              </div>
            </>
          ) : lead ? (
            <>
              <LeadOrder order={lead} total={summary.data.priorities.length} />
              <div className="grid gap-3 md:grid-cols-3">
                {rest.map((order) => (
                  <CompactOrder key={order.meter_id} order={order} />
                ))}
              </div>
            </>
          ) : (
            <Sheet>
              <Sheet.Body>
                <p className="font-semibold">Sin órdenes emitidas</p>
                <p className="mt-1 text-sm text-ink-muted">
                  El motor no encontró cambios sostenidos ni problemas de datos. Corre un análisis para revisar de nuevo.
                </p>
              </Sheet.Body>
            </Sheet>
          )}
        </section>

        {summary.isPending ? <Skeleton className="h-[26rem]" /> : <KpiPanel summary={summary.data} />}
      </div>

      <section aria-labelledby="ledger-title" className="mt-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="ledger-title" className="text-lg font-bold tracking-[-0.01em]">
              Libro de medidores
            </h2>
            <p className="text-sm text-ink-muted">Los 12 medidores, de mayor a menor severidad.</p>
          </div>
          <ButtonLink to={paths.meters}>Filtrar y ordenar</ButtonLink>
        </div>
        {ledger.isError ? (
          <ErrorState message={ApiError.from(ledger.error).message} onRetry={() => void ledger.refetch()} />
        ) : (
          <MeterLedger
            rows={ledger.data?.rows ?? []}
            loadingRows={ledger.isPending ? 6 : 0}
            caption="Medidores ordenados por severidad"
          />
        )}
      </section>
    </>
  )
}
