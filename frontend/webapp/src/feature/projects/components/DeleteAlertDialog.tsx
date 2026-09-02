import { AlertDialog, Button, Callout, Flex, Spinner, Text, TextField } from '@radix-ui/themes';
import { Info } from 'lucide-react';
import { useMemo, useState } from 'react';

type DeleteAlertDialogProps = {
  projectName: string;
  onDelete: () => void;
  isPending: boolean;
  isError: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export function DeleteAlertDialog({
  projectName,
  onDelete,
  isPending,
  isError,
  isOpen,
  setIsOpen,
}: Readonly<DeleteAlertDialogProps>) {
  const [confirmationName, setConfirmationName] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmedProjectName = useMemo(() => projectName.trim(), [projectName]);
  const isNameMatch = confirmationName.trim() === trimmedProjectName;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmationName('');
      setTouched(false);
    }

    setIsOpen(open);
  };

  const showMismatch = touched && confirmationName.trim().length > 0 && !isNameMatch;

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialog.Trigger>
        <Button variant={'solid'} color="red" disabled={isPending}>
          Delete
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>Delete the project</AlertDialog.Title>
        <AlertDialog.Description size="2">
          This will permanently remove the project and all its data. This action cannot be undone.
        </AlertDialog.Description>

        <Flex direction="column" gap="1" mt="3">
          <Text as="label" size="2" weight="medium" htmlFor="project-delete-confirmation">
            Type <Text weight="bold">{trimmedProjectName}</Text> to confirm
          </Text>
          <TextField.Root
            id="project-delete-confirmation"
            value={confirmationName}
            onChange={(e) => {
              setConfirmationName(e.target.value);
              setTouched(true);
            }}
            onBlur={() => setTouched(true)}
            placeholder="Project name"
            autoComplete="off"
            disabled={isPending}
          />
          <Text size="1" color={showMismatch ? 'red' : 'gray'}>
            {showMismatch
              ? 'Project name does not match.'
              : 'Delete is enabled only after an exact match.'}
          </Text>
        </Flex>

        {isPending && (
          <Callout.Root color="blue" size="1" mt="3">
            <Callout.Icon>
              <Spinner />
            </Callout.Icon>
            <Callout.Text>
              Deletion in progress. This may take a moment as all associated data is being
              removed...
            </Callout.Text>
          </Callout.Root>
        )}

        {isError && (
          <Callout.Root color="red" size="1" mt="3">
            <Callout.Icon>
              <Info />
            </Callout.Icon>
            <Callout.Text>Deleting the project failed. Please try again.</Callout.Text>
          </Callout.Root>
        )}

        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray" disabled={isPending}>
              Cancel
            </Button>
          </AlertDialog.Cancel>

          <Button
            variant="solid"
            color="red"
            onClick={onDelete}
            disabled={isPending || !isNameMatch}
            style={{
              minWidth: isPending ? '140px' : undefined,
            }}
          >
            Delete project
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
