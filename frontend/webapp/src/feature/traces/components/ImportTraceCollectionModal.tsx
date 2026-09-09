import { useEffect, useState } from 'react';
import { Button, Callout, Dialog, Flex, Spinner, Text, TextField, Tooltip } from '@radix-ui/themes';
import { Info, Upload } from 'lucide-react';
import Modal from '../../../shared/components/Modal.tsx';
import { useImportTraceCollection } from '../hooks/useImportTraceCollection.ts';
import {
  TRACE_COLLECTION_NAME_MIN_LENGTH,
  TRACE_COLLECTION_NAME_MAX_LENGTH,
} from '../../../shared/types/trace.ts';

type ImportTraceCollectionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectVersionId: string;
  projectId: string;
};

export default function ImportTraceCollectionModal({
  open,
  onOpenChange: setOpen,
  projectId,
  projectVersionId,
}: Readonly<ImportTraceCollectionModalProps>) {
  const { mutate, isPending, isError, error, reset } = useImportTraceCollection();

  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileTooLargeError, setFileTooLargeError] = useState(false);

  const isNameValid = name.trim().length >= TRACE_COLLECTION_NAME_MIN_LENGTH;
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
      title={'Import Trace Collection'}
      description={'Upload a trace file to import all the traces in the current version.'}
      onKeyDown={handleGlobalKeyDown}
    >
      <Flex direction="column" gap="4">
        {isError && (
          <Callout.Root color="red" size="1">
            <Callout.Icon>
              <Info />
            </Callout.Icon>
            <Callout.Text>
              {error instanceof Error ? error.message : 'Import failed. Please try again.'}
            </Callout.Text>
          </Callout.Root>
        )}

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="trace-collection-name">
            Name <Text color="red">*</Text>
          </Text>
          <TextField.Root
            id="trace-collection-name"
            placeholder="e.g. May load tests"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={TRACE_COLLECTION_NAME_MAX_LENGTH}
            autoComplete="off"
            disabled={isPending}
          />
          <Text
            size="1"
            color={
              name.length > 0 && name.trim().length < TRACE_COLLECTION_NAME_MIN_LENGTH
                ? 'red'
                : 'gray'
            }
          >
            {name.length}/{TRACE_COLLECTION_NAME_MAX_LENGTH} (min {TRACE_COLLECTION_NAME_MIN_LENGTH}
            )
          </Text>
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="trace-file">
            File
            <Text color="gray"> (Max 500 MB)</Text>
            <Text color="red">*</Text>
          </Text>
          <Text size="1" color="gray">
            Supported formats: .json or .jsonl (OTLP trace export)
          </Text>
          <input
            id="trace-file"
            type="file"
            onChange={(e) => {
              setFileTooLargeError(false);
              setFile(e.target.files?.[0] ?? null);
              if (!name.trim()) setName(e.target.files?.[0]?.name.replace(/\.[^/.]+$/, '') ?? '');

              if (e.target.files?.[0] && e.target.files[0].size > 500 * 1024 * 1024) {
                setFile(null);
                setFileTooLargeError(true);
              }
            }}
            disabled={isPending}
            style={{
              border: '1px solid var(--gray-7)',
              borderRadius: '6px',
              padding: '8px 10px',
            }}
          />
          {fileTooLargeError ? (
            <Text size="1" color="red">
              File is too large. Please select a file smaller than 500 MB.
            </Text>
          ) : (
            <Text size="1" color="gray">
              {file ? file.name : 'No file selected'}
            </Text>
          )}
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
                Import trace collection
              </Flex>
            )}
          </Button>
        </Tooltip>
      </Flex>
    </Modal>
  );
}
