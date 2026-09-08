import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createJudgeTemplate } from '../../../shared/api/judgeTemplates.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';

interface CreatePayload {
  axialCodeId: string;
  name: string;
  description: string;
}

export const useCreateJudgeTemplate = (projectId: string, projectVersionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ axialCodeId, name, description }: CreatePayload) =>
      createJudgeTemplate(projectId, projectVersionId, axialCodeId, { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.judgeTemplates.byVersion(projectVersionId),
      });
    },
  });
};
