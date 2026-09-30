import { CalendarClock } from 'lucide-react'
import { formatPlantTime } from '@/lib/format'
import { eventTypeLabel } from '@/lib/labels'
import type { MeterEvent } from '@/types/api.entities'

/** Eventos operativos registrados (events.csv), con su tipo en español. */
export function EventList({ events, empty }: { events: MeterEvent[]; empty: string }) {
  if (events.length === 0) return <p className="text-sm text-ink-muted">{empty}</p>

  return (
    <ul className="flex flex-col divide-y divide-rule">
      {events.map((e) => (
        <li key={e.timestamp + e.type} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
          <CalendarClock aria-hidden className="mt-0.5 size-4 shrink-0 text-form" />
          <div className="min-w-0">
            <p className="text-sm">
              <span className="font-semibold">{eventTypeLabel[e.type]}</span>{' '}
              <span className="data text-ink-muted">· {formatPlantTime(e.timestamp)}</span>
            </p>
            <p className="text-sm text-ink-muted">{e.description}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
