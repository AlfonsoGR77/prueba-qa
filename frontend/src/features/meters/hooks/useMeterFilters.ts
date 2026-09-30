import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { MeterPagedRequest, MeterSortField, MeterStatus, SortOrder } from '@/types/api.entities'

const STATUSES: MeterStatus[] = ['NORMAL', 'ALERT', 'CRITICAL']
const SORT_FIELDS: MeterSortField[] = ['meter_id', 'consumption', 'variation', 'severity']
export const PAGE_SIZE = 10

export interface MeterFilterState {
  meterId: string
  status: MeterStatus | ''
  sortBy: MeterSortField
  sortOrder: SortOrder
  page: number
}

/**
 * Convierte la URL (?estado=CRITICAL&orden=consumption&dir=DESC) en filtros
 * válidos. Es una función pura para poder probarla sin React.
 */
export function parseMeterFilters(params: URLSearchParams): MeterFilterState {
  const status = params.get('estado') ?? ''
  const sortBy = params.get('orden') ?? ''
  const page = Number(params.get('pagina'))
  return {
    meterId: params.get('medidor') ?? '',
    status: STATUSES.includes(status as MeterStatus) ? (status as MeterStatus) : '',
    sortBy: SORT_FIELDS.includes(sortBy as MeterSortField) ? (sortBy as MeterSortField) : 'meter_id',
    sortOrder: params.get('dir') === 'DESC' ? 'DESC' : 'ASC',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

/** Arma el body de POST /meter/getAll a partir de los filtros. */
export function toPagedRequest(f: MeterFilterState): MeterPagedRequest {
  return {
    pagination: { page: f.page, size: PAGE_SIZE },
    filter: {
      ...(f.meterId ? { meter_id: f.meterId } : {}),
      ...(f.status ? { status: f.status } : {}),
      sort_by: f.sortBy,
      sort_order: f.sortOrder,
    },
  }
}

const paramName: Record<keyof MeterFilterState, string> = {
  meterId: 'medidor',
  status: 'estado',
  sortBy: 'orden',
  sortOrder: 'dir',
  page: 'pagina',
}

/**
 * Los filtros viven en la URL: se pueden compartir, sobreviven a un recargo y
 * el botón atrás funciona. Cambiar cualquier filtro vuelve a la página 1.
 */
export function useMeterFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseMeterFilters(params), [params])
  const request = useMemo(() => toPagedRequest(filters), [filters])

  const update = useCallback(
    (patch: Partial<MeterFilterState>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const merged = { ...parseMeterFilters(prev), ...patch }
          if (!('page' in patch)) merged.page = 1
          for (const key of Object.keys(paramName) as (keyof MeterFilterState)[]) {
            const value = String(merged[key])
            const isDefault =
              value === '' ||
              (key === 'sortBy' && value === 'meter_id') ||
              (key === 'sortOrder' && value === 'ASC') ||
              (key === 'page' && value === '1')
            if (isDefault) next.delete(paramName[key])
            else next.set(paramName[key], value)
          }
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  return { filters, request, update }
}
