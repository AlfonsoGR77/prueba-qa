import { keepPreviousData, queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { queryKeys } from '@/lib/query-keys'
import type { MeterPagedRequest } from '@/types/api.entities'
import { metersServices } from './meters.services'

export const meterParamsQuery = () =>
  queryOptions({ queryKey: queryKeys.meters.params(), queryFn: metersServices.getParams, staleTime: Infinity })

export const meterListQuery = (request: MeterPagedRequest) =>
  queryOptions({ queryKey: queryKeys.meters.list(request), queryFn: () => metersServices.getAll(request) })

export const meterDetailQuery = (meterId: string) =>
  queryOptions({ queryKey: queryKeys.meters.detail(meterId), queryFn: () => metersServices.getById(meterId) })

export function useMeterParams() {
  return useQuery(meterParamsQuery())
}

/**
 * Lista de medidores. placeholderData mantiene la página anterior mientras
 * llega la nueva: cambiar un filtro no parpadea.
 */
export function useMeterList(request: MeterPagedRequest) {
  return useQuery({ ...meterListQuery(request), placeholderData: keepPreviousData })
}

export function useMeterDetail(meterId: string) {
  return useQuery(meterDetailQuery(meterId))
}

/**
 * Precarga el detalle cuando el usuario muestra intención (hover o foco en la
 * fila): al hacer clic, el detalle ya está en caché.
 */
export function usePrefetchMeter() {
  const queryClient = useQueryClient()
  return useCallback((meterId: string) => queryClient.prefetchQuery(meterDetailQuery(meterId)), [queryClient])
}
