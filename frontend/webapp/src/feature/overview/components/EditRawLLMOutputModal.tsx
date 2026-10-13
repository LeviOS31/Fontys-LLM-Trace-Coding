import { Button, Callout, Flex, Spinner, Text, TextField, Tooltip } from '@radix-ui/themes';
import { Info } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Modal from '../../../shared/components/Modal.tsx';
import { useEditRawLLMOutput } from '../hooks/useEditRawLLMOutput.ts';
// import { DeleteRawLLMOutputAlert } from './DeleteRawLLMOutputAlert.tsx';
import { isTyping } from '../../../shared/util/shortcutHelpers.ts';

type EditRawLLMOutputModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    projectVersionId: string;
    rawLLMOutputId: string;
    rawLLMOutputName: string;
}

export function EditRawLLMOutputModal({
    open,
    onOpenChange,
    projectId,
    projectVersionId,
    rawLLMOutputId,
    rawLLMOutputName,
}: Readonly<EditRawLLMOutputModalProps>) {
    const [nameOverride, setNameOverride] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const {
        mutate: editRawLLMOutput,
        isPending: isEditPending,
        isError: isEditError,
        reset: resetEdit,
    } = useEditRawLLMOutput();

    // const {
    //     mutate: deleteRawLLMOutput,
    //     isPending: isDeletePending,
    //     isError: isDeleteError,
    // } = useDeleteRawLLMOutput();

    const name = nameOverride ?? rawLLMOutputName;
    const trimmedName = name.trim();
    const isBusy = isEditPending;
    const hasChanges = trimmedName !== rawLLMOutputName.trim();
    const canSave = trimmedName.length > 0 && hasChanges && !isBusy;

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen) {
                setNameOverride(null);
                setDeleteDialogOpen(false);
                resetEdit();
            }
            onOpenChange(nextOpen);
        },
        [onOpenChange, resetEdit]
    );

    const handleSubmit = () => {
        if (!canSave) return;
        editRawLLMOutput(
            {
                projectId,
                projectVersionId,
                rawLLMOutputId,
                name: trimmedName,
            }, 
            {
                onSuccess: () => handleOpenChange(false)
            }
        );
    }

    return(
        <Modal open={open} onOpenChange={handleOpenChange} title="Edit Raw LLM Output">
            <Flex direction="column" gap="3">
                {isEditError && (
                    <Callout.Root color="red" size="1">
                        <Callout.Icon>
                        <Info />
                        </Callout.Icon>
                        <Callout.Text>Updating the collection failed. Please try again.</Callout.Text>
                    </Callout.Root>
                )}

                <Flex direction="column" gap="1">
                    <Text as="label" size="2" weight="bold" htmlFor="raw-llm-output-name">
                        Name
                    </Text>
                    <TextField.Root
                        id="raw-llm-output-name"
                        value={name}
                        onChange={(e) => setNameOverride(e.target.value)}
                        disabled={isBusy}
                        autoComplete="off"
                    />
                </Flex>
            </Flex>
            <Flex direction="row" mt="5" gap="1">
                <Flex style={{ marginLeft: 'auto' }} gap="2">
                    <Tooltip content="Press Escape to cancel">
                        <Button
                            variant="soft"
                            color="gray"
                            disabled={isBusy}
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancel
                        </Button>
                    </Tooltip>

                    <Tooltip content = "Press Ctrl + Enter to save">
                        <Button variant="solid" disabled={!canSave} onClick={handleSubmit}>
                            {isEditPending ? (
                                <>
                                    <Spinner size="1"/>
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </Tooltip>
                </Flex>
            </Flex>
        </Modal>
           
    )
}