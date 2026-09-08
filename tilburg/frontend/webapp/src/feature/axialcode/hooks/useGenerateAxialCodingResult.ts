import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateAxialCodingResults,
  type GenerateAxialCodesDto,
} from '../../../shared/api/axialCode.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import type { LlmStatus } from '../../../shared/types/settings.ts';

export const useGenerateAxialCodingResults = (projectId: string, projectVersionId: string) => {
  const queryClient = useQueryClient();

  const recheckStatus = () => {
    queryClient.setQueryData<LlmStatus>(QUERY_KEYS.settings.llmStatus, (old) => {
      if (!old) return old;
      return { ...old, isConnected: undefined };
    });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings.llmStatus });
  };

  return useMutation({
    mutationFn: (dto: GenerateAxialCodesDto) =>
      generateAxialCodingResults(projectId, projectVersionId, dto),
    onError: () => {
      const status = queryClient.getQueryData<LlmStatus>(QUERY_KEYS.settings.llmStatus);
      if (status?.isConnected !== false) {
        recheckStatus();
      }
    },
    onSuccess: () => {
      const status = queryClient.getQueryData<LlmStatus>(QUERY_KEYS.settings.llmStatus);
      if (status?.isConnected !== true) {
        recheckStatus();
      }
    },
  });
};
