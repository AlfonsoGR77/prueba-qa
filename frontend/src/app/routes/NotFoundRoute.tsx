import { ButtonLink } from '@/components/ui/Button'
import { paths } from '@/config/paths'

export function NotFoundRoute() {
  return (
    <div className="flex max-w-lg flex-col gap-3 py-10">
      <h1 className="text-2xl font-bold">Esta página no existe</h1>
      <p className="text-sm text-ink-muted">Revisa la dirección o vuelve al despacho para ver las órdenes emitidas.</p>
      <ButtonLink to={paths.dashboard} variant="primary" className="self-start">
        Ir al despacho
      </ButtonLink>
    </div>
  )
}
