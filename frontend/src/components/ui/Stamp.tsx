import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type StampTone = 'critical' | 'alert' | 'neutral'

const toneClass: Record<StampTone, string> = {
  critical: 'bg-critical-wash text-critical border-critical/40',
  alert: 'bg-alert-wash text-alert border-alert/40',
  // Neutro: "No escalar" y similares.
  neutral: 'bg-greenbar text-ink-muted border-rule-strong',
}

interface StampProps {
  tone: StampTone
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Etiqueta de estado en forma de pill: el estado es una marca, no solo un
 * color. Siempre lleva texto y un punto. Entra con una animación corta.
 */
export function Stamp({ tone, children, size = 'md', className }: StampProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border font-sans font-semibold animate-stamp select-none',
        "before:size-1.5 before:rounded-full before:bg-current before:content-['']",
        size === 'sm' && 'px-2 py-px text-xs leading-5',
        size === 'md' && 'px-2.5 py-0.5 text-xs leading-5',
        size === 'lg' && 'px-3.5 py-1 text-sm',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
