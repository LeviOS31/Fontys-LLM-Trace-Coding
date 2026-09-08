import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProject } from '../../../shared/api/projects.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import type { Projects } from '../../../shared/types/projects.ts';

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: (_, projectId) => {
      queryClient.setQueryData(QUERY_KEYS.projects.all, (old: Projects | undefined) => {
        if (!old) return old;

        return {
          ...old,
          projects: old.projects.filter((p) => p.projectId !== projectId),
        };
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projects.all,
      });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}
