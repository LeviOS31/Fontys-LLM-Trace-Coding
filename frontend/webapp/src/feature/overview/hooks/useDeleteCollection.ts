import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { deleteCollection } from '../../../shared/api/traces.ts';
import type { TraceCollectionOverview } from '../../../shared/types/trace.ts';

type DeleteCollectionVariables = {
  projectId: string;
  projectVersionId: string;
  collectionId: string;
};

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteCollectionVariables>({
    mutationFn: ({ projectId, projectVersionId, collectionId }) =>
      deleteCollection(projectId, projectVersionId, collectionId),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(
        QUERY_KEYS.traces.collections(variables.projectVersionId),
        (old: TraceCollectionOverview[] | undefined) => {
          if (!old) return old;

          return old.filter(
            (collection) => collection.traceCollectionId !== variables.collectionId
          );
        }
      );

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.traces.collections(variables.projectVersionId),
      });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}
