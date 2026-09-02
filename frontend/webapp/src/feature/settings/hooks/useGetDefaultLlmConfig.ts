import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { getDefaultLlmConfig } from '../../../shared/api/settings.ts';

export function useGetDefaultLlmConfig() {
  return useQuery({
    queryKey: QUERY_KEYS.settings.llmDefaultConfig,
    queryFn: () => getDefaultLlmConfig(),
  });
}
