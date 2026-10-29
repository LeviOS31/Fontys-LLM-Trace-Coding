import type { RawLLMOutput } from '../../../shared/types/RawLLMOutput';
import { Box, Flex, Skeleton, Text, Button, Kbd } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { isTyping } from '../../../shared/util/shortcutHelpers.ts';
import RawLLMOutputListItem from './RawLLMOuputListItem.tsx';
import ImportRawLLMOutput from './ImportRawLLMOutput.tsx';

interface Props {
    readonly rawLLMOutputs: RawLLMOutput[] | undefined;
    readonly isLoading: boolean;
    readonly projectId: string;
    readonly projectVersionId: string;
}

export default function RawLLMOutputList({
    rawLLMOutputs,
    isLoading,
    projectId,
    projectVersionId,
}: Props){
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (isTyping()) return;

            // R → Open Raw LLM Output Import Modal
            if (e.key.toLowerCase() === 'R') {
                e.preventDefault();
                setIsImportModalOpen(true);
            }
        };

        globalThis.addEventListener('keydown', handleKey);
        return () => globalThis.removeEventListener('keydown', handleKey);
    }, []);

    return (
        <Box
            p="4"
            style={{
                borderRadius: 'var(--radius-4)',
                border: '1px solid var(--gray-a4)',
                background: 'var(--color-background)',
            }}
        >
            <Flex>
                <Text size="4" weight="bold" mb="3" as="div">
                    Raw LLM Outputs
                </Text>
                <Button
                    variant="soft"
                    onClick={() => setIsImportModalOpen(true)}
                    disabled={isLoading || !rawLLMOutputs}
                    style={{ marginLeft: 'auto' }}
                >
                    <Upload size={16} /> Import raw LLM output{' '}
                    <Kbd size="1" style={{ opacity: 0.6 }}>R</Kbd>
                </Button>
            </Flex>

            {isLoading && (
                <Flex direction="column" gap="3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} height="20px" width="100%" />
                    ))}
                </Flex>
            )}

            {!isLoading && (!Array.isArray(rawLLMOutputs) || rawLLMOutputs.length === 0) && (
                <Text size="3" color="gray" mt="2">
                    No raw LLM outputs imported yet.
                </Text>
            )}

            {!isLoading && 
            Array.isArray(rawLLMOutputs) &&
            rawLLMOutputs.map((output, i, arr) =>(
                <RawLLMOutputListItem
                    key={output.rawLLMOutputId}
                    rawLLMOutput={output}
                    showDivider={i < arr.length - 1}
                    versionId={projectVersionId}
                    projectId={projectId}
                />
            ))}

            <ImportRawLLMOutput
                open={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
                projectId={projectId}
                projectVersionId={projectVersionId}
            />
        </Box>
    );
}