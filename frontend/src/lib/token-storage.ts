/**
 * Dónde vive el JWT. localStorage puede fallar (modo privado, cuota), así que
 * todo acceso va en try/catch y el resto de la app nunca toca localStorage directo.
 */
const KEY = 'energyai.token'

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(KEY, token)
    } catch {
      // Sin almacenamiento la sesión dura lo que dure la pestaña.
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(KEY)
    } catch {
      // nada que limpiar
    }
  },
}
