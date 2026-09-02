import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setLlmConfig } from '../../../shared/api/settings.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { ApiError } from '../../../shared/types/ApiError.ts';
import type { LlmConfig, SetLlmConfigDto } from '../../../shared/types/settings.ts';

export function useSetLlmConfig() {
  const queryClient = useQueryClient();

  return useMutation<LlmConfig, ApiError, SetLlmConfigDto>({
    mutationFn: (payload: SetLlmConfigDto) => setLlmConfig(payload),
    onSuccess: (config) => {
      queryClient.setQueryData(QUERY_KEYS.settings.llmStatus, () => ({
        providerName: config.providerName ?? undefined,
        endpoint: config.endpoint ?? undefined,
        modelName: config.modelName ?? undefined,
        isConnected: undefined,
      }));
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings.llmStatus });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}
