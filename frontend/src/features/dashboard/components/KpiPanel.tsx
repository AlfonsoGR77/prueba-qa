import { Field } from '@/components/ui/Field'
import { SegmentedMeter } from '@/components/ui/SegmentedMeter'
import { formatClockTime, formatNumber, formatPct } from '@/lib/format'
import { narratorLabel } from '@/lib/labels'
import type { DashboardSummary } from '@/types/api.entities'

const runStatusLabel = { RUNNING: 'En curso', COMPLETED: 'Completado', FAILED: 'Falló' } as const

/**
 * Los 6 KPI del enunciado como casillas de un formulario, no como tarjetas:
 * Medidores · Consumo · Anomalías IA · Alta prioridad · Confianza IA · Último análisis.
 */
export function KpiPanel({ summary }: { summary: DashboardSummary }) {
  const { status_counts: counts, consumption, last_analysis: last } = summary

  return (
    <section aria-labelledby="kpi-title" className="card">
      <h2 id="kpi-title" className="border-b border-rule px-4 pt-3 pb-2 text-[0.9375rem] font-semibold">
        Estado de la planta
      </h2>
      <div className="grid grid-cols-2 gap-3 p-4">
        <Field>
          <Field.Label>Medidores</Field.Label>
          <Field.Value size="lg">{summary.total_meters}</Field.Value>
          <Field.Note>
            {counts.normal} normales · {counts.alert} alerta · {counts.critical} críticas
          </Field.Note>
        </Field>
        <Field>
          <Field.Label>Consumo del periodo</Field.Label>
          <Field.Value size="lg">
            {formatNumber(consumption.period_kwh / 1000, 1)} <span className="text-base">MWh</span>
          </Field.Value>
          <Field.Note>Últimas 24 h {formatPct(consumption.variation_pct)} vs. baseline</Field.Note>
        </Field>
        <Field>
          <Field.Label>Anomalías IA</Field.Label>
          <Field.Value size="lg">{summary.anomalies_detected}</Field.Value>
          <Field.Note>detectadas por el motor</Field.Note>
        </Field>
        <Field>
          <Field.Label>Alta prioridad</Field.Label>
          <Field.Value size="lg" className={summary.requiring_attention > 0 ? 'text-critical' : undefined}>
            {summary.requiring_attention}
          </Field.Value>
          <Field.Note>requieren atención</Field.Note>
        </Field>
        <Field className="col-span-2">
          <Field.Label>Confianza IA</Field.Label>
          <SegmentedMeter value={summary.ai_confidence} label="Confianza promedio de la IA" showValue="words" className="mt-1" />
          <Field.Note>Promedio de las {summary.anomalies_detected} anomalías; es un puntaje de evidencia, no una certeza.</Field.Note>
        </Field>
        <Field className="col-span-2">
          <Field.Label>Último análisis</Field.Label>
          <Field.Value>
            {last.id} · {runStatusLabel[last.status]}
          </Field.Value>
          <Field.Note>
            {last.finished_at ? formatClockTime(last.finished_at) : formatClockTime(last.started_at)} ·{' '}
            {last.trigger === 'STARTUP' ? 'al arrancar el servidor' : 'Run AI Analysis'} · {narratorLabel(last.narrator)}
          </Field.Note>
        </Field>
      </div>
    </section>
  )
}
