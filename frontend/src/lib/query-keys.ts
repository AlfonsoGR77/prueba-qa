import type { MeterPagedRequest } from '@/types/api.entities'

/**
 * Fábrica de query keys: una sola fuente para todas
 * las keys, jerárquicas (entidad → tipo → parámetros). Así invalidar ['meters']
 * refresca la lista y los detalles de un golpe, sin adivinar strings.
 */
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  dashboard: {
    all: () => ['dashboard'] as const,
    summary: () => ['dashboard', 'summary'] as const,
  },
  meters: {
    all: () => ['meters'] as const,
    params: () => ['meters', 'params'] as const,
    list: (request: MeterPagedRequest) => ['meters', 'list', request] as const,
    detail: (meterId: string) => ['meters', 'detail', meterId] as const,
  },
  anomalies: {
    all: () => ['anomalies'] as const,
    list: () => ['anomalies', 'list'] as const,
  },
  analysis: {
    all: () => ['analysis'] as const,
    latest: () => ['analysis', 'latest'] as const,
    run: (id: string) => ['analysis', 'run', id] as const,
  },
}
