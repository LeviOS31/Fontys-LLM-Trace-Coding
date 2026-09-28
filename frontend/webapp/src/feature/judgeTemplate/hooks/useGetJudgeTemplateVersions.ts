import { useQuery } from '@tanstack/react-query';
import { getJudgeTemplateVersions } from '../../../shared/api/judgeTemplates.ts';

export const useGetJudgeTemplateVersions = (
  projectId: string,
  projectVersionId: string,
  judgeTemplateId: string,
  enabled: boolean
) =>
  useQuery({
    queryKey: ['judgeTemplateVersions', projectVersionId, judgeTemplateId],
    queryFn: () => getJudgeTemplateVersions(projectId, projectVersionId, judgeTemplateId),
    enabled,
  });