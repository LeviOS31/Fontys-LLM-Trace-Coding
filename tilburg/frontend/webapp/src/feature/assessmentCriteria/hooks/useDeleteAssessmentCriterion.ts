import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { useParams } from 'react-router';
import { deleteAssessmentCriterion } from '../../../shared/api/assessmentCriteria.ts';
import type { Project } from '../../../shared/types/project.ts';
import { useState } from 'react';

interface PageParams extends Record<string, string | undefined> {
  id: string | undefined;
}

export function useDeleteAssessmentCriterion() {
  const queryClient = useQueryClient();
  const { id: projectId } = useParams<PageParams>();
  const [criterionId, setCriterionId] = useState<string | null>(null);

  if (!projectId) throw new Error('Project ID is required to delete an assessment criterion');

  return useMutation({
    mutationFn: (criterionId: string) => {
      setCriterionId(criterionId);
      return deleteAssessmentCriterion({
        criterionId,
        projectId,
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(
        QUERY_KEYS.projects.detail(projectId),
        (old: Project | undefined) => {
          if (!old) return old;

          return {
            ...old,
            assessmentCriteria: old.assessmentCriteria.filter((c) => c.criterionId !== criterionId),
          };
        }
      );
    },
    onError: (error) => {
      console.error(error);
    },
  });
}
