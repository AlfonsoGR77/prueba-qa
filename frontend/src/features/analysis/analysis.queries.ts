import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { queryKeys } from '@/lib/query-keys'
import { analysisServices } from './analysis.services'

/** Botón Run AI Analysis: inicia el análisis y deja el run en caché. */
export function useStartAnalysis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: analysisServices.start,
    onSuccess: (run) => {
      queryClient.setQueryData(queryKeys.analysis.run(run.id), run)
      queryClient.setQueryData(queryKeys.analysis.latest(), run)
    },
  })
}

const POLL_MS = 400

/**
 * Sigue un análisis haciendo polling mientras está RUNNING. Cuando termina,
 * invalida lo que el análisis pudo cambiar:
 * dashboard, medidores y anomalías traen los textos nuevos.
 */
export function useAnalysisRun(id: string | null) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.analysis.run(id ?? ''),
    queryFn: () => analysisServices.getById(id ?? ''),
    enabled: id !== null,
    staleTime: 0,
    refetchInterval: (q) => (q.state.data?.status === 'RUNNING' ? POLL_MS : false),
  })

  const status = query.data?.status
  useEffect(() => {
    if (status !== 'COMPLETED') return
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.meters.all() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.anomalies.all() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.analysis.latest() })
  }, [status, queryClient])

  return query
}

/** Último análisis (el de la barra de despacho). */
export function useLatestAnalysis() {
  return useQuery({ queryKey: queryKeys.analysis.latest(), queryFn: analysisServices.getLatest })
}
