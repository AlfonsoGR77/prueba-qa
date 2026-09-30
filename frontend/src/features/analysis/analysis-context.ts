import { createContext, use } from 'react'

/**
 * Estado compartido del análisis: el botón (en la barra superior) lo inicia y
 * la hoja de pasos (debajo de la barra) lo muestra. Ninguno sabe cómo se
 * guarda; solo usan state y actions.
 * El componente que la implementa es AnalysisProvider.tsx.
 */
export interface AnalysisContextValue {
  state: {
    runId: string | null
    open: boolean
    starting: boolean
    error: string | null
  }
  actions: {
    run: () => void
    close: () => void
  }
}

export const AnalysisContext = createContext<AnalysisContextValue | null>(null)

export function useAnalysis(): AnalysisContextValue {
  const ctx = use(AnalysisContext)
  if (!ctx) throw new Error('useAnalysis debe usarse dentro de <AnalysisProvider>')
  return ctx
}
