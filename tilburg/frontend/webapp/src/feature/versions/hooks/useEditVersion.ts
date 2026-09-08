import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { editVersion } from '../../../shared/api/versions.ts';
import { ApiError } from '../../../shared/types/ApiError.ts';
import type { Project } from '../../../shared/types/project.ts';
import type { EditVersionDto } from '../../../shared/types/version.dto.ts';
import type { Version } from '../../../shared/types/version.ts';

export function useEditVersion() {
  const queryClient = useQueryClient();

  return useMutation<Version, ApiError, EditVersionDto>({
    mutationFn: (payload: EditVersionDto) => editVersion(payload),
    onSuccess: (updatedVersion) => {
      queryClient.setQueryData(
        QUERY_KEYS.projects.detail(updatedVersion.projectId),
        (old: Project | undefined) => {
          if (!old) return old;

          return {
            ...old,
            versions: old.versions.map((version) =>
              version.versionId === updatedVersion.versionId ? updatedVersion : version
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
