import { api } from '@/lib/api-client'
import type { TokenResponse, User } from '@/types/api.entities'

/** Llamadas HTTP de autenticación. */
export const authServices = {
  async login(email: string, password: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/login', { email, password })
    return data
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/auth/me')
    return data
  },
}
