import { Check, Minus } from 'lucide-react'
import { Variation } from '@/components/ui/Variation'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { variableLabel } from '@/lib/labels'
import type { VariableChange } from '@/types/api.entities'

const th = 'form-label px-3 py-2 text-left font-semibold whitespace-nowrap'
const td = 'px-3 py-2.5'

/**
 * Cada variable durante la ventana contra su baseline en las MISMAS horas del
 * día. La columna "Cambió" responde la pregunta del enunciado: qué variables cambiaron.
 */
export function VariablesTable({ variables }: { variables: VariableChange[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Variables eléctricas durante la ventana contra su baseline</caption>
        <thead className="border-b border-rule">
          <tr>
            <th scope="col" className={th}>Variable</th>
            <th scope="col" className={cn(th, 'text-right')}>Baseline</th>
            <th scope="col" className={cn(th, 'text-right')}>Observado</th>
            <th scope="col" className={cn(th, 'hidden text-right sm:table-cell')}>Mín – máx</th>
            <th scope="col" className={cn(th, 'text-right')}>Cambio</th>
            <th scope="col" className={th}>Cambió</th>
          </tr>
        </thead>
        <tbody className="greenbar">
          {variables.map((v) => {
            const meta = variableLabel[v.variable]
            const fmt = (n: number) => `${formatNumber(n, meta.decimals)}${meta.unit ? ` ${meta.unit}` : ''}`
            return (
              <tr key={v.variable} className={cn('border-b border-rule/60', v.changed && 'font-medium')}>
                <th scope="row" className={cn(td, 'text-left font-semibold')}>
                  {meta.name}
                </th>
                <td className={cn(td, 'data text-right whitespace-nowrap text-ink-muted')}>{fmt(v.baseline)}</td>
                <td className={cn(td, 'data text-right whitespace-nowrap')}>{fmt(v.observed)}</td>
                <td className={cn(td, 'data hidden text-right whitespace-nowrap text-ink-muted sm:table-cell')}>
                  {formatNumber(v.min, meta.decimals)} – {formatNumber(v.max, meta.decimals)}
                </td>
                <td className={cn(td, 'text-right')}>
                  <Variation value={v.change_pct} />
                </td>
                <td className={td}>
                  {v.changed ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-form">
                      <Check aria-hidden className="size-4" strokeWidth={3} /> Sí
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-ink-muted">
                      <Minus aria-hidden className="size-4" /> No
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
