import { queryOptions, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { anomaliesServices } from './anomalies.services'

export const anomalyListQuery = () =>
  queryOptions({ queryKey: queryKeys.anomalies.list(), queryFn: anomaliesServices.getAll })

export function useAnomalies() {
  return useQuery(anomalyListQuery())
}

/**
 * Una anomalía por medidor, leída de la misma lista:
 * no hay un endpoint extra y la investigación abre al instante si la lista ya está en caché.
 */
export function useAnomaly(meterId: string) {
  return useQuery({
    ...anomalyListQuery(),
    select: (anomalies) => anomalies.find((a) => a.meter_id === meterId) ?? null,
  })
}
