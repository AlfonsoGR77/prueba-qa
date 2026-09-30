import { api } from '@/lib/api-client'
import type { AnalysisRun } from '@/types/api.entities'

export const analysisServices = {
  async start(): Promise<AnalysisRun> {
    const { data } = await api.post<AnalysisRun>('/ai/analyze')
    return data
  },
  async getLatest(): Promise<AnalysisRun> {
    const { data } = await api.get<AnalysisRun>('/ai/analysis/latest')
    return data
  },
  async getById(id: string): Promise<AnalysisRun> {
    const { data } = await api.get<AnalysisRun>(`/ai/analysis/${encodeURIComponent(id)}`)
    return data
  },
}
