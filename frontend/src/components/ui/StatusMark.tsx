import type { MeterStatus } from '@/types/api.entities'
import { statusLabel } from '@/lib/labels'
import { Stamp } from './Stamp'

interface StatusMarkProps {
  status: MeterStatus
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Estado de alerta de un medidor. Crítica y Alerta llevan sello; Normal va en
 * texto quieto, sin sello: la interfaz solo levanta la voz cuando importa.
 */
export function StatusMark({ status, size = 'sm' }: StatusMarkProps) {
  if (status === 'CRITICAL') {
    return (
      <Stamp tone="critical" size={size}>
        {statusLabel.CRITICAL}
      </Stamp>
    )
  }
  if (status === 'ALERT') {
    return (
      <Stamp tone="alert" size={size}>
        {statusLabel.ALERT}
      </Stamp>
    )
  }
  return <span className="text-sm text-ink-muted">{statusLabel.NORMAL}</span>
}
