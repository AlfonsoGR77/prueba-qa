import { ChevronsUp, ChevronUp, Minus } from 'lucide-react'
import type { Severity } from '@/types/api.entities'
import { severityLabel } from '@/lib/labels'
import { cn } from '@/lib/cn'

const icon = { HIGH: ChevronsUp, MEDIUM: ChevronUp, LOW: Minus } as const
const tone = { HIGH: 'text-critical', MEDIUM: 'text-alert', LOW: 'text-ink-muted' } as const

/** Severidad con forma (flechas) y texto: se entiende sin distinguir colores. */
export function SeverityMark({ severity }: { severity: Severity | null }) {
  if (!severity) return <span className="text-ink-muted">—</span>
  const Icon = icon[severity]
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm font-medium', tone[severity])}>
      <Icon aria-hidden className="size-4" strokeWidth={2.25} />
      {severityLabel[severity]}
    </span>
  )
}
