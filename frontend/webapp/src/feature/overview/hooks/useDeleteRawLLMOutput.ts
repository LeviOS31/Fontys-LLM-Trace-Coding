import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/api/queryKeys.ts';
import { deleteRawLLMOutput } from '../../../shared/api/rawllmoutput.ts';
import type { TraceCollectionOverview } from '../../../shared/types/trace.ts';

type DeleteRawLLMOutputVariables = {
    projectId: string;
    projectVersionId: string;
    rawLLMOutputId: string;
}

export function useDeleteRawLLMOutput() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, DeleteRawLLMOutputVariables>({
        mutationFn: ({ projectId, projectVersionId, rawLLMOutputId }) =>
            deleteRawLLMOutput(projectId, projectVersionId, rawLLMOutputId),
        onSuccess: (_, variables) => {
            queryClient.setQueryData(
                QUERY_KEYS.rawLLMOutputs(variables.projectVersionId),
                (old: TraceCollectionOverview[] | undefined) => {
                    if (!old) return old;

                    return old.filter(
                        (rawLLMOutput) => rawLLMOutput.traceCollectionId !== variables.rawLLMOutputId
                    );
                }
            );

            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.rawLLMOutputs(variables.projectVersionId),
            });
        },
        onError: (error) => {
            console.error(error);
        }
    });
}