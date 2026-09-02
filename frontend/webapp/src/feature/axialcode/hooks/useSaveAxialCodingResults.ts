import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveAxialCodingResults } from '../../../shared/api/axialCode.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';

export const useSaveAxialCodingResults = (
  projectId: string,
  projectVersionId: string,
  enabled: boolean = true
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (axialCodingResultId: string) => {
      if (!enabled) {
        return Promise.reject(new Error('Axial code saving is disabled.'));
      }

      return saveAxialCodingResults(projectId, projectVersionId, axialCodingResultId);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.axialCoding.currentAxialCodesOfVersion(projectVersionId),
      });
    },

    onError: (error) => {
      console.error(error);
    },
  });
};
