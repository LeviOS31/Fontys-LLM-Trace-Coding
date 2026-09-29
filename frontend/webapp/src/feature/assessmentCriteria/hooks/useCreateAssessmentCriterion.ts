import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { createAssessmentCriterion } from '../../../shared/api/assessmentCriteria.ts';
import type { Project } from '../../../shared/types/project.ts';


export function useCreateAssessmentCriterion(projectId: string) {
  const queryClient = useQueryClient();

  if (!projectId) throw new Error('Project ID is required to create an assessment criterion');

  return useMutation({
    mutationFn: (criterion: string) =>
      createAssessmentCriterion({
        criterion,
        projectId,
      }),
    onSuccess: (assessmentCriterion) => {
      queryClient.setQueryData(
        QUERY_KEYS.projects.detail(projectId),
        (old: Project | undefined) => {
          if (!old) return old;

          return {
            ...old,
            assessmentCriteria: [...old.assessmentCriteria, assessmentCriterion],
          };
        }
      );

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projects.detail(projectId),
      });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}


