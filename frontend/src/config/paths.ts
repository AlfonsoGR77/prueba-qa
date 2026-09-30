/** Rutas de la app en un solo lugar: nunca se escriben a mano en los links. */
export const paths = {
  login: '/login',
  dashboard: '/',
  meters: '/medidores',
  meter: (meterId: string) => `/medidores/${encodeURIComponent(meterId)}`,
  anomalies: '/anomalias',
  investigation: (meterId: string) => `/anomalias/${encodeURIComponent(meterId)}`,
} as const
