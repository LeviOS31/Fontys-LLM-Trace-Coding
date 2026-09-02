import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { getOpenCodesByVersion } from '../../../shared/api/openCode.ts';

export const useGetOpenCodesByVersion = (projectId: string, projectVersionId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.axialCoding.openCodesByVersion(projectVersionId),
    queryFn: () => getOpenCodesByVersion(projectId, projectVersionId),
  });
};
