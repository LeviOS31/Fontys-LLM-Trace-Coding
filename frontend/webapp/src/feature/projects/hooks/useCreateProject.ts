import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProject } from '../../../shared/api/projects.ts';
import type { CreateProjectDto } from '../../../shared/types/project.dto.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import type { Projects } from '../../../shared/types/projects.ts';

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectDto) => createProject(payload),
    onSuccess: (newProject) => {
      queryClient.setQueryData(QUERY_KEYS.projects.all, (old: Projects | undefined) => {
        if (!old) {
          return { projects: [newProject] };
        }

        return {
          ...old,
          projects: [...old.projects, newProject],
        };
      });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}
