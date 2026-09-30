import { api } from '@/lib/api-client'
import type { Anomaly } from '@/types/api.entities'

export const anomaliesServices = {
  async getAll(): Promise<Anomaly[]> {
    const { data } = await api.get<Anomaly[]>('/anomaly/getAll')
    return data
  },
}
