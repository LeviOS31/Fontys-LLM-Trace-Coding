import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { getRawLLMOutputById } from '../../../shared/api/rawllmoutput.ts';

export function useGetRawLLMOutputById(
    projectId: string | undefined,
    versionId: string | undefined,
    rawllmoutputId: string | undefined
){
    const enabled = !!projectId && !!versionId && !!rawllmoutputId;

    return useQuery({
        queryKey: enabled ? QUERY_KEYS.rawLLMOutputs(versionId) : ['rawLLMOutputById', 'disabled'],
        queryFn: enabled ? () => getRawLLMOutputById(projectId, versionId, rawllmoutputId) : undefined,
        enabled,
    });
}