import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import type { CreateOpencodeDto } from '../../../shared/types/opencode.dto.ts';
import { addOpencode } from '../../../shared/api/traces.ts';
import type { TraceGroupDetail } from '../../../shared/types/trace.ts';

interface AddOpencodeVariables extends CreateOpencodeDto {
  traceId: string;
}

export function useAddOpencode(projectId: string, projectVersionId: string, traceGroupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ traceId, ...payload }: AddOpencodeVariables) =>
      addOpencode(projectId, projectVersionId, traceId, payload),

    onSuccess: (_, variables) => {
      // The trace lives inside the cached trace group, keyed by traceGroupId.
      queryClient.setQueryData(
        QUERY_KEYS.traces.detail(traceGroupId),
        (old: TraceGroupDetail | undefined) => {
          if (!old) return old;
          return {
            ...old,
            traces: old.traces.map((t) =>
              t.traceId === variables.traceId ? { ...t, openCode: variables.openCode } : t
            ),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.traces.lists });
    },

    onError: (error) => {
      console.error(error);
    },
  });
}
