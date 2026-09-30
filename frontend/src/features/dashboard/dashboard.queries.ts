import { queryOptions, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { dashboardServices } from './dashboard.services'

/** queryOptions reutilizables: el hook y un prefetch comparten key y función. */
export const dashboardSummaryQuery = () =>
  queryOptions({ queryKey: queryKeys.dashboard.summary(), queryFn: dashboardServices.getSummary })

export function useDashboardSummary() {
  return useQuery(dashboardSummaryQuery())
}
