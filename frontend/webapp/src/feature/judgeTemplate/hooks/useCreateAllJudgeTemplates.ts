import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createJudgeTemplate } from '../../../shared/api/judgeTemplates.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import type { AxialCode } from '../../../shared/types/axialCode.ts';
import type {
  CreateJudgeTemplatePayload,
  JudgeTemplate,
} from '../../../shared/types/judgeTemplate.ts';

export type SavedAxialCode = AxialCode & { axialCodeId: string };

export interface CreateAllJudgeTemplatesResult {
  createdCount: number;
  failedLabels: string[];
}

export const judgeTemplatePayload = (axialCode: AxialCode): CreateJudgeTemplatePayload => ({
  name: `Judge template - ${axialCode.label}`,
  description: axialCode.description,
});

/** The backend does not reject duplicates, so only these codes are safe to create in bulk. */
export const getAxialCodesWithoutTemplate = (
  axialCodes: AxialCode[],
  templates: JudgeTemplate[]
): SavedAxialCode[] => {
  const coveredIds = new Set(templates.filter((t) => !t.isDeprecated).map((t) => t.axialCodeId));
  return axialCodes.filter(
    (a): a is SavedAxialCode => Boolean(a.axialCodeId) && !coveredIds.has(a.axialCodeId as string)
  );
};

export const useCreateAllJudgeTemplates = (projectId: string, projectVersionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (axialCodes: SavedAxialCode[]): Promise<CreateAllJudgeTemplatesResult> => {
      const results = await Promise.allSettled(
        axialCodes.map((a) =>
          createJudgeTemplate(projectId, projectVersionId, a.axialCodeId, judgeTemplatePayload(a))
        )
      );
      const failedLabels = axialCodes
        .filter((_, index) => results[index].status === 'rejected')
        .map((a) => a.label);
      return { createdCount: axialCodes.length - failedLabels.length, failedLabels };
    },
    // Returned so the mutation stays pending until the list refreshes; a click on a
    // stale list would create the same templates twice.
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.judgeTemplates.byVersion(projectVersionId),
      }),
  });
};
