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
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.traces.list({
      projectId,
      projectVersionId,
      search,
      traceCollectionId,
      hasNoOpenCode,
    }),
    queryFn: ({ pageParam = 1 }) =>
      getTraces(projectId, {
        projectVersionId,
        page: pageParam,
        pageSize: PAGE_SIZE,
        filters: [
          ...(search === '' ? [] : [`search:${search}`]),
          ...(traceCollectionId ? [`tracecollection:${traceCollectionId}`] : []),
          ...(hasNoOpenCode ? [`hasNoOpenCode`] : []),
        ],
      }),
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled: !!projectId && !!projectVersionId,
  });
}
