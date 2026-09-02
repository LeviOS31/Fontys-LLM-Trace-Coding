import { useQuery } from '@tanstack/react-query';
import { getAllProjects } from '../../../shared/api/projects.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';

export function useGetAllProjects() {
  return useQuery({
    queryKey: QUERY_KEYS.projects.all,
    queryFn: getAllProjects,
  });
}
