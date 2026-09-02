import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { getProjectVersionStatistics } from '../../../shared/api/statistics.ts';

export function useVersionStatistics(projectId: string, versionId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.statistics.version(projectId, versionId),
    queryFn: () => getProjectVersionStatistics(projectId, versionId),
    enabled: Boolean(projectId && versionId),
    staleTime: 30 * 1000,
  });
}
