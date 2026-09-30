import { api } from '@/lib/api-client'
import type { MeterDetail, MeterPagedRequest, MeterParams, MeterSummary, PaginatedResult } from '@/types/api.entities'

/** Llamadas HTTP de medidores. Mismos nombres que los endpoints del backend. */
export const metersServices = {
  async getParams(): Promise<MeterParams> {
    const { data } = await api.get<MeterParams>('/meter/getParams')
    return data
  },

  async getAll(request: MeterPagedRequest): Promise<PaginatedResult<MeterSummary>> {
    const { data } = await api.post<PaginatedResult<MeterSummary>>('/meter/getAll', request)
    return data
  },

  async getById(meterId: string): Promise<MeterDetail> {
    const { data } = await api.get<MeterDetail>(`/meter/getById/${encodeURIComponent(meterId)}`)
    return data
  },
}
