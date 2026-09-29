import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteJudgeTemplateVersion } from '../../../shared/api/judgeTemplates.ts';

interface DeletePayload {
  judgeTemplateId: string;
  versionNumber: number;
}

export const useDeleteJudgeTemplateVersion = (projectId: string, projectVersionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ judgeTemplateId, versionNumber }: DeletePayload) =>
      deleteJudgeTemplateVersion(projectId, projectVersionId, judgeTemplateId, versionNumber),
    onSuccess: (_data, { judgeTemplateId }) => {
      queryClient.invalidateQueries({
        queryKey: ['judgeTemplateVersions', projectVersionId, judgeTemplateId],
      });
    },
  });
};