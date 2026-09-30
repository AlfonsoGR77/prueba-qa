import { cn } from '@/lib/cn'
import { confidenceLabel } from '@/lib/labels'
import { formatConfidence } from '@/lib/format'

const SEGMENTS = 10

interface SegmentedMeterProps {
  value: number // de 0 a 1
  label?: string
  showValue?: 'number' | 'words' | 'none'
  className?: string
}

/**
 * Contador segmentado de 10 celdas para la confianza de la IA. Cada celda es
 * una décima: 0,95 llena 9 celdas y media. Lleva el número al lado, así que
 * no depende de leer las celdas.
 */
export function SegmentedMeter({ value, label = 'Confianza', showValue = 'number', className }: SegmentedMeterProps) {
  const clamped = Math.min(Math.max(value, 0), 1)
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={clamped}
        aria-valuetext={`${formatConfidence(clamped)} (${confidenceLabel(clamped)})`}
        className="grid grid-cols-10 gap-[2px]"
      >
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const fill = Math.min(Math.max(clamped * SEGMENTS - i, 0), 1)
          return (
            <span key={i} className="relative h-3 w-1.5 overflow-hidden rounded-[2px] border border-form/60 bg-sheet">
              <span className="absolute inset-y-0 left-0 bg-form" style={{ width: `${fill * 100}%` }} />
            </span>
          )
        })}
      </span>
      {showValue === 'number' ? <span className="data text-sm">{formatConfidence(clamped)}</span> : null}
      {showValue === 'words' ? (
        <span className="text-sm">
          <span className="data">{formatConfidence(clamped)}</span> · {confidenceLabel(clamped)}
        </span>
      ) : null}
    </span>
  )
}
