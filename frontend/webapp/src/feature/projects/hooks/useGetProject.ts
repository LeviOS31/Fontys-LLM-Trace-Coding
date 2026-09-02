import { useQuery } from '@tanstack/react-query';
import { getProject } from '../../../shared/api/projects.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';

export function useGetProject(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.projects.detail(id!),
    queryFn: () => getProject(id!),
    enabled: !!id,
  });
}
