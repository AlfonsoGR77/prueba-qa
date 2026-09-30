/* eslint-disable react-refresh/only-export-components -- compound component (Field.Label, Sheet.Header): se exporta un objeto a propósito; Fast Refresh recarga el archivo completo. */
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Casilla de formulario preimpreso: etiqueta arriba a la izquierda, valor
 * llenado a máquina debajo. Es un compound component: quien la usa decide
 * qué va adentro.
 *
 *   <Field>
 *     <Field.Label>Consumo 24 h</Field.Label>
 *     <Field.Value>2.207,6 kWh</Field.Value>
 *     <Field.Note>+109,8 % vs. baseline</Field.Note>
 *   </Field>
 */
function FieldRoot({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex min-w-0 flex-col gap-1 rounded-xl border border-rule bg-sheet px-3 pt-2 pb-2.5', className)}>{children}</div>
}

function FieldLabel({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <span id={id} className="form-label">
      {children}
    </span>
  )
}

function FieldValue({ children, size = 'md', className }: { children: ReactNode; size?: 'md' | 'lg' | 'xl'; className?: string }) {
  return (
    <span
      className={cn(
        'data truncate text-ink',
        size === 'md' && 'text-lg leading-6',
        size === 'lg' && 'text-2xl leading-8',
        size === 'xl' && 'text-[2rem] leading-10',
        className,
      )}
    >
      {children}
    </span>
  )
}

function FieldNote({ children }: { children: ReactNode }) {
  return <span className="text-xs leading-4 text-ink-muted">{children}</span>
}

export const Field = Object.assign(FieldRoot, {
  Label: FieldLabel,
  Value: FieldValue,
  Note: FieldNote,
})
