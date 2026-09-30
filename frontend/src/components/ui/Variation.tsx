import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { formatPct } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * Variación porcentual con flecha. El texto queda acromático (el estado lo
 * dan los sellos); la flecha solo ayuda a leer la dirección de un vistazo.
 * Menos de ±5 % se considera estable.
 */
export function Variation({ value, className }: { value: number; className?: string }) {
  const Icon = value >= 5 ? ArrowUpRight : value <= -5 ? ArrowDownRight : ArrowRight
  return (
    <span className={cn('data inline-flex items-center gap-1 whitespace-nowrap', className)}>
      <Icon aria-hidden className="size-3.5 text-form" strokeWidth={2.25} />
      {formatPct(value)}
    </span>
  )
}
