import { useEffect, useState } from 'react';
import { Button, Callout, Dialog, Flex, Spinner, Text, TextField, Tooltip } from '@radix-ui/themes';
import { Info, Upload } from 'lucide-react';
import Modal from '../../../shared/components/Modal.tsx';
import { useImportRawLLMOutput } from '../hooks/UseImportRawLLMOutput.ts';

type ImportRawLLMOutputModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectVersionId: string;
    projectId: string;
};

export default function ImportRawLLMOutputModal({
    open,
    onOpenChange: setOpen,
    projectId,
    projectVersionId,
}: Readonly<ImportRawLLMOutputModalProps>) {
    const { mutate, isPending, isError, reset } = useImportRawLLMOutput();

    const [name, setName] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const isNameValid = name.trim().length > 0;
    const isFileValid = !!file;
    const isSubmitDisabled = !isNameValid || !isFileValid || isPending;

    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setName('');
            setFile(null);
            reset();
        }
    }, [open, reset]);

    const handleSubmit = () => {
        if (!isNameValid || !file) {
            return;
        }

        mutate(
            {
                projectId,
                projectVersionId,
                name: name.trim(),
                file,
            },
            {
                onSuccess: () => {
                    setOpen(false);
                },
            }
        );
    };

    const handleGlobalKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit();
        }
    };

    return (
        <Modal
            open={open}
            onOpenChange={setOpen}
            title="Import raw LLM output"
            description="Import a raw LLM output file to the project version."
            onKeyDown={handleGlobalKeyDown}
        >
            <Flex direction="column" gap="4">
                {isError && (
                <Callout.Root color="red" size="1">
                    <Callout.Icon>
                        <Info />
                    </Callout.Icon>
                    <Callout.Text>Import failed. Please try again.</Callout.Text>
                </Callout.Root>
                )}

                <Flex direction="column" gap="1">
                    <Text as="label" size="2" weight="medium" htmlFor="raw-llm-output-name">
                        Name <Text color="red">*</Text>
                    </Text>
                    <TextField.Root
                        id="raw-llm-output-name"
                        placeholder="Enter a name for the raw LLM output"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="off"
                        disabled={isPending}
                    />
                    <Text
                        size="1"
                        color={isNameValid ? 'gray' : 'red'}
                    >
                        {isNameValid ? 'Enter a name for the raw LLM output.' : 'Name is required.'}
                    </Text>
                </Flex>
                <Flex direction="column" gap="1">
                    <Text as="label" size="2" weight="medium" htmlFor="raw-llm-output-file">
                        File <Text color="red">*</Text>
                    </Text>
                    <input
                        id="raw-llm-output-file"
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                            setFile(e.target.files?.[0] ?? null);
                            if (!name.trim()) {
                                setName(e.target.files?.[0]?.name.replace(/\.[^/.]+$/, '') ?? '');
                            }
                        }}
                        disabled={isPending}
                        style={{
                        border: '1px solid var(--gray-7)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        }}
                    />
                    <Text
                        size="1"
                        color={isFileValid ? 'gray' : 'red'}
                    >
                        {isFileValid ? 'Select a raw LLM output file to import.' : 'File is required.'}
                    </Text>
                </Flex>
            </Flex>
            <Flex justify="end" mt="5" gap="2">
                <Dialog.Close>
                    <Tooltip content="Press Escape to cancel">
                        <Button variant="soft" color="gray" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                    </Tooltip>
                </Dialog.Close>
        
                <Tooltip content="Press Ctrl + Enter to submit">
                    <Button variant="solid" disabled={isSubmitDisabled} onClick={handleSubmit}>
                    {isPending ? (
                        <>
                            <Spinner size="1" />
                            Importing…
                        </>
                    ) : (
                        <Flex align="center" gap="2">
                            <Upload size={16} />
                            Import raw LLM output
                        </Flex>
                    )}
                    </Button>
                </Tooltip>
            </Flex>
        </Modal>

    );
}