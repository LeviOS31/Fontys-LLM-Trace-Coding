import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editTraceCollection } from '../../../shared/api/traces.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';

type EditTraceCollectionPayload = {
  projectId: string;
  projectVersionId: string;
  collectionId: string;
  name: string;
};

export function useEditTraceCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EditTraceCollectionPayload) =>
      editTraceCollection(
        payload.projectId,
        payload.projectVersionId,
        payload.collectionId,
        payload.name
      ),

    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.traces.collections(variables.projectVersionId),
      });
    },
  });
}
