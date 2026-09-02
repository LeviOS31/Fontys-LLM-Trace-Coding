import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { getTraceCollections } from '../../../shared/api/traces.ts';

export function useGetTraceCollections(
  projectId: string | undefined,
  versionId: string | undefined
) {
  const enabled = !!projectId && !!versionId;

  return useQuery({
    queryKey: enabled ? QUERY_KEYS.traces.collections(versionId) : ['traceCollections', 'disabled'],
    queryFn: enabled ? () => getTraceCollections(projectId, versionId) : undefined,
    enabled,
  });
}
