import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatKwh, formatNumber, formatPct, formatPlantDay } from '@/lib/format'
import { chartColors, tooltipStyle } from './chart-colors'

interface DailyChartProps {
  days: { date: string; consumption_kwh: number; baseline_kwh: number }[]
  height?: number
}

/** Diferencia contra el baseline a partir de la cual un día se marca. */
const THRESHOLD_PCT = 10

/**
 * Consumo por día contra el baseline diario. Los días que se salen más de
 * ±10 % van en verde de formulario lleno; los normales, en gris verdoso.
 */
export function DailyChart({ days, height = 200 }: DailyChartProps) {
  const baseline = days[0]?.baseline_kwh ?? 0
  const pct = (v: number) => (baseline ? ((v - baseline) / baseline) * 100 : 0)

  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-3 bg-rule-strong" /> Día normal
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-3 bg-form" /> Fuera de ±{THRESHOLD_PCT} %
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="w-4 border-t-2 border-dashed border-ink" /> Baseline diario {formatKwh(baseline)}
        </span>
      </figcaption>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={days} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barCategoryGap="18%">
            <CartesianGrid stroke={chartColors.rule} strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => formatPlantDay(d)}
              tick={{ fill: chartColors.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: chartColors.form }}
              interval="preserveStartEnd"
            />
            <YAxis
              width={56}
              tick={{ fill: chartColors.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatNumber(v)}
            />
            <Tooltip
              cursor={{ fill: chartColors.rule, opacity: 0.6 }}
              contentStyle={tooltipStyle}
              labelFormatter={(d) => formatPlantDay(String(d))}
              formatter={(v) => [`${formatKwh(Number(v))} (${formatPct(pct(Number(v)))})`, 'Consumo']}
            />
            <ReferenceLine y={baseline} stroke={chartColors.ink} strokeDasharray="5 4" ifOverflow="extendDomain" />
            <Bar dataKey="consumption_kwh" isAnimationActive={false}>
              {days.map((d) => (
                <Cell key={d.date} fill={Math.abs(pct(d.consumption_kwh)) > THRESHOLD_PCT ? chartColors.form : chartColors.formMuted} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
