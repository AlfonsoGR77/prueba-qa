import { Field } from '@/components/ui/Field'
import { formatKwh, formatNumber, formatPct, formatPlantTime } from '@/lib/format'
import type { Evidence } from '@/types/api.entities'

/** Cifras de la comparación contra baseline: cambio de consumo o reporte de calidad. */
export function WindowFacts({ evidence }: { evidence: Evidence }) {
  const { change, quality } = evidence

  if (change) {
    return (
      <div className="grid grid-cols-2 gap-px bg-rule lg:grid-cols-4 [&>*]:rounded-none [&>*]:border-0">
        <Field>
          <Field.Label>Esperado en la ventana</Field.Label>
          <Field.Value>{formatKwh(change.expected_kwh)}</Field.Value>
        </Field>
        <Field>
          <Field.Label>Medido en la ventana</Field.Label>
          <Field.Value>{formatKwh(change.actual_kwh)}</Field.Value>
          <Field.Note>{formatPct(change.change_pct)} vs. esperado</Field.Note>
        </Field>
        <Field>
          <Field.Label>Energía en juego</Field.Label>
          <Field.Value>
            {evidence.impact_kwh > 0 ? '+' : ''}
            {formatKwh(evidence.impact_kwh)}
          </Field.Value>
          <Field.Note>{evidence.impact_kwh >= 0 ? 'de más' : 'de menos'} frente a lo esperado</Field.Note>
        </Field>
        <Field>
          <Field.Label>Duración</Field.Label>
          <Field.Value>{formatNumber(change.hours)} h</Field.Value>
          <Field.Note>
            Desde {formatPlantTime(change.start)} · {change.ongoing ? 'sigue activo' : `hasta ${formatPlantTime(change.end)}`}
          </Field.Note>
        </Field>
      </div>
    )
  }

  if (quality) {
    return (
      <div className="grid grid-cols-2 gap-px bg-rule lg:grid-cols-4 [&>*]:rounded-none [&>*]:border-0">
        <Field>
          <Field.Label>Horas sospechosas</Field.Label>
          <Field.Value>{quality.flagged_hours} h</Field.Value>
          <Field.Note>Desde {formatPlantTime(quality.first_flagged)}</Field.Note>
        </Field>
        <Field>
          <Field.Label>Voltaje fuera de ±5 %</Field.Label>
          <Field.Value>{quality.voltage_out_of_range} h</Field.Value>
        </Field>
        <Field>
          <Field.Label>FP incoherente</Field.Label>
          <Field.Value>{quality.power_factor_mismatch} h</Field.Value>
          <Field.Note>con el consumo normal</Field.Note>
        </Field>
        <Field>
          <Field.Label>Consumo últimas 24 h</Field.Label>
          <Field.Value>{formatKwh(evidence.last_day_kwh)}</Field.Value>
          <Field.Note>{formatPct(evidence.daily_change_pct)} vs. baseline: estable</Field.Note>
        </Field>
      </div>
    )
  }

  return null
}
