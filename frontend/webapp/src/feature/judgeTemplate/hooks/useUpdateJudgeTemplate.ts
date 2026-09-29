import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateJudgeTemplate } from '../../../shared/api/judgeTemplates.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';

interface UpdatePayload {
  judgeTemplateId: string;
  content: string;
}

export const useUpdateJudgeTemplate = (projectId: string, projectVersionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ judgeTemplateId, content }: UpdatePayload) =>
      updateJudgeTemplate(projectId, projectVersionId, judgeTemplateId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.judgeTemplates.byVersion(projectVersionId),
      });
    },
  });
};