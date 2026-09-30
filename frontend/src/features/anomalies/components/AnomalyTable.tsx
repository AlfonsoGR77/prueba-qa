import { ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { SegmentedMeter } from '@/components/ui/SegmentedMeter'
import { SeverityMark } from '@/components/ui/SeverityMark'
import { Stamp } from '@/components/ui/Stamp'
import { paths } from '@/config/paths'
import { cn } from '@/lib/cn'
import { formatPlantTime } from '@/lib/format'
import { anomalyTypeAction, anomalyTypeLabel, confidenceLabel, narratorLabel } from '@/lib/labels'
import type { Anomaly } from '@/types/api.entities'

const th = 'form-label px-3 py-2 text-left font-semibold whitespace-nowrap'
const td = 'px-3 py-3 align-middle'

/** Anomalías IA: medidor, tipo, severidad, confianza y acción, por prioridad. */
export function AnomalyTable({ anomalies }: { anomalies: Anomaly[] }) {
  const navigate = useNavigate()

  return (
    <div className="card overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Anomalías detectadas por la IA, ordenadas por prioridad</caption>
        <thead className="border-b border-rule">
          <tr>
            <th scope="col" className={cn(th, 'w-16')}>Prior.</th>
            <th scope="col" className={th}>Medidor</th>
            <th scope="col" className={th}>Tipo</th>
            <th scope="col" className={th}>Severidad</th>
            <th scope="col" className={th}>Confianza</th>
            <th scope="col" className={th}>Acción</th>
            <th scope="col" className={cn(th, 'hidden lg:table-cell')}>Detectada</th>
            <th scope="col" className={cn(th, 'hidden xl:table-cell')}>Redactó</th>
          </tr>
        </thead>
        <tbody className="greenbar">
          {anomalies.map((a) => (
            <tr
              key={a.meter_id}
              onClick={() => navigate(paths.investigation(a.meter_id))}
              className="cursor-pointer border-b border-rule/60 transition-colors hover:bg-form-wash"
            >
              <td className={cn(td, 'data text-lg')}>{a.priority}</td>
              <th scope="row" className={cn(td, 'text-left font-normal')}>
                <Link
                  to={paths.investigation(a.meter_id)}
                  onClick={(e) => e.stopPropagation()}
                  className="data text-base text-ink no-underline hover:underline"
                >
                  {a.meter_id}
                </Link>
              </th>
              <td className={td}>{anomalyTypeLabel[a.type]}</td>
              <td className={td}>
                <SeverityMark severity={a.severity} />
              </td>
              <td className={td}>
                <span className="flex items-center gap-2">
                  <SegmentedMeter value={a.confidence} />
                  <span className="text-ink-muted">{confidenceLabel(a.confidence)}</span>
                </span>
              </td>
              <td className={td}>
                {a.anomaly ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-form">
                    {anomalyTypeAction[a.type]}
                    <ArrowRight aria-hidden className="size-3.5" />
                  </span>
                ) : (
                  <Stamp tone="neutral" size="sm">
                    {anomalyTypeAction[a.type]}
                  </Stamp>
                )}
              </td>
              <td className={cn(td, 'data hidden whitespace-nowrap text-ink-muted lg:table-cell')}>
                {formatPlantTime(a.detected_at)}
              </td>
              <td className={cn(td, 'hidden text-ink-muted xl:table-cell')}>{narratorLabel(a.narrated_by)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
