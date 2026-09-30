import { useMemo, useState } from 'react'
import { HourlyChart, type HourlyChartPoint } from '@/components/charts/HourlyChart'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { eventTypeLabel, variableLabel } from '@/lib/labels'
import type { MeterDetail, VariableName } from '@/types/api.entities'

const VARIABLES: VariableName[] = ['consumption_kwh', 'current_a', 'voltage_v', 'power_factor']

const electricalKey = {
  current_a: 'current_a',
  voltage_v: 'voltage_v',
  power_factor: 'power_factor',
} as const

/**
 * Histórico horario de 14 días con selector de variable. Consumo se compara
 * contra el esperado por hora; las demás variables, contra su valor normal.
 */
export function MeterHistory({ meter }: { meter: MeterDetail }) {
  const [variable, setVariable] = useState<VariableName>('consumption_kwh')
  const meta = variableLabel[variable]

  const points = useMemo<HourlyChartPoint[]>(
    () =>
      meter.hourly_history.map((p) => ({
        t: Date.parse(p.timestamp),
        value: p[variable],
        ...(variable === 'consumption_kwh' ? { expected: p.expected_kwh } : {}),
      })),
    [meter.hourly_history, variable],
  )

  const evidence = meter.anomaly?.evidence
  const reference =
    variable === 'consumption_kwh'
      ? undefined
      : {
          value: meter.electrical[electricalKey[variable]].baseline,
          label: `Normal ${formatNumber(meter.electrical[electricalKey[variable]].baseline, meta.decimals)} ${meta.unit}`,
        }

  return (
    <div>
      <div role="tablist" aria-label="Variable del histórico" className="mb-3 flex flex-wrap gap-1">
        {VARIABLES.map((v) => (
          <button
            key={v}
            role="tab"
            type="button"
            aria-selected={v === variable}
            onClick={() => setVariable(v)}
            className={cn(
              'border px-3 py-1.5 text-sm transition-colors duration-150',
              v === variable
                ? 'border-form bg-form font-semibold text-sheet'
                : 'border-rule-strong bg-sheet text-ink hover:border-form hover:bg-form-wash',
            )}
          >
            {variableLabel[v].name}
          </button>
        ))}
      </div>
      <HourlyChart
        points={points}
        unit={meta.unit}
        decimals={meta.decimals}
        valueLabel={`${meta.name} medido`}
        window={
          evidence
            ? { start: evidence.window_start, end: evidence.window_end, label: 'Ventana analizada por la IA' }
            : undefined
        }
        reference={reference}
        markers={meter.events.map((e) => ({ at: e.timestamp, label: eventTypeLabel[e.type] }))}
      />
    </div>
  )
}
