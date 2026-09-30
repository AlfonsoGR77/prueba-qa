import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api-client'

/**
 * Defaults: los datos solo cambian cuando alguien corre
 * un análisis, y en ese momento se invalidan a mano. Por eso un staleTime largo
 * y sin refetch al volver a la pestaña.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      // Reintentar un 4xx no sirve (credenciales, filtros inválidos, 404).
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
    },
  },
})
