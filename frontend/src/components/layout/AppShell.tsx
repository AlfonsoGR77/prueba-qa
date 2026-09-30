import type { ReactNode } from 'react'
import { LogOut, Zap } from 'lucide-react'
import { NavLink } from 'react-router'
import { paths } from '@/config/paths'
import { cn } from '@/lib/cn'

const nav = [
  { to: paths.dashboard, label: 'Despacho', end: true },
  { to: paths.meters, label: 'Medidores', end: false },
  { to: paths.anomalies, label: 'Anomalías IA', end: false },
]

/** Marca tipográfica: no hay logo, así que el nombre es la marca. */
export function BrandMark({ tone = 'default' }: { tone?: 'default' | 'inverse' }) {
  return (
    <span className={cn('flex items-center gap-2', tone === 'inverse' && 'text-sheet')}>
      <span className={cn('grid size-8 place-items-center rounded-lg', tone === 'inverse' ? 'bg-sheet text-form' : 'bg-form text-sheet')}>
        <Zap aria-hidden className="size-4 fill-current" />
      </span>
      <span className="text-[1.0625rem] font-bold tracking-[-0.02em]">
        EnergIA
      </span>
    </span>
  )
}

interface AppShellProps {
  /** Acción principal de la barra (Run AI Analysis). */
  action: ReactNode
  /** Panel que se despliega bajo la barra (la hoja del análisis). */
  panel: ReactNode
  userName: string
  onLogout: () => void
  children: ReactNode
}

/**
 * Estructura de todas las pantallas con sesión: barra de despacho arriba,
 * panel del análisis debajo y el contenido. Recibe las piezas por props
 * (composición): el layout no importa features.
 */
export function AppShell({ action, panel, userName, onLogout, children }: AppShellProps) {
  return (
    <div className="min-h-dvh">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-sheet focus:px-3 focus:py-2"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[88rem] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
          <BrandMark />
          <nav aria-label="Principal" className="order-last -mx-1 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                    isActive ? 'bg-form-wash font-semibold text-form' : 'text-ink-muted hover:bg-greenbar hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {action}
            <span className="hidden text-sm text-ink-muted lg:inline">{userName}</span>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex size-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-form-wash hover:text-form"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      </header>
      {panel}
      <main id="contenido" className="mx-auto max-w-[88rem] px-4 pt-6 pb-16 sm:px-6">
        {children}
      </main>
    </div>
  )
}
