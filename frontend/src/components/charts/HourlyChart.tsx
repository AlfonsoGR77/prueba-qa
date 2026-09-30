import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNumber, formatPlantDay, formatPlantTime } from '@/lib/format'
import { chartColors, tooltipStyle } from './chart-colors'

export interface HourlyChartPoint {
  t: number // epoch ms
  value: number
  expected?: number
}

interface HourlyChartProps {
  points: HourlyChartPoint[]
  unit: string
  decimals: number
  /** Ventana del cambio detectado, sombreada. */
  window?: { start: string; end: string; label: string }
  /** Línea de referencia fija (por ejemplo, el voltaje normal). */
  reference?: { value: number; label: string }
  /** Eventos operativos como líneas verticales. */
  markers?: { at: string; label: string }[]
  height?: number
  valueLabel?: string
  expectedLabel?: string
}

const DAY_MS = 86_400_000

/** Una marca por día (medianoche de planta), sin repetir fechas en el eje. */
function dailyTicks(points: HourlyChartPoint[]): number[] {
  const first = points[0]?.t
  const last = points.at(-1)?.t
  if (first === undefined || last === undefined) return []
  const ticks: number[] = []
  for (let t = Math.ceil(first / DAY_MS) * DAY_MS; t <= last; t += DAY_MS) ticks.push(t)
  return ticks
}

/**
 * Serie horaria: lo medido (tinta) contra lo esperado (verde punteado), con la
 * ventana del cambio sombreada. Las fechas son hora de planta.
 */
export function HourlyChart({
  points,
  unit,
  decimals,
  window,
  reference,
  markers = [],
  height = 280,
  valueLabel = 'Medido',
  expectedLabel = 'Esperado (baseline)',
}: HourlyChartProps) {
  const hasExpected = points.some((p) => p.expected !== undefined)
  const ticks = useMemo(() => dailyTicks(points), [points])
  const fmt = (v: number) => `${formatNumber(v, decimals)}${unit ? ` ${unit}` : ''}`

  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 bg-ink" /> {valueLabel}
        </span>
        {hasExpected ? (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="w-4 border-t-2 border-dashed border-form" /> {expectedLabel}
          </span>
        ) : null}
        {window ? (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-3 w-4 border border-critical/40 bg-critical-wash" /> {window.label}
          </span>
        ) : null}
        <span className="ml-auto">Hora de planta</span>
      </figcaption>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={chartColors.rule} strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={ticks}
              tickFormatter={(t: number) => formatPlantDay(new Date(t).toISOString())}
              tick={{ fill: chartColors.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: chartColors.form }}
              minTickGap={24}
            />
            <YAxis
              width={56}
              tick={{ fill: chartColors.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatNumber(v, decimals > 1 ? 2 : 0)}
              domain={['auto', 'auto']}
            />
            {window ? (
              <ReferenceArea
                x1={Date.parse(window.start)}
                x2={Date.parse(window.end)}
                fill={chartColors.criticalWash}
                stroke={chartColors.critical}
                strokeOpacity={0.35}
                ifOverflow="extendDomain"
              />
            ) : null}
            {reference ? (
              <ReferenceLine
                y={reference.value}
                stroke={chartColors.form}
                strokeDasharray="4 4"
                label={{ value: reference.label, position: 'insideTopRight', fill: chartColors.form, fontSize: 11 }}
              />
            ) : null}
            {markers.map((m) => (
              <ReferenceLine
                key={m.at + m.label}
                x={Date.parse(m.at)}
                stroke={chartColors.muted}
                strokeDasharray="1 3"
                label={{ value: m.label, position: 'insideTopLeft', fill: chartColors.muted, fontSize: 10 }}
              />
            ))}
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(t) => formatPlantTime(new Date(Number(t)).toISOString())}
              formatter={(v, name) => [fmt(Number(v)), name === 'expected' ? expectedLabel : valueLabel]}
            />
            {hasExpected ? (
              <Line
                type="monotone"
                dataKey="expected"
                stroke={chartColors.form}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
              />
            ) : null}
            <Line type="monotone" dataKey="value" stroke={chartColors.ink} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
