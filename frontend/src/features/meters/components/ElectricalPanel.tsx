import { Field } from '@/components/ui/Field'
import { Variation } from '@/components/ui/Variation'
import { formatNumber } from '@/lib/format'
import type { MeterDetail, Metric } from '@/types/api.entities'

function MetricField({ label, metric, unit, decimals }: { label: string; metric: Metric; unit: string; decimals: number }) {
  return (
    <Field>
      <Field.Label>{label}</Field.Label>
      <Field.Value>
        {formatNumber(metric.value, decimals)}
        {unit ? <span className="text-sm"> {unit}</span> : null}
      </Field.Value>
      <Field.Note>
        Normal {formatNumber(metric.baseline, decimals)} {unit} · <Variation value={metric.change_pct} className="text-xs" />
      </Field.Note>
    </Field>
  )
}

/** Voltaje, corriente y factor de potencia de la última lectura contra lo normal. */
export function ElectricalPanel({ electrical }: { electrical: MeterDetail['electrical'] }) {
  return (
    <div className="grid gap-px bg-rule sm:grid-cols-3 [&>*]:rounded-none [&>*]:border-0">
      <MetricField label="Voltaje" metric={electrical.voltage_v} unit="V" decimals={1} />
      <MetricField label="Corriente" metric={electrical.current_a} unit="A" decimals={1} />
      <MetricField label="Factor de potencia" metric={electrical.power_factor} unit="" decimals={2} />
    </div>
  )
}
