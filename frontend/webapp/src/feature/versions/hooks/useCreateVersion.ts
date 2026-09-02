import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import type { CreateVersionDto } from '../../../shared/types/version.dto.ts';
import { createVersion } from '../../../shared/api/versions.ts';
import type { Version } from '../../../shared/types/version.ts';
import { ApiError } from '../../../shared/types/ApiError.ts';
import type { Project } from '../../../shared/types/project.ts';

export function useCreateVersion() {
  const queryClient = useQueryClient();

  return useMutation<Version, ApiError, CreateVersionDto>({
    mutationFn: (payload: CreateVersionDto) => createVersion(payload),
    onSuccess: (newVersion) => {
      queryClient.setQueryData(
        QUERY_KEYS.projects.detail(newVersion.projectId),
        (old: Project | undefined) => {
          return {
            ...(old ?? {}),
            versions: old ? [...(old.versions ?? []), newVersion] : [newVersion],
          };
        }
      );
    },
    onError: (error) => {
      console.error(error);
    },
  });
}
