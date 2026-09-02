import { useQuery } from '@tanstack/react-query';
import { getJudgeTemplates } from '../../../shared/api/judgeTemplates.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import type { GetJudgeTemplatesResponse } from '../../../shared/types/judgeTemplate.ts';

export const useGetJudgeTemplates = (projectId: string, projectVersionId: string) => {
  return useQuery<GetJudgeTemplatesResponse>({
    queryKey: QUERY_KEYS.judgeTemplates.byVersion(projectVersionId),
    queryFn: () => getJudgeTemplates(projectId, projectVersionId),
    enabled: Boolean(projectId && projectVersionId),
  });
};
