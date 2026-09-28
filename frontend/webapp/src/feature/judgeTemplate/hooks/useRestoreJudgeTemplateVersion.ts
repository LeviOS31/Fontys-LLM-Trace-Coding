import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restoreJudgeTemplateVersion } from '../../../shared/api/judgeTemplates.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';

interface RestorePayload {
  judgeTemplateId: string;
  versionNumber: number;
}

export const useRestoreJudgeTemplateVersion = (projectId: string, projectVersionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ judgeTemplateId, versionNumber }: RestorePayload) =>
      restoreJudgeTemplateVersion(projectId, projectVersionId, judgeTemplateId, versionNumber),
    onSuccess: (_data, { judgeTemplateId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.judgeTemplates.byVersion(projectVersionId),
      });
      queryClient.invalidateQueries({
        queryKey: ['judgeTemplateVersions', projectVersionId, judgeTemplateId],
      });
    },
  });
};