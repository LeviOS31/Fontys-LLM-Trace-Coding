import { useQuery } from '@tanstack/react-query';
import { getTraceGroup } from '../../../shared/api/traces.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';

export function useTraceGroup(
  projectId: string,
  traceGroupId: string | null,
  projectVersionId: string
) {
  return useQuery({
    queryKey: QUERY_KEYS.traces.detail(traceGroupId ?? ''),
    queryFn: () => getTraceGroup(projectId, projectVersionId, traceGroupId ?? ''),
    enabled: !!projectId && !!projectVersionId && !!traceGroupId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
