import { Check, X } from 'lucide-react'
import { SegmentedMeter } from '@/components/ui/SegmentedMeter'
import { formatConfidence, formatNumber } from '@/lib/format'
import type { Anomaly } from '@/types/api.entities'

/** Las conclusiones que dependen de un evento reportado por una persona pesan ×0,9. */
const dependsOnEvent = (a: Anomaly) => a.type === 'EXPLAINABLE_ANOMALY' || a.type === 'FALSE_POSITIVE'

/**
 * Por qué la IA llegó a esa conclusión: cada señal con su peso y qué tanto se
 * cumple, y la cuenta completa de la confianza. Nada queda como caja negra.
 */
export function EvidenceChecks({ anomaly }: { anomaly: Anomaly }) {
  const checks = anomaly.evidence.checks
  const score = checks.reduce((sum, c) => sum + c.weight * c.strength, 0)
  const trust = dependsOnEvent(anomaly) ? 0.9 : 1

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-rule border-y border-rule">
        {checks.map((c) => {
          const full = c.strength >= 0.995
          const none = c.strength <= 0.005
          return (
            <li key={c.description} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 py-2.5">
              {/* Marca de la señal: ✓ se cumple, ✗ no se cumple, casilla llena a medias si se cumple en parte. */}
              <span
                aria-hidden
                className={
                  'relative mt-0.5 grid size-5 place-items-center overflow-hidden border ' +
                  (full ? 'border-form bg-form text-sheet' : none ? 'border-rule-strong text-ink-muted' : 'border-form')
                }
              >
                {full ? <Check className="size-3.5" strokeWidth={3} /> : null}
                {none ? <X className="size-3.5" /> : null}
                {!full && !none ? (
                  <span className="absolute inset-x-0 bottom-0 bg-form/70" style={{ height: `${c.strength * 100}%` }} />
                ) : null}
              </span>
              <span className="text-sm leading-5">{c.description}</span>
              <span className="data text-right text-sm whitespace-nowrap text-ink-muted">
                peso {formatNumber(c.weight, 2)} · <span className="text-ink">{formatNumber(c.strength * 100)} %</span>
              </span>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-form-wash px-3 py-2.5">
        <p className="data text-sm">
          0,5 + 0,45 × {formatNumber(score, 3)}
          {trust < 1 ? ' × 0,9' : ''} = {formatConfidence(anomaly.confidence)}
        </p>
        <SegmentedMeter value={anomaly.confidence} showValue="words" />
      </div>
      <p className="text-xs leading-5 text-ink-muted">
        Puntaje = suma de peso × cumplimiento de cada señal. La confianza va de 0,5 a 0,95: nunca llega a 1 porque siempre
        queda la validación en campo.
        {trust < 1 ? ' Se multiplica por 0,9 porque la conclusión depende de un evento reportado por una persona.' : ''}
      </p>
    </div>
  )
}
