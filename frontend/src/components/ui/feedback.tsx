import { AlertTriangle, Inbox, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

/** Bloque gris que ocupa el lugar del contenido mientras carga. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn('block animate-pulse rounded-md bg-greenbar', className)} />
}

/** Error con la causa y cómo recuperarse. */
export function ErrorState({ title = 'No se pudo cargar la información', message, onRetry }: {
  title?: string
  message: string
  onRetry?: () => void
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-critical/40 bg-critical-wash p-4">
      <p className="flex items-center gap-2 font-semibold text-critical">
        <AlertTriangle aria-hidden className="size-4" />
        {title}
      </p>
      <p className="text-sm text-ink">{message}</p>
      {onRetry ? (
        <Button onClick={onRetry}>
          <RotateCw aria-hidden className="size-4" />
          Reintentar
        </Button>
      ) : null}
    </div>
  )
}

/** Estado vacío que explica qué significa y qué hacer. */
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 p-6">
      <p className="flex items-center gap-2 font-semibold text-ink">
        <Inbox aria-hidden className="size-4 text-form" />
        {title}
      </p>
      {children ? <div className="max-w-prose text-sm text-ink-muted">{children}</div> : null}
      {action}
    </div>
  )
}
