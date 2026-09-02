import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { useParams } from 'react-router';
import { updateAssessmentCriterion } from '../../../shared/api/assessmentCriteria.ts';
import type { Project } from '../../../shared/types/project.ts';

interface PageParams extends Record<string, string | undefined> {
  id: string | undefined;
}

export function useUpdateAssessmentCriterion() {
  const queryClient = useQueryClient();
  const { id: projectId } = useParams<PageParams>();

  if (!projectId) throw new Error('Project ID is required to update an assessment criterion');

  return useMutation({
    mutationFn: ({ criterionId, criterion }: { criterionId: string; criterion: string }) =>
      updateAssessmentCriterion({
        projectId,
        criterionId,
        criterion,
      }),
    onSuccess: (updatedCriterion) => {
      queryClient.setQueryData(
        QUERY_KEYS.projects.detail(projectId),
        (old: Project | undefined) => {
          if (!old) return old;

          return {
            ...old,
            assessmentCriteria: old.assessmentCriteria.map((c) =>
              c.criterionId === updatedCriterion.criterionId ? updatedCriterion : c
            ),
          };
        }
      );
    },
    onError: (error) => {
      console.error(error);
    },
  });
}
