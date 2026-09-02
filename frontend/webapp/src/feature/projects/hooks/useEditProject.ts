import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editProject } from '../../../shared/api/projects.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import type { Projects } from '../../../shared/types/projects.ts';
import type { EditProjectDto } from '../../../shared/types/project.dto.ts';

export function useEditProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EditProjectDto) => editProject(payload),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(QUERY_KEYS.projects.all, (old: Projects | undefined) => {
        if (!old) return old;

        return {
          ...old,
          projects: old.projects.map((p) =>
            p.projectId === updatedProject.projectId ? updatedProject : p
          ),
        };
      });

      queryClient.setQueryData(
        QUERY_KEYS.projects.detail(updatedProject.projectId),
        updatedProject
      );
    },
    onError: (error) => {
      console.error(error);
    },
  });
}
