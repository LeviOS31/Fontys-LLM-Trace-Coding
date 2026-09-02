import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { getLlmStatus } from '../../../shared/api/settings.ts';

export function useGetLlmStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.settings.llmStatus,
    queryFn: () => getLlmStatus(),
    refetchInterval: 60 * 5 * 1000, // 5 minutes
  });
}
