import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteJudgeTemplate } from '../../../shared/api/judgeTemplates.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';

export const useDeleteJudgeTemplate = (projectId: string, projectVersionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (judgeTemplateId: string) =>
      deleteJudgeTemplate(projectId, projectVersionId, judgeTemplateId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.judgeTemplates.byVersion(projectVersionId),
      });
    },
  });
};
