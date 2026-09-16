import { useInfiniteQuery } from '@tanstack/react-query';
import { getTraces } from '../../../shared/api/traces.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';

const PAGE_SIZE = 20;

export function useTraceGroupSummaryList(
  projectId: string,
  projectVersionId: string,
  search: string,
  hasNoOpenCode: boolean,
  traceCollectionId?: string
) {
  const effectiveTraceCollectionId = traceCollectionId === 'All' ? undefined : traceCollectionId;

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.traces.list({
      projectId,
      projectVersionId,
      search,
      traceCollectionId: effectiveTraceCollectionId,
      hasNoOpenCode,
    }),
    queryFn: ({ pageParam = 1 }) =>
      getTraces(projectId, {
        projectVersionId,
        page: pageParam,
        pageSize: PAGE_SIZE,
        filters: [
          ...(search === '' ? [] : [`search:${search}`]),
          ...(effectiveTraceCollectionId ? [`tracecollection:${effectiveTraceCollectionId}`] : []),
          ...(hasNoOpenCode ? [`hasNoOpenCode`] : []),
        ],
      }),
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled: !!projectId && !!projectVersionId,
  });
}
