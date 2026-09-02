import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importTraceCollection } from '../../../shared/api/traces.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import type { ImportTraceCollectionDto } from '../../../shared/types/trace.dto.ts';

function isProjectVersionTraceListQueryKey(
  queryKey: readonly unknown[],
  projectVersionId: string
): boolean {
  if (queryKey[0] !== 'trace-lists') return false;

  const maybeQuery = queryKey[1];
  if (!maybeQuery || typeof maybeQuery !== 'object') return false;

  return (
    'projectVersionId' in maybeQuery &&
    (maybeQuery as { projectVersionId?: string }).projectVersionId === projectVersionId
  );
}

export function useImportTraceCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ImportTraceCollectionDto) => importTraceCollection(payload),
    onSuccess: async (_data, variables) => {
      // Reset trace list queries for this version and immediately refetch active observers.
      // This updates list + stats counters (totalCount) without page reload.
      await queryClient.resetQueries({
        predicate: (query) =>
          isProjectVersionTraceListQueryKey(query.queryKey, variables.projectVersionId),
      });

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.traces.collections(variables.projectVersionId),
      });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}
