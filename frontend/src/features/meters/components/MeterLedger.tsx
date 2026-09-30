import { Link, useNavigate } from 'react-router'
import { SeverityMark } from '@/components/ui/SeverityMark'
import { StatusMark } from '@/components/ui/StatusMark'
import { Variation } from '@/components/ui/Variation'
import { paths } from '@/config/paths'
import { cn } from '@/lib/cn'
import { formatKwh, formatPlantTime } from '@/lib/format'
import { anomalyTypeLabel } from '@/lib/labels'
import type { MeterSummary } from '@/types/api.entities'
import { usePrefetchMeter } from '../meters.queries'

interface MeterLedgerProps {
  rows: MeterSummary[]
  /** Muestra la fila de carga en lugar de las filas (primera carga). */
  loadingRows?: number
  caption: string
  dimmed?: boolean
}

const th = 'form-label px-3 py-2 text-left font-semibold whitespace-nowrap'
const td = 'px-3 py-2.5 align-middle'

/**
 * Libro de medidores en papel green-bar: una fila por medidor. Toda la fila
 * lleva al detalle y al pasar el mouse precarga sus datos.
 */
export function MeterLedger({ rows, loadingRows = 0, caption, dimmed = false }: MeterLedgerProps) {
  const prefetch = usePrefetchMeter()
  const navigate = useNavigate()

  return (
    <div className="card overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm transition-opacity', dimmed && 'opacity-60')}>
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-rule">
          <tr>
            <th scope="col" className={th}>Medidor</th>
            <th scope="col" className={th}>Estado</th>
            <th scope="col" className={cn(th, 'text-right')}>Consumo 24 h</th>
            <th scope="col" className={cn(th, 'hidden text-right md:table-cell')}>Baseline</th>
            <th scope="col" className={cn(th, 'text-right')}>Variación</th>
            <th scope="col" className={cn(th, 'hidden sm:table-cell')}>Severidad</th>
            <th scope="col" className={cn(th, 'hidden lg:table-cell')}>Anomalía</th>
            <th scope="col" className={cn(th, 'hidden xl:table-cell')}>Última lectura</th>
          </tr>
        </thead>
        <tbody className="greenbar">
          {loadingRows > 0
            ? Array.from({ length: loadingRows }, (_, i) => (
                <tr key={i}>
                  <td colSpan={8} className={td}>
                    <span className="block h-5 animate-pulse bg-greenbar" />
                  </td>
                </tr>
              ))
            : rows.map((m) => (
                <tr
                  key={m.meter_id}
                  onMouseEnter={() => void prefetch(m.meter_id)}
                  onClick={() => navigate(paths.meter(m.meter_id))}
                  className="cursor-pointer border-b border-rule/60 transition-colors hover:bg-form-wash"
                >
                  <th scope="row" className={cn(td, 'text-left font-normal')}>
                    <Link
                      to={paths.meter(m.meter_id)}
                      onFocus={() => void prefetch(m.meter_id)}
                      onClick={(e) => e.stopPropagation()}
                      className="data text-base whitespace-nowrap text-ink no-underline hover:underline"
                    >
                      {m.meter_id}
                    </Link>
                  </th>
                  <td className={td}>
                    <StatusMark status={m.status} />
                  </td>
                  <td className={cn(td, 'data text-right whitespace-nowrap')}>{formatKwh(m.consumption_kwh)}</td>
                  <td className={cn(td, 'data hidden text-right whitespace-nowrap text-ink-muted md:table-cell')}>
                    {formatKwh(m.baseline_kwh)}
                  </td>
                  <td className={cn(td, 'text-right')}>
                    <Variation value={m.variation_pct} />
                  </td>
                  <td className={cn(td, 'hidden sm:table-cell')}>
                    <SeverityMark severity={m.severity} />
                  </td>
                  <td className={cn(td, 'hidden text-ink-muted lg:table-cell')}>
                    {m.anomaly_type ? anomalyTypeLabel[m.anomaly_type] : '—'}
                  </td>
                  <td className={cn(td, 'data hidden whitespace-nowrap text-ink-muted xl:table-cell')}>
                    {formatPlantTime(m.last_reading_at)}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
