import type { ReactNode } from 'react'

/** Título de la pantalla con su contexto a la derecha. */
export function PageHeader({ title, description, aside }: { title: ReactNode; description?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] leading-9 font-bold tracking-[-0.02em] text-balance [font-stretch:92%]">{title}</h1>
        {description ? <p className="mt-1 max-w-[70ch] text-sm text-ink-muted">{description}</p> : null}
      </div>
      {aside ? <div className="flex flex-wrap items-center gap-3">{aside}</div> : null}
    </div>
  )
}
