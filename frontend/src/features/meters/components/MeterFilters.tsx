import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { SelectField } from '@/components/ui/inputs'
import { cn } from '@/lib/cn'
import type { MeterParams, MeterSortField, MeterStatus } from '@/types/api.entities'
import type { MeterFilterState } from '../hooks/useMeterFilters'

interface MeterFiltersProps {
  params: MeterParams | undefined
  filters: MeterFilterState
  onChange: (patch: Partial<MeterFilterState>) => void
}

const statusTabs: { id: MeterStatus | ''; label: string }[] = [
  { id: '', label: 'Todos' },
  { id: 'NORMAL', label: 'Normales' },
  { id: 'ALERT', label: 'Alertas' },
  { id: 'CRITICAL', label: 'Críticas' },
]

/**
 * Barra de filtros: estado (todos, normales, alertas, críticas), búsqueda por
 * meter_id con sugerencias de getParams, y orden por consumo, variación o severidad.
 */
export function MeterFilters({ params, filters, onChange }: MeterFiltersProps) {
  // El texto se aplica al enviar (Enter o botón) o al elegir una sugerencia,
  // no en cada tecla: evita una petición por letra.
  const [search, setSearch] = useState(filters.meterId)

  function onSearch(event: FormEvent) {
    event.preventDefault()
    onChange({ meterId: search.trim() })
  }

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-4 card overflow-visible p-4">
      <fieldset className="flex flex-col gap-1">
        <legend className="form-label mb-1">Estado</legend>
        <div className="flex overflow-hidden rounded-lg border border-rule-strong">
          {statusTabs.map((tab) => {
            const active = filters.status === tab.id
            return (
              <label
                key={tab.label}
                className={cn(
                  'relative cursor-pointer border-r border-rule-strong px-3 py-2 text-sm last:border-r-0 transition-colors duration-150',
                  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-form',
                  active ? 'bg-form font-semibold text-sheet' : 'bg-sheet text-ink hover:bg-form-wash',
                )}
              >
                <input
                  type="radio"
                  name="estado"
                  value={tab.id}
                  checked={active}
                  onChange={() => onChange({ status: tab.id })}
                  className="sr-only"
                />
                {tab.label}
              </label>
            )
          })}
        </div>
      </fieldset>

      <form role="search" onSubmit={onSearch} className="flex min-w-[14rem] flex-1 flex-col gap-1 sm:max-w-xs">
        <label htmlFor="meter-search" className="form-label">
          Medidor
        </label>
        <div className="flex">
          <input
            id="meter-search"
            list="meter-options"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              // Elegir una sugerencia del datalist aplica el filtro de una vez.
              if (params?.meters.some((m) => m.id === e.target.value)) onChange({ meterId: e.target.value })
              if (e.target.value === '') onChange({ meterId: '' })
            }}
            placeholder="M-109"
            autoComplete="off"
            className="data h-10 w-full rounded-l-lg border border-r-0 border-rule-strong bg-sheet px-3 text-sm placeholder:text-ink-muted hover:border-form focus-visible:border-form"
          />
          <datalist id="meter-options">
            {params?.meters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.value}
              </option>
            ))}
          </datalist>
          <button
            type="submit"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-r-lg border border-rule-strong bg-sheet text-form hover:border-form hover:bg-form-wash"
            aria-label="Buscar medidor"
          >
            <Search aria-hidden className="size-4" />
          </button>
        </div>
      </form>

      <div className="flex items-end gap-2">
        <SelectField
          id="sort-by"
          label="Ordenar por"
          value={filters.sortBy}
          onChange={(e) => onChange({ sortBy: e.target.value as MeterSortField })}
          className="w-full min-w-36 sm:w-44"
        >
          {(params?.sort_fields ?? [{ id: 'meter_id', value: 'Medidor' }]).map((o) => (
            <option key={o.id} value={o.id}>
              {o.value}
            </option>
          ))}
        </SelectField>
        <button
          type="button"
          onClick={() => onChange({ sortOrder: filters.sortOrder === 'ASC' ? 'DESC' : 'ASC' })}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-rule-strong bg-sheet px-3 text-sm whitespace-nowrap text-form hover:border-form hover:bg-form-wash"
          aria-label={`Dirección: ${filters.sortOrder === 'ASC' ? 'de menor a mayor' : 'de mayor a menor'}. Cambiar`}
        >
          {filters.sortOrder === 'ASC' ? (
            <ArrowUpNarrowWide aria-hidden className="size-4" />
          ) : (
            <ArrowDownWideNarrow aria-hidden className="size-4" />
          )}
          {filters.sortOrder === 'ASC' ? 'Menor a mayor' : 'Mayor a menor'}
        </button>
      </div>
    </div>
  )
}
