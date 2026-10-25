import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import type { ImportRawLLMOutputDto } from '../../../shared/types/rawllmoutput.dto.ts';
import { ImportRawLLMOutput } from '../../../shared/api/rawllmoutput.ts';


export function useImportRawLLMOutput() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ImportRawLLMOutputDto) => ImportRawLLMOutput(payload),
        onSuccess: async (_data, variables) => {
            await queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.rawLLMOutputs(variables.projectVersionId),
            });
        },
        onError: (error) => {
            console.error(error);
        }
    });
        
}