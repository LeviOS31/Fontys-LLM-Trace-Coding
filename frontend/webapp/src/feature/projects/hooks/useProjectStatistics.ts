import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { getProjectStatistics } from '../../../shared/api/statistics.ts';

export function useProjectStatistics(projectId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.statistics.project(projectId),
    queryFn: () => getProjectStatistics(projectId),
    enabled: Boolean(projectId),
    staleTime: 30 * 1000,
  });
}
