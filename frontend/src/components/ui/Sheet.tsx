/* eslint-disable react-refresh/only-export-components -- compound component (Field.Label, Sheet.Header): se exporta un objeto a propósito; Fast Refresh recarga el archivo completo. */
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Hoja del formulario: una sección con encabezado sobre una regla verde.
 *
 *   <Sheet>
 *     <Sheet.Header title="Variables que cambiaron" actions={...} />
 *     <Sheet.Body>...</Sheet.Body>
 *   </Sheet>
 */
function SheetRoot({ children, className, as: Tag = 'section', labelledBy }: {
  children: ReactNode
  className?: string
  as?: 'section' | 'article' | 'div'
  labelledBy?: string
}) {
  return (
    <Tag aria-labelledby={labelledBy} className={cn('card', className)}>
      {children}
    </Tag>
  )
}

function SheetHeader({ title, id, note, actions, level = 2 }: {
  title: ReactNode
  id?: string
  note?: ReactNode
  actions?: ReactNode
  level?: 2 | 3
}) {
  const Heading = level === 2 ? 'h2' : 'h3'
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-rule px-4 pt-3 pb-2">
      <div className="min-w-0">
        <Heading id={id} className="text-[0.9375rem] font-semibold tracking-[-0.005em] text-ink">
          {title}
        </Heading>
        {note ? <p className="mt-0.5 text-xs text-ink-muted">{note}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}

function SheetBody({ children, className, flush = false }: { children: ReactNode; className?: string; flush?: boolean }) {
  return <div className={cn(flush ? '' : 'p-4', className)}>{children}</div>
}

export const Sheet = Object.assign(SheetRoot, {
  Header: SheetHeader,
  Body: SheetBody,
})
