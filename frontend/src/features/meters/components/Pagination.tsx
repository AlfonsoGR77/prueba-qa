import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PaginationProps {
  page: number
  size: number
  count: number
  onPage: (page: number) => void
}

/** "11–12 de 12" con anterior / siguiente. */
export function Pagination({ page, size, count, onPage }: PaginationProps) {
  const pages = Math.max(1, Math.floor(count / size))
  const from = count === 0 ? 0 : (page - 1) * size + 1
  const to = Math.min(page * size, count)

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3 pt-3">
      <p className="text-sm text-ink-muted" aria-live="polite">
        <span className="data text-ink">
          {from}–{to}
        </span>{' '}
        de <span className="data text-ink">{count}</span> medidores
      </p>
      <div className="flex gap-2">
        <Button onClick={() => onPage(page - 1)} disabled={page <= 1}>
          <ChevronLeft aria-hidden className="size-4" />
          Anterior
        </Button>
        <Button onClick={() => onPage(page + 1)} disabled={page >= pages}>
          Siguiente
          <ChevronRight aria-hidden className="size-4" />
        </Button>
      </div>
    </nav>
  )
}
