import axios, { AxiosError } from 'axios'
import type { ApiErrorBody } from '@/types/api.entities'
import { tokenStorage } from './token-storage'

/**
 * Instancia única de axios para la API en Go. En desarrollo, Vite reenvía
 * /api al backend (ver vite.config.ts).
 */
export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Se dispara cuando la API responde 401: el AuthProvider cierra la sesión. */
export const UNAUTHORIZED_EVENT = 'energyai:unauthorized'

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = ApiError.from(error)
    if (apiError.status === 401 && !apiError.path.endsWith('/auth/login')) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    return Promise.reject(apiError)
  },
)

/** Error de la API con el formato del backend: { status_code, message, errors }. */
export class ApiError extends Error {
  readonly status: number
  readonly details: string[]
  readonly path: string

  constructor(status: number, message: string, details: string[] = [], path = '') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    this.path = path
  }

  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error
    if (error instanceof AxiosError) {
      const body = error.response?.data as Partial<ApiErrorBody> | undefined
      if (error.response) {
        return new ApiError(
          error.response.status,
          body?.message ?? error.message,
          body?.errors ?? [],
          body?.path ?? error.config?.url ?? '',
        )
      }
      return new ApiError(0, 'No hay conexión con el servidor. Revisa que el backend esté corriendo.')
    }
    return new ApiError(0, error instanceof Error ? error.message : 'Error inesperado')
  }
}
