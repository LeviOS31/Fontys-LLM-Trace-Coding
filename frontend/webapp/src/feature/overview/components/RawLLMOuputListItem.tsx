import { Button, Flex, Text } from '@radix-ui/themes';
import { ArrowRightLeft, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router';
import { formatTraceDate } from '../../../shared/util/formatTraceDate.ts';
import './CollectionListItem.css';
import { useState } from 'react';
import type { RawLLMOutput } from '../../../shared/types/RawLLMOutput.ts';
import { EditRawLLMOutputModal } from './EditRawLLMOutputModal.tsx';

interface RawLLMOutputListItemProps {
    readonly rawLLMOutput: RawLLMOutput;
    readonly showDivider: boolean;
    readonly versionId: string;
    readonly projectId: string;
}

export default function RawLLMOutputListItem({
    rawLLMOutput,
    showDivider,
    versionId,
    projectId,
}: Readonly<RawLLMOutputListItemProps>) {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(
            `/projects/${projectId}/versions/${versionId}/raw-llm-output/${rawLLMOutput.rawLLMOutputId}`
        );
    };

    return (
        <>  
            <Flex
                align="center"
                justify="between"
                gap="4"
                py="3"
                onClick={handleClick}
                className="raw-llm-output-list-item"
                style={{ borderBottom: showDivider ? '1px solid var(--gray-a4)' : undefined }}
            >
                <Flex align="center" gap="3">
                    <Flex
                        align="center"
                        justify="center"
                        className="raw-llm-output-list-item__icon"
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-2)',
                            background: 'var(--gray-a3)',
                            flexShrink: 0,
                            transition: 'background 120ms ease',
                        }}
                    >
                        <ArrowRightLeft size={14} style={{ color: 'var(--gray-11)' }} />
                    </Flex>
                    
                    <Flex direction="column" gap="1">
                        <Text size="2" weight="bold">
                            {rawLLMOutput.name}
                        </Text>
                        <Text size="1" color="gray">
                            {formatTraceDate(rawLLMOutput.createdAt)}
                        </Text>
                    </Flex>
                </Flex>

                <Flex align="center" gap="4" style={{ flexShrink: 0 }}>
                    <Button
                        variant="ghost"
                        color="gray"
                        aria-label="Edit raw LLM output"
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditDialogOpen(true);
                        }}
                    >
                        <Pencil size={16} />
                    </Button>
                </Flex>
            </Flex>
            <EditRawLLMOutputModal
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                projectId={projectId}
                projectVersionId={versionId}
                rawLLMOutputId={rawLLMOutput.rawLLMOutputId}
                rawLLMOutputName={rawLLMOutput.name}
            />
        </>
    );
}