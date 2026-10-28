import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editRawLLMOutput } from '../../../shared/api/rawllmoutput.ts';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';

type editRawLLMOutputPayload = {
    projectId: string;
    projectVersionId: string;
    rawLLMOutputId: string;
    name: string;
};

export function useEditRawLLMOutput() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: editRawLLMOutputPayload) =>
            editRawLLMOutput(
                payload.projectId,
                payload.projectVersionId,
                payload.rawLLMOutputId,
                payload.name
            ),
        onSuccess: async (_data, variables) => {
            await queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.rawLLMOutputs(variables.projectVersionId),
            });
        }
    });
}