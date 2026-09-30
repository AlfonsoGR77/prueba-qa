import { ArrowRight, ChevronRight } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DailyChart } from '@/components/charts/DailyChart'
import { EventList } from '@/components/domain/EventList'
import { ButtonLink } from '@/components/ui/Button'
import { ErrorState, Skeleton } from '@/components/ui/feedback'
import { Field } from '@/components/ui/Field'
import { SegmentedMeter } from '@/components/ui/SegmentedMeter'
import { SeverityMark } from '@/components/ui/SeverityMark'
import { Sheet } from '@/components/ui/Sheet'
import { StatusMark } from '@/components/ui/StatusMark'
import { Variation } from '@/components/ui/Variation'
import { paths } from '@/config/paths'
import { ElectricalPanel } from '@/features/meters/components/ElectricalPanel'
import { MeterHistory } from '@/features/meters/components/MeterHistory'
import { useMeterDetail } from '@/features/meters/meters.queries'
import { ApiError } from '@/lib/api-client'
import { formatKwh, formatPlantTime } from '@/lib/format'
import { anomalyTypeAction, anomalyTypeLabel } from '@/lib/labels'

/**
 * Detalle de medidor: consumo actual, baseline, variación, estado, voltaje,
 * corriente, factor de potencia e histórico. Si hay orden, lleva a la investigación.
 */
export function MeterDetailRoute() {
  const { meterId = '' } = useParams()
  const { data: meter, isPending, isError, error, refetch } = useMeterDetail(meterId)

  if (isError) {
    const apiError = ApiError.from(error)
    return apiError.status === 404 ? (
      <div className="flex max-w-lg flex-col gap-3 py-6">
        <h1 className="text-2xl font-bold">No existe el medidor {meterId}</h1>
        <p className="text-sm text-ink-muted">Revisa el código o búscalo en el libro de medidores.</p>
        <ButtonLink to={paths.meters} className="self-start">
          Ir al libro de medidores
        </ButtonLink>
      </div>
    ) : (
      <ErrorState message={apiError.message} onRetry={() => void refetch()} />
    )
  }

  return (
    <>
      <nav aria-label="Ruta" className="mb-3 flex items-center gap-1 text-sm text-ink-muted">
        <Link to={paths.meters} className="text-form">
          Libro de medidores
        </Link>
        <ChevronRight aria-hidden className="size-3.5" />
        <span className="data text-ink">{meterId}</span>
      </nav>

      {isPending ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-80" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Encabezado de la hoja: el medidor y sus 4 cifras clave. */}
          <section aria-labelledby="meter-title" className="card border-form/40">
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center gap-4">
                <h1 id="meter-title" className="data text-[2.75rem] leading-none tracking-[-0.03em]">
                  {meter.meter_id}
                </h1>
                <StatusMark status={meter.status} size="lg" />
              </div>
              <p className="text-sm text-ink-muted">
                Última lectura <span className="data text-ink">{formatPlantTime(meter.last_reading_at)}</span> (hora de planta)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-rule p-4 lg:grid-cols-4">
              <Field>
                <Field.Label>Consumo actual · 24 h</Field.Label>
                <Field.Value size="lg">{formatKwh(meter.consumption_kwh)}</Field.Value>
              </Field>
              <Field>
                <Field.Label>Baseline diario</Field.Label>
                <Field.Value size="lg">{formatKwh(meter.baseline_kwh)}</Field.Value>
                <Field.Note>Mediana de los primeros 7 días</Field.Note>
              </Field>
              <Field>
                <Field.Label>Variación</Field.Label>
                <Field.Value size="lg">
                  <Variation value={meter.variation_pct} />
                </Field.Value>
              </Field>
              <Field>
                <Field.Label>Severidad</Field.Label>
                <span className="mt-1">
                  <SeverityMark severity={meter.severity} />
                </span>
                {meter.anomaly_type ? <Field.Note>{anomalyTypeLabel[meter.anomaly_type]}</Field.Note> : null}
              </Field>
            </div>
          </section>

          {meter.anomaly ? (
            <section
              aria-labelledby="order-title"
              className="flex flex-wrap items-center justify-between gap-4 card px-4 py-3 sm:px-5"
            >
              <div className="min-w-0 max-w-[80ch]">
                <h2 id="order-title" className="form-label">
                  Orden {meter.anomaly.priority} · {anomalyTypeLabel[meter.anomaly.type]} ·{' '}
                  {anomalyTypeAction[meter.anomaly.type]}
                </h2>
                <p className="mt-1 text-sm leading-6">{meter.anomaly.reason}</p>
              </div>
              <div className="flex items-center gap-4">
                <SegmentedMeter value={meter.anomaly.confidence} />
                <ButtonLink to={paths.investigation(meter.meter_id)} variant="primary">
                  Abrir investigación
                  <ArrowRight aria-hidden className="size-4" />
                </ButtonLink>
              </div>
            </section>
          ) : (
            <p className="card px-4 py-3 text-sm text-ink-muted sm:px-5">
              Sin órdenes para este medidor: el motor no encontró cambios sostenidos ni lecturas incoherentes.
            </p>
          )}

          <Sheet>
            <Sheet.Header title="Variables eléctricas" note="Última lectura contra la mediana de la semana de referencia" />
            <Sheet.Body flush>
              <ElectricalPanel electrical={meter.electrical} />
            </Sheet.Body>
          </Sheet>

          <Sheet>
            <Sheet.Header title="Histórico por hora" note="14 días · 336 lecturas" />
            <Sheet.Body>
              <MeterHistory meter={meter} />
            </Sheet.Body>
          </Sheet>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Sheet>
              <Sheet.Header title="Consumo por día" />
              <Sheet.Body>
                <DailyChart days={meter.daily_history} />
              </Sheet.Body>
            </Sheet>
            <Sheet>
              <Sheet.Header title="Eventos registrados" />
              <Sheet.Body>
                <EventList events={meter.events} empty="No hay eventos operativos registrados para este medidor." />
              </Sheet.Body>
            </Sheet>
          </div>
        </div>
      )}
    </>
  )
}
