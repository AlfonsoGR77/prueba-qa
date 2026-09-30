import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const control =
  'h-10 w-full rounded-lg border border-rule-strong bg-sheet px-3 text-sm text-ink placeholder:text-ink-muted transition-colors duration-150 hover:border-form focus-visible:border-form aria-[invalid=true]:border-critical'

interface LabeledProps {
  label: string
  hint?: ReactNode
  error?: string
  id: string
}

/** Casilla de texto con etiqueta preimpresa arriba. */
export function TextField({ label, hint, error, id, className, ...props }: LabeledProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(control, 'data')}
        {...props}
      />
      {error ? (
        <span id={`${id}-error`} className="text-xs text-critical">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </span>
      ) : null}
    </div>
  )
}

/** Desplegable nativo (teclado y lectores de pantalla funcionan solos). */
export function SelectField({ label, id, className, children, ...props }: Omit<LabeledProps, 'hint' | 'error'> & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <select
        id={id}
        className={cn(
          control,
          'appearance-none bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat pr-8',
          "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%2308ddbc' stroke-width='1.5'/%3E%3C/svg%3E\")]",
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
