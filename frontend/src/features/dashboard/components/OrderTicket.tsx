import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { SegmentedMeter } from '@/components/ui/SegmentedMeter'
import { SeverityMark } from '@/components/ui/SeverityMark'
import { Stamp } from '@/components/ui/Stamp'
import { paths } from '@/config/paths'
import { cn } from '@/lib/cn'
import { formatPlantTime } from '@/lib/format'
import { anomalyTypeAction, anomalyTypeLabel } from '@/lib/labels'
import type { AnomalyBrief } from '@/types/api.entities'

/** Sello de la orden: crítica, alerta o "no escalar" (falso positivo). */
function OrderStamp({ order, size }: { order: AnomalyBrief; size: 'md' | 'lg' }) {
  if (!order.anomaly) return <Stamp tone="neutral" size={size}>No escalar</Stamp>
  if (order.severity === 'HIGH') return <Stamp tone="critical" size={size}>Crítica</Stamp>
  return <Stamp tone="alert" size={size}>Alerta</Stamp>
}

/**
 * Una orden de trabajo emitida por la IA. Dos variantes explícitas:
 * LeadOrder para la prioridad 1, a doble escala,
 * y CompactOrder para el resto. Comparten la anatomía, no un booleano.
 */
export function LeadOrder({ order, total }: { order: AnomalyBrief; total: number }) {
  return (
    <article aria-labelledby={`order-${order.meter_id}`} className="card relative border-form/40">
      <header className="flex items-center justify-between gap-3 border-b border-rule bg-form-wash px-4 py-2">
        <span className="form-label">
          Orden <span className="data">{order.priority}</span> de <span className="data">{total}</span> · Prioridad máxima
        </span>
        <span className="form-label">Detectada {formatPlantTime(order.detected_at)}</span>
      </header>

      <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <h3 id={`order-${order.meter_id}`} className="data text-[2.75rem] leading-none tracking-[-0.03em] sm:text-[3.5rem]">
            {order.meter_id}
          </h3>
          <p className="mt-2 text-sm font-semibold text-ink">{anomalyTypeLabel[order.type]}</p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <OrderStamp order={order} size="lg" />
          <dl className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
            <div>
              <dt className="form-label">Severidad</dt>
              <dd>
                <SeverityMark severity={order.severity} />
              </dd>
            </div>
            <div>
              <dt className="form-label">Confianza</dt>
              <dd>
                <SegmentedMeter value={order.confidence} />
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid border-t border-rule md:grid-cols-2">
        <div className="p-4 sm:p-5 md:border-r md:border-rule">
          <p className="form-label">Qué encontró la IA</p>
          <p className="mt-1.5 max-w-[62ch] text-[0.9375rem] leading-6 text-pretty">{order.reason}</p>
        </div>
        <div className="p-4 sm:p-5">
          <p className="form-label">Acción · {anomalyTypeAction[order.type]}</p>
          <p className="mt-1.5 max-w-[62ch] text-[0.9375rem] leading-6 font-medium text-pretty">{order.recommended_action}</p>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-rule px-4 py-2.5">
        <Link to={paths.meter(order.meter_id)} className="text-sm text-form underline">
          Ver medidor
        </Link>
        <Link
          to={paths.investigation(order.meter_id)}
          className="inline-flex items-center gap-1.5 rounded-full bg-form px-4 py-1.5 text-sm font-semibold text-sheet transition-colors hover:bg-form-strong"
        >
          Abrir investigación
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </footer>
    </article>
  )
}

export function CompactOrder({ order }: { order: AnomalyBrief }) {
  return (
    <article className={cn('card group relative transition-colors hover:border-form', !order.anomaly && 'bg-paper')}>
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="min-w-0">
          <h3 className="data text-2xl leading-7">
            {/* El link cubre toda la tarjeta (pseudo-elemento), sin anidar interactivos. */}
            <Link to={paths.investigation(order.meter_id)} className="no-underline after:absolute after:inset-0">
              {order.meter_id}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm font-semibold text-ink">
            {anomalyTypeLabel[order.type]} <span className="font-normal whitespace-nowrap text-ink-muted">· orden {order.priority}</span>
          </p>
        </div>
        <OrderStamp order={order} size="md" />
      </div>
      <p className="line-clamp-2 px-4 pt-2 text-sm leading-5 text-ink-muted">{order.reason}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-rule px-4 py-2">
        <SeverityMark severity={order.severity} />
        <SegmentedMeter value={order.confidence} />
        <span className="text-sm font-semibold text-form group-hover:underline">
          {order.anomaly ? anomalyTypeAction[order.type] : 'Ver detalle'}
        </span>
      </div>
    </article>
  )
}
