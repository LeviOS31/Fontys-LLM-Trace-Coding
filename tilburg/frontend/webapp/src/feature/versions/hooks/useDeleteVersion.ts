import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { deleteVersion } from '../../../shared/api/versions.ts';
import { ApiError } from '../../../shared/types/ApiError.ts';
import type { Project } from '../../../shared/types/project.ts';

type DeleteVersionInput = {
  projectId: string;
  versionId: string;
};

export function useDeleteVersion() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, DeleteVersionInput>({
    mutationFn: ({ projectId, versionId }: DeleteVersionInput) =>
      deleteVersion(projectId, versionId),
    onSuccess: (_, { projectId, versionId }) => {
      queryClient.setQueryData(
        QUERY_KEYS.projects.detail(projectId),
        (old: Project | undefined) => {
          if (!old) return old;

          return {
            ...old,
            versions: old.versions.filter((version) => version.versionId !== versionId),
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
