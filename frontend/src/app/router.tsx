import { createBrowserRouter } from 'react-router'
import { paths } from '@/config/paths'
import { AppLayout } from './routes/AppLayout'
import { RouteError } from './routes/RouteError'

/**
 * Cada pantalla se carga aparte (lazy): el login no descarga Recharts y el
 * dashboard no descarga la investigación.
 */
export const router = createBrowserRouter([
  {
    path: paths.login,
    lazy: async () => ({ Component: (await import('./routes/LoginRoute')).LoginRoute }),
  },
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./routes/DashboardRoute')).DashboardRoute }),
      },
      {
        path: paths.meters,
        lazy: async () => ({ Component: (await import('./routes/MetersRoute')).MetersRoute }),
      },
      {
        path: `${paths.meters}/:meterId`,
        lazy: async () => ({ Component: (await import('./routes/MeterDetailRoute')).MeterDetailRoute }),
      },
      {
        path: paths.anomalies,
        lazy: async () => ({ Component: (await import('./routes/AnomaliesRoute')).AnomaliesRoute }),
      },
      {
        path: `${paths.anomalies}/:meterId`,
        lazy: async () => ({ Component: (await import('./routes/InvestigationRoute')).InvestigationRoute }),
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('./routes/NotFoundRoute')).NotFoundRoute }),
      },
    ],
  },
])
