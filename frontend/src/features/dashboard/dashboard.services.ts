import { api } from '@/lib/api-client'
import type { DashboardSummary } from '@/types/api.entities'

export const dashboardServices = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await api.get<DashboardSummary>('/dashboard/getSummary')
    return data
  },
}
