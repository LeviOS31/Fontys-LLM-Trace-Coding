import { useQuery } from '@tanstack/react-query';
import {
  getCurrentAxialCodesOfVersion,
  type CurrentAxialCodesResponse,
} from '../../../shared/api/axialCode.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';

export const useGetCurrentAxialCodesOfVersion = (
  projectId: string,
  projectVersionId: string,
  enabled: boolean = true
) => {
  return useQuery<CurrentAxialCodesResponse>({
    queryKey: QUERY_KEYS.axialCoding.currentAxialCodesOfVersion(projectVersionId),
    queryFn: () => getCurrentAxialCodesOfVersion(projectId, projectVersionId),
    enabled,
  });
};
