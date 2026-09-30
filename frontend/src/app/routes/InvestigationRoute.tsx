import { ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { HourlyChart, type HourlyChartPoint } from '@/components/charts/HourlyChart'
import { EventList } from '@/components/domain/EventList'
import { ButtonLink } from '@/components/ui/Button'
import { ErrorState, Skeleton } from '@/components/ui/feedback'
import { SegmentedMeter } from '@/components/ui/SegmentedMeter'
import { SeverityMark } from '@/components/ui/SeverityMark'
import { Sheet } from '@/components/ui/Sheet'
import { Stamp } from '@/components/ui/Stamp'
import { paths } from '@/config/paths'
import { useAnomaly, useAnomalies } from '@/features/anomalies/anomalies.queries'
import { EvidenceChecks } from '@/features/anomalies/components/EvidenceChecks'
import { VariablesTable } from '@/features/anomalies/components/VariablesTable'
import { WindowFacts } from '@/features/anomalies/components/WindowFacts'
import { useMeterDetail } from '@/features/meters/meters.queries'
import { ApiError } from '@/lib/api-client'
import { formatNumber, formatPlantTime } from '@/lib/format'
import { anomalyTypeAction, anomalyTypeHint, anomalyTypeLabel, narratorLabel } from '@/lib/labels'
import type { Anomaly, MeterDetail } from '@/types/api.entities'

/** Horas de contexto antes y después de la ventana del cambio. */
const CONTEXT_MS = 36 * 3_600_000

function OrderStamp({ anomaly }: { anomaly: Anomaly }) {
  if (!anomaly.anomaly) return <Stamp tone="neutral" size="lg">No escalar</Stamp>
  if (anomaly.severity === 'HIGH') return <Stamp tone="critical" size="lg">Crítica</Stamp>
  return <Stamp tone="alert" size="lg">Alerta</Stamp>
}

/** Serie de la ventana del problema con contexto. Calidad de datos mira el voltaje. */
function WindowChart({ anomaly, meter }: { anomaly: Anomaly; meter: MeterDetail }) {
  const quality = anomaly.type === 'DATA_QUALITY'
  const from = Date.parse(anomaly.evidence.window_start) - CONTEXT_MS
  const to = Date.parse(anomaly.evidence.window_end) + CONTEXT_MS

  const points = useMemo<HourlyChartPoint[]>(
    () =>
      meter.hourly_history
        .filter((p) => {
          const t = Date.parse(p.timestamp)
          return t >= from && t <= to
        })
        .map((p) => ({
          t: Date.parse(p.timestamp),
          value: quality ? p.voltage_v : p.consumption_kwh,
          ...(quality ? {} : { expected: p.expected_kwh }),
        })),
    [meter.hourly_history, from, to, quality],
  )

  return (
    <HourlyChart
      points={points}
      unit={quality ? 'V' : 'kWh'}
      decimals={1}
      valueLabel={quality ? 'Voltaje medido' : 'Consumo medido'}
      window={{
        start: anomaly.evidence.window_start,
        end: anomaly.evidence.window_end,
        label: quality ? 'Horas con lecturas incoherentes' : 'Cambio sostenido',
      }}
      reference={
        quality
          ? {
              value: meter.electrical.voltage_v.baseline,
              label: `Normal ${formatNumber(meter.electrical.voltage_v.baseline, 1)} V`,
            }
          : undefined
      }
      markers={anomaly.evidence.related_events.map((e) => ({ at: e.timestamp, label: 'Evento' }))}
      height={260}
    />
  )
}

/**
 * Investigación: la orden de trabajo completa. Responde, en orden, qué encontró
 * la IA, qué hacer, la comparación contra baseline, qué variables cambiaron,
 * por qué confía y qué eventos hubo.
 */
export function InvestigationRoute() {
  const { meterId = '' } = useParams()
  const list = useAnomalies()
  const { data: anomaly } = useAnomaly(meterId)
  const meter = useMeterDetail(meterId)

  if (list.isError) {
    return <ErrorState message={ApiError.from(list.error).message} onRetry={() => void list.refetch()} />
  }
  if (list.isPending) return <Skeleton className="h-96" />
  if (!anomaly) {
    return (
      <div className="flex max-w-lg flex-col gap-3 py-6">
        <h1 className="text-2xl font-bold">No hay orden para {meterId}</h1>
        <p className="text-sm text-ink-muted">
          El motor no encontró anomalías en este medidor. Puedes revisar su comportamiento en el detalle.
        </p>
        <ButtonLink to={paths.meter(meterId)} className="self-start">
          Ver el medidor
        </ButtonLink>
      </div>
    )
  }

  const ev = anomaly.evidence
  const total = list.data.length

  return (
    <>
      <nav aria-label="Ruta" className="mb-3 flex items-center gap-1 text-sm text-ink-muted">
        <Link to={paths.anomalies} className="text-form">
          Anomalías IA
        </Link>
        <ChevronRight aria-hidden className="size-3.5" />
        <span className="data text-ink">{anomaly.meter_id}</span>
      </nav>

      <article aria-labelledby="order-title" className="flex flex-col gap-5">
        {/* Cabecera de la orden */}
        <header className="card border-form/40">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule bg-form-wash px-4 py-2 sm:px-5">
            <span className="form-label">
              Orden de trabajo · Prioridad <span className="data">{anomaly.priority}</span> de <span className="data">{total}</span>
            </span>
            <span className="form-label">Detectada {formatPlantTime(anomaly.detected_at)} · hora de planta</span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-5 px-4 py-5 sm:px-5">
            <div className="min-w-0">
              <h1 id="order-title" className="data text-[3rem] leading-none tracking-[-0.03em] sm:text-[3.75rem]">
                {anomaly.meter_id}
              </h1>
              <p className="mt-3 text-lg font-semibold">{anomalyTypeLabel[anomaly.type]}</p>
              <p className="text-sm text-ink-muted">{anomalyTypeHint[anomaly.type]}</p>
            </div>
            <div className="flex flex-col items-start gap-4 sm:items-end">
              <OrderStamp anomaly={anomaly} />
              <dl className="flex flex-wrap gap-x-6 gap-y-2 sm:justify-end">
                <div>
                  <dt className="form-label">Severidad</dt>
                  <dd>
                    <SeverityMark severity={anomaly.severity} />
                  </dd>
                </div>
                <div>
                  <dt className="form-label">Confianza</dt>
                  <dd>
                    <SegmentedMeter value={anomaly.confidence} showValue="words" />
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </header>

        {/* 1 y 2: qué encontró y qué hacer */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Sheet>
            <Sheet.Header title="Qué encontró la IA" note={`Redactado por: ${narratorLabel(anomaly.narrated_by)}`} />
            <Sheet.Body>
              <p className="max-w-[65ch] text-base leading-7 text-pretty">{anomaly.reason}</p>
            </Sheet.Body>
          </Sheet>
          <section aria-labelledby="action-title" className="card border-form/60">
            <header className="flex items-center justify-between gap-3 border-b border-rule px-4 pt-3 pb-2">
              <h2 id="action-title" className="text-[0.9375rem] font-semibold">
                Acción recomendada
              </h2>
              <span className="form-label">{anomalyTypeAction[anomaly.type]}</span>
            </header>
            <p className="max-w-[65ch] p-4 text-base leading-7 font-medium text-pretty">{anomaly.recommended_action}</p>
          </section>
        </div>

        {/* 3: comparación contra baseline */}
        <Sheet>
          <Sheet.Header
            title="Comparación contra baseline"
            note={
              anomaly.type === 'DATA_QUALITY'
                ? 'Voltaje durante las horas marcadas, con 36 h de contexto'
                : 'Consumo medido contra el esperado por hora, con 36 h de contexto'
            }
          />
          <Sheet.Body className="flex flex-col gap-4">
            {meter.data ? <WindowChart anomaly={anomaly} meter={meter.data} /> : <Skeleton className="h-64" />}
            <WindowFacts evidence={ev} />
          </Sheet.Body>
        </Sheet>

        {/* 4: variables */}
        <Sheet>
          <Sheet.Header
            title="Variables que cambiaron"
            note="Mediana durante la ventana contra la mediana normal en las mismas horas del día"
          />
          <Sheet.Body flush>
            <VariablesTable variables={ev.variables} />
          </Sheet.Body>
        </Sheet>

        {/* 5 y 6: evidencia y eventos */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Sheet>
            <Sheet.Header title="Evidencia y confianza" note="Cada señal que respalda la conclusión, con su peso" />
            <Sheet.Body>
              <EvidenceChecks anomaly={anomaly} />
            </Sheet.Body>
          </Sheet>
          <Sheet>
            <Sheet.Header title="Eventos relacionados" note="Desde 24 h antes del inicio hasta el final de la ventana" />
            <Sheet.Body>
              <EventList
                events={ev.related_events}
                empty="Ningún evento operativo registrado en la ventana: nada explica el cambio."
              />
            </Sheet.Body>
          </Sheet>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <ButtonLink to={paths.meter(anomaly.meter_id)}>Ver el medidor completo</ButtonLink>
          <ButtonLink to={paths.anomalies} variant="primary">
            Volver a las órdenes
          </ButtonLink>
        </div>
      </article>
    </>
  )
}
