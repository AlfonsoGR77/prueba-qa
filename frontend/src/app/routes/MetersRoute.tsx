import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { MeterFilters } from '@/features/meters/components/MeterFilters'
import { MeterLedger } from '@/features/meters/components/MeterLedger'
import { Pagination } from '@/features/meters/components/Pagination'
import { PAGE_SIZE, useMeterFilters } from '@/features/meters/hooks/useMeterFilters'
import { useMeterList, useMeterParams } from '@/features/meters/meters.queries'
import { ApiError } from '@/lib/api-client'

/** Gestión de medidores: filtros por estado, búsqueda por meter_id y orden. */
export function MetersRoute() {
  const { filters, request, update } = useMeterFilters()
  const params = useMeterParams()
  const list = useMeterList(request)

  const hasFilters = filters.meterId !== '' || filters.status !== ''

  return (
    <>
      <PageHeader
        title="Libro de medidores"
        description="Consumo de las últimas 24 h contra el consumo diario normal (baseline). Haz clic en un medidor para ver su detalle."
      />

      <MeterFilters
        // key: si la URL cambia desde afuera (atrás/adelante), el buscador se reinicia con el valor nuevo.
        key={filters.meterId}
        params={params.data}
        filters={filters}
        onChange={update}
      />

      <div className="mt-4">
        {list.isError ? (
          <ErrorState message={ApiError.from(list.error).message} onRetry={() => void list.refetch()} />
        ) : list.data && list.data.count === 0 ? (
          <div className="card">
            <EmptyState
              title="Ningún medidor coincide con los filtros"
              action={
                hasFilters ? (
                  <Button onClick={() => update({ meterId: '', status: '' })}>Quitar filtros</Button>
                ) : undefined
              }
            >
              {filters.meterId
                ? `No hay medidores que contengan "${filters.meterId}"${filters.status ? ' con ese estado' : ''}.`
                : 'No hay medidores con ese estado en este momento.'}
            </EmptyState>
          </div>
        ) : (
          <>
            <MeterLedger
              rows={list.data?.rows ?? []}
              loadingRows={list.isPending ? PAGE_SIZE : 0}
              dimmed={list.isPlaceholderData}
              caption="Medidores filtrados"
            />
            {list.data ? (
              <Pagination
                page={list.data.page}
                size={list.data.size}
                count={list.data.count}
                onPage={(page) => update({ page })}
              />
            ) : null}
          </>
        )}
      </div>
    </>
  )
}
