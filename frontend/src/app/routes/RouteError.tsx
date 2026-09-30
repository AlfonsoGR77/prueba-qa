import { isRouteErrorResponse, useRouteError } from 'react-router'
import { ButtonLink } from '@/components/ui/Button'
import { paths } from '@/config/paths'

/** Error inesperado al renderizar o cargar una pantalla. */
export function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Error desconocido'

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-bold">Esta pantalla no pudo cargarse</h1>
      <p className="text-sm text-ink-muted">
        {message}. Si acabas de actualizar la app, recargar suele resolverlo; si no, vuelve al despacho.
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={() => window.location.reload()} className="h-10 bg-form px-4 text-sm font-semibold text-sheet">
          Recargar
        </button>
        <ButtonLink to={paths.dashboard}>Ir al despacho</ButtonLink>
      </div>
    </div>
  )
}
