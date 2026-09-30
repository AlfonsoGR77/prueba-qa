import { Navigate } from 'react-router'
import { BrandMark } from '@/components/layout/AppShell'
import { paths } from '@/config/paths'
import { useAuth } from '@/features/auth/auth-context'
import { LoginForm } from '@/features/auth/components/LoginForm'

/**
 * Login: a la izquierda, qué hace el producto con los datos reales del
 * dataset; a la derecha, el formulario.
 */
export function LoginRoute() {
  const { state } = useAuth()
  if (state.status === 'authenticated') return <Navigate to={paths.dashboard} replace />

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="relative flex flex-col justify-between gap-10 overflow-hidden border-b border-rule bg-sheet bg-[radial-gradient(40rem_28rem_at_0%_100%,rgb(8_221_188/0.16),transparent_70%)] px-6 py-8 sm:px-10 lg:border-r lg:border-b-0 lg:px-14 lg:py-12">
        <BrandMark />
        <div className="max-w-xl">
          <h1 className="text-[2.25rem] leading-[1.1] font-bold tracking-[-0.03em] text-balance sm:text-[3rem]">
            Cada anomalía, una orden de trabajo{' '}
            <span className="bg-gradient-to-r from-form to-form-strong bg-clip-text text-transparent">con su evidencia.</span>
          </h1>
          <p className="mt-4 max-w-[52ch] text-base leading-7 text-ink-muted">
            EnergIA analiza las lecturas horarias de tus medidores, separa los cambios reales de los explicables y de
            los problemas de datos, y te dice cuál revisar primero y qué hacer.
          </p>
        </div>
        <dl className="grid max-w-xl grid-cols-3 gap-3">
          {[
            ['12', 'medidores'],
            ['4.032', 'lecturas horarias'],
            ['14', 'días de datos'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl border border-rule bg-paper/60 px-4 py-3">
              <dt className="sr-only">{label}</dt>
              <dd className="data text-2xl text-form">{value}</dd>
              <dd className="text-xs text-ink-muted">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="card border-form/40">
            <div className="px-6 py-7">
              <h2 className="text-xl font-bold">Iniciar sesión</h2>
              <p className="mt-1 mb-6 text-sm text-ink-muted">Entra con tu cuenta para ver el estado de tus medidores.</p>
              <LoginForm />
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-ink-muted">
            Desarrollado por <span className="font-medium text-ink">Andrés Felipe Gacharná</span> para{' '}
            <span className="font-medium text-form">Bia Energy</span>
          </p>
        </div>
      </section>
    </div>
  )
}
