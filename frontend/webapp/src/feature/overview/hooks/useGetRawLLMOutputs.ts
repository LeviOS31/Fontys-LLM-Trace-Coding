import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { getRawLLMOutputs } from '../../../shared/api/rawllmoutput.ts';

export function useGetRawLLMOutputs(
    projectId: string | undefined,
    versionId: string | undefined
){
    const enabled = !!projectId && !!versionId;

    return useQuery({
        queryKey: enabled ? QUERY_KEYS.rawLLMOutputs(versionId) : ['rawLLMOutputs', 'disabled'],
        queryFn: enabled ? () => getRawLLMOutputs(projectId, versionId) : undefined,
        enabled,
    });
}